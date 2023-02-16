import { applyPatches, enablePatches, Patch } from 'immer';
import { StorePort } from './StorePort';
import {
  RootState,
  SharedStoreSchema,
  createId,
  createInitialState,
  createFullValueResponse,
  createSuccessResponse,
  EventMessage,
  SharedStorePlugin,
  Selector,
  createSelectValueResponse,
  ISharedStore,
  SelectValueRequest,
  SelectValueResponse,
} from '@coalesce.dev/store-common';
import { get, set } from 'idb-keyval';

enablePatches();

function retargetPatches(patches: Patch[], key: string): Patch[] {
  return patches.map((p) => ({
    ...p,
    path: [key, ...p.path],
  }));
}

type Plugins<T extends Record<string, unknown>> = {
  [PluginId in keyof T & string]: SharedStorePlugin<T[PluginId]>;
};

export class SharedStore<
  T extends RootState,
  EntryTypes extends Record<string, unknown> = {}
> implements ISharedStore<T, EntryTypes>
{
  private _ports = new Set<StorePort<T>>();
  private readonly _instanceId: string;
  private _state!: T;
  private readonly _schema: SharedStoreSchema<T, EntryTypes>;
  private _deadPortTimeout = 60_000;
  private _storageKey = `SStore__${this.storeId}`;
  private readonly _init: Promise<void>;
  private _lastWriteTs = 0;
  private _writeInterval = 1000;
  private _writeTimeout: number | undefined;
  private _locks = new Map<string, PromiseLike<unknown>>();

  constructor(
    public readonly storeId: string,
    schema: SharedStoreSchema<T, EntryTypes>,
    private readonly _plugins: Plugins<EntryTypes>
  ) {
    this._instanceId = createId();
    this._schema = schema;
    this.startListening();

    this._init = (async () => {
      const ls = await get(this._storageKey);
      this._state = { ...createInitialState(schema), ...ls };
      console.log('Initial State:', this._state);
    })();
  }

  private startListening() {
    onconnect = (e) => {
      this._ports.add(
        new StorePort(this, e.ports[0], async (req) => {
          await this._init;
          switch (req.type) {
            case 'fv': {
              this.getSchemaEntry(req.data);
              return createFullValueResponse(req, this._state[req.data]);
            }
            case 'sv': {
              return await this.selectValueAsync(req);
            }
            case 'm': {
              const entry = this.getSchemaEntry(req.data.key);
              if (!entry.allowDirectMutation) {
                const message = `Schema does not allow direct mutation of key '${req.data.key}'`;
                console.error(message);
                throw new Error(message);
              }
              // TODO: should have some kind of incrementing version for each entry? Optimistic lock?
              //  maybe also a pessimistic option?
              this.applyPatches(
                retargetPatches(req.data.patches, req.data.key)
              );
              return createSuccessResponse(req);
            }
          }
        })
      );
    };
  }

  public async selectValueAsync(
    req: SelectValueRequest
  ): Promise<SelectValueResponse> {
    const entry = this.getSchemaEntry(req.data[0]);
    // TODO: this should probably be locking at any parent as well
    const lockKey = JSON.stringify(req.data);
    console.debug('Req', lockKey);
    while (this._locks.has(lockKey)) {
      console.debug('Lock on', lockKey);
      await this._locks.get(lockKey);
      console.debug('Unlock on', lockKey);
    }
    if ('pluginId' in entry) {
      const plugin = this._plugins[entry.pluginId];
      const intercept = plugin.intercept(req.data, entry, this);
      this._locks.set(lockKey, intercept);
      const val = await intercept;
      this._locks.delete(lockKey);
      console.debug(
        'Plugin',
        entry.pluginId,
        'handled',
        lockKey,
        'returning',
        val
      );
      return createSelectValueResponse(req, val);
    }
    return createSelectValueResponse(req, this.select(req.data));
  }

  public applyPatches(patches: Patch[]) {
    this._state = applyPatches(this._state, patches);
    this.broadcastEvent({
      stype: 'e',
      type: 'm',
      data: patches,
    });
    if (!this._writeTimeout) {
      this._writeTimeout = setTimeout(async () => {
        await this.persist();
      }, this._lastWriteTs - Date.now() + this._writeInterval);
    }
  }

  private async persist() {
    this._lastWriteTs = Date.now();
    this._writeTimeout = undefined;
    console.log('PERSISTING...');
    await set(this._storageKey, this._state);
    console.log('PERSISTED');
  }

  public select<T>(path: Selector) {
    let v: unknown = this.state;
    for (const part of path) {
      if (v == null || typeof v !== 'object') {
        v = undefined;
        break;
      }
      v = (v as Record<string | number, unknown>)?.[part];
    }
    return v as T;
  }

  public get state() {
    return this._state;
  }

  private getSchemaEntry(key: string) {
    const entry = this.schema.entries[key];
    if (!entry) {
      throw new Error(`Schema does not have an entry with key '${key}'`);
    }
    return entry;
  }

  public get deadPortTimeout() {
    return this._deadPortTimeout;
  }

  public get schema() {
    return this._schema;
  }

  public get instanceId() {
    return this._instanceId;
  }

  private broadcastEvent(msg: EventMessage) {
    for (const port of Array.from(this._ports)) {
      port.postMessage(msg);
    }
  }

  public getWatchCount(path: Selector) {
    return 1; // TODO
  }

  public killDeadPort(port: StorePort<T>) {
    console.debug('Killing dead port');
    this._ports.delete(port);
    port.close();
  }
}
