import {
  applyPatches,
  Draft,
  enablePatches,
  Patch,
  produceWithPatches,
} from 'immer';
import {
  ERR_TERM,
  ERR_TIMEOUT,
  EventMessage,
  RequestMessage,
  RootState,
  SharedStoreSchema,
  createInitialState,
  isTerminatedError,
  isTimeoutError,
  MutateEvent,
  InfoEvent,
  Selector,
} from '@coalesce.dev/store-common';
import { Path } from 'ts-toolbelt/out/Object/Path';
import { TrackedPromise } from './TrackedPromise';
import { MessageClient, MessageClientFactory } from './MessageClient';

const DEFAULT_TIMEOUT = 60_000;
const ALIVE_POLL_INTERVAL_MS = 2000;
const ALIVE_POLL_TIMEOUT_MS = 1500;
export const ALIVE_POLL_INIT_TIMEOUT_MS = DEFAULT_TIMEOUT;

enablePatches();

export class SharedStoreClient<T extends RootState> {
  private _messageClient!: MessageClient;
  private readonly _messageClientFactory: MessageClientFactory<T>;
  private readonly _schema: SharedStoreSchema<T>;
  private readonly _callbacks = new Map<
    number,
    [(d: unknown) => void, (reason?: unknown) => void]
  >();
  private readonly _eventCallbacks = new Map<
    EventMessage['type'],
    Set<(d: unknown) => void>
  >();
  private readonly _keyValueChangedCallbacks = new Map<
    keyof T & string,
    Set<() => void>
  >();
  private _alivePollHandle?: number;
  private _storeInstanceId?: string;

  private _state: T;

  private _isSynced = false;
  private _syncPromise?: Promise<void>;

  private _stable = new Map<string, TrackedPromise<unknown>>();

  constructor(
    workerFactory: MessageClientFactory<T>,
    schema: SharedStoreSchema<T>
  ) {
    this._messageClientFactory = workerFactory;
    this._schema = schema;
    this._state = createInitialState<T>(schema);
    this._syncPromise = this.reset();

    this.subscribeEvent<MutateEvent>('m', (d) => {
      this.applyPatches(d);
    });

    this.subscribeEvent<InfoEvent>('i', (d) => {
      this._storeInstanceId = d.instanceId;
    });
  }

  async sendKeepAlive(timeout = ALIVE_POLL_TIMEOUT_MS) {
    try {
      return await this.makeRequest({ type: 'a', id: -1 }, timeout, true);
    } catch (err) {
      if (isTerminatedError(err)) {
        return;
      }
      if (isTimeoutError(err)) {
        if ('document' in globalThis) {
          if (globalThis.document.hidden) {
            console.debug(
              'Worker is not responding, but document is hidden. Will not reset.'
            );
            return;
          }
        }
        console.error('Worker is not responding, will attempt to reset.');
        this._syncPromise = this.reset();
        return;
      } else {
        throw err;
      }
    }
  }

  async reset() {
    const startTime = performance.now();
    console.debug('Sync start...');
    this._isSynced = false;
    this._messageClient?.dispose();

    for (const [id, [, reject]] of Array.from(this._callbacks)) {
      reject(ERR_TERM);
      clearTimeout(id);
    }
    this._callbacks.clear();

    this._messageClient = this._messageClientFactory(this, (msg) => {
      if (msg.stype === 'r') {
        // Response
        clearTimeout(msg.id);
        const callback = this._callbacks.get(msg.id);
        if (!callback) {
          console.error('Invalid request ID:', msg.id);
        } else {
          this._callbacks.delete(msg.id);
          if (msg.type === 'e') callback[1](msg.data);
          else callback[0]('data' in msg ? msg.data : undefined);
        }
      } else {
        // Event
        const callbacks = this._eventCallbacks.get(msg.type);
        if (!callbacks) return;
        for (const cb of callbacks) {
          cb(msg.data);
        }
      }
    });

    clearInterval(this._alivePollHandle);

    await this._messageClient.init();

    this._alivePollHandle = setInterval(
      () => this.sendKeepAlive(),
      ALIVE_POLL_INTERVAL_MS
    ) as unknown as number;

    for (const entryKey in this._schema.entries) {
      if (this._schema.entries[entryKey].initialHydrate !== false)
        await this.refreshFullValue(entryKey);
    }
    this._isSynced = true;
    const endTime = performance.now();
    console.debug('Sync time:', endTime - startTime);
  }

  private applyPatches(d: Patch[]) {
    console.debug('PATCH', d);
    this._state = applyPatches(this._state, d);
    console.debug('NEW STATE', this._state);
    const affectedKeys = new Set(d.map((v) => v.path[0] as string));
    for (const key of affectedKeys) {
      const callbacks = this._keyValueChangedCallbacks.get(key);
      if (callbacks) {
        for (const cb of callbacks) {
          cb();
        }
      }
    }
  }

  subscribeKeyValueChange(key: keyof T & string, callback: () => void) {
    if (!this._keyValueChangedCallbacks.has(key)) {
      this._keyValueChangedCallbacks.set(key, new Set());
    }
    const callbacks = this._keyValueChangedCallbacks.get(key)!;

    callbacks.add(callback);

    return () => void callbacks.delete(callback);
  }

  private async makeRequest<T>(
    event: RequestMessage,
    timeout = DEFAULT_TIMEOUT,
    bypassSyncBarrier = false
  ): Promise<T> {
    if (!bypassSyncBarrier) await this._syncPromise;
    return new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        this._callbacks.delete(id);
        console.error('Timeout on request', id, event, timeout);
        reject(ERR_TIMEOUT);
      }, timeout) as unknown as number;
      this._callbacks.set(id, [resolve as (d: unknown) => void, reject]);
      this._messageClient.sendMessage({ ...event, id });
    });
  }

  private subscribeEvent<Event extends EventMessage>(
    type: Event['type'],
    callback: (data: Event['data']) => void
  ) {
    if (!this._eventCallbacks.has(type)) {
      this._eventCallbacks.set(type, new Set());
    }
    const callbacks = this._eventCallbacks.get(type) as Set<
      (data: EventMessage['data']) => void
    >;

    callbacks.add(callback);

    return () => void callbacks.delete(callback);
  }

  private async refreshFullValue(key: keyof T & string) {
    console.debug('Syncing', key);
    const result = await this.makeRequest(
      {
        type: 'fv',
        data: key,
        id: -1,
      },
      DEFAULT_TIMEOUT,
      true
    );
    this.applyPatches([{ path: [key], op: 'replace', value: result }]);
  }

  public async mutateValue<Key extends keyof T & string>(
    key: Key,
    recipe: (d: Draft<T[Key]>) => void
  ) {
    const [, patches] = produceWithPatches(
      this._state[key],
      (d) => void recipe(d)
    );
    await this.makeRequest({
      type: 'm',
      data: {
        key,
        patches,
      },
      id: -1,
    });
  }

  public getValue<Key extends keyof T & string>(key: Key): T[Key] {
    return this._state[key];
  }

  public async selectValue<S extends Selector>(selector: S) {
    const value = await this.makeRequest<Path<T, S>>({
      type: 'sv',
      data: selector,
      id: -1,
    });
    this.applyPatches([
      {
        path: selector as unknown as (string | number)[],
        op: 'replace',
        value,
      },
    ]);
    return value;
  }

  public selectValueTracked<S extends Selector>(
    selector: S
  ): TrackedPromise<Path<T, S>> {
    const key = 'S:' + JSON.stringify(selector);
    const existing = this._stable.get(key);
    if (existing) return existing as TrackedPromise<Path<T, S>>;
    const promise = new TrackedPromise(this.selectValue(selector));
    this._stable.set(key, promise);
    return promise;
  }

  public selectLocalValue<S extends Selector>(selector: S) {
    let v: unknown = this._state;
    for (const part of selector) {
      if (v == null || typeof v !== 'object') {
        v = undefined;
        break;
      }
      v = (v as Record<string | number, unknown>)?.[part];
    }
    return v as Path<T, S>;
  }

  public waitForSync() {
    return this._syncPromise;
  }
}
