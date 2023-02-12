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
  ResponseMessage,
  RootState,
  SharedStoreSchema,
  createInitialState,
  isTerminatedError,
  isTimeoutError,
  MutateEvent,
  InfoEvent,
} from '@coalesce.dev/store-core';

const DEFAULT_TIMEOUT = 60_000;
const ALIVE_POLL_INTERVAL_MS = 1000;
const ALIVE_POLL_TIMEOUT_MS = 500;

enablePatches();

export class SharedStoreClient<T extends RootState> {
  private _worker!: SharedWorker;
  private readonly _workerFactory: () => SharedWorker;
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

  constructor(workerFactory: () => SharedWorker, schema: SharedStoreSchema<T>) {
    this._workerFactory = workerFactory;
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

  async reset() {
    this._isSynced = false;
    this._worker?.port?.close();

    for (const [id, [, reject]] of Array.from(this._callbacks)) {
      reject(ERR_TERM);
      clearTimeout(id);
    }
    this._callbacks.clear();

    this._worker = this._workerFactory();

    clearInterval(this._alivePollHandle);
    this._alivePollHandle = setInterval(() => {
      this.makeRequest({ type: 'a', id: -1 }, ALIVE_POLL_TIMEOUT_MS).catch(
        (err) => {
          if (isTerminatedError(err)) {
            return Promise.resolve(undefined);
          }
          if (isTimeoutError(err)) {
            console.error('Worker is not responding, will attempt to reset.');
            this._syncPromise = this.reset();
            return Promise.resolve();
          } else {
            return Promise.reject(err);
          }
        }
      );
    }, ALIVE_POLL_INTERVAL_MS) as unknown as number;

    this._worker.port.onmessage = (e) => {
      const event = e.data as ResponseMessage | EventMessage;
      if (event.stype === 'r') {
        // Response
        clearTimeout(event.id);
        const callback = this._callbacks.get(event.id);
        if (!callback) {
          console.error('Invalid request ID:', event.id);
        } else {
          this._callbacks.delete(event.id);
          if (event.type === 'e') callback[1](event.data);
          else callback[0]('data' in event ? event.data : undefined);
        }
      } else {
        // Event
        const callbacks = this._eventCallbacks.get(event.type);
        if (!callbacks) return;
        for (const cb of callbacks) {
          cb(event.data);
        }
      }
    };

    for (const entryKey in this._schema.entries) {
      await this.refreshFullValue(entryKey);
    }
    this._isSynced = true;
    console.debug('Sync complete.');
  }

  private applyPatches(d: Patch[]) {
    this._state = applyPatches(this._state, d);
    // TODO: notify subscribers
    const affectedKeys = new Set(d.map((v) => v.path[0] as string));
    for (const key of affectedKeys) {
      console.debug('Key', key, 'affected by mutation');
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

  makeRequest<T>(event: RequestMessage, timeout = DEFAULT_TIMEOUT): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        this._callbacks.delete(id);
        console.error('Timeout on request', id, event);
        reject(ERR_TIMEOUT);
      }, timeout) as unknown as number;
      this._callbacks.set(id, [resolve as (d: unknown) => void, reject]);
      this._worker.port.postMessage({ ...event, id });
    });
  }

  subscribeEvent<Event extends EventMessage>(
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
    const result = await this.makeRequest({
      type: 'fv',
      data: key,
      id: -1,
    });
    console.debug('Key:', key, 'Refreshed:', result);
    this.applyPatches([{ path: [key], op: 'replace', value: result }]);
  }

  public async mutateValue<Key extends keyof T & string>(
    key: Key,
    recipe: (d: Draft<T[Key]>) => void
  ) {
    const [, patches] = produceWithPatches(this._state[key], recipe);
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

  public waitForSync() {
    return this._syncPromise;
  }
}
