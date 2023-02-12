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
} from '@coalesce.dev/store-core';

enablePatches();

function retargetPatches(patches: Patch[], key: string): Patch[] {
  return patches.map((p) => ({
    ...p,
    path: [key, ...p.path],
  }));
}

export class SharedStore<T extends RootState> {
  private _ports = new Set<StorePort<T>>();
  private readonly _instanceId: string;
  private _state: RootState;
  private readonly _schema: SharedStoreSchema<T>;
  private _deadPortTimeout = 60_000;

  constructor(storeId: string, schema: SharedStoreSchema<T>) {
    this._instanceId = createId();
    this._schema = schema;
    this._state = createInitialState(schema);
    console.log('Initial State:', this._state);

    onconnect = (e) => {
      this._ports.add(
        new StorePort(this, e.ports[0], async (req) => {
          switch (req.type) {
            case 'fv': {
              this.getSchemaEntry(req.data);
              return createFullValueResponse(req, this._state[req.data]);
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

  private applyPatches(patches: Patch[]) {
    this._state = applyPatches(this._state, patches);
    console.log('Patches:', patches, 'New State:', this._state);
    this.broadcastEvent({
      stype: 'e',
      type: 'm',
      data: patches,
    });
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

  killDeadPort(port: StorePort<T>) {
    console.debug('Killing dead port');
    this._ports.delete(port);
    port.close();
  }
}
