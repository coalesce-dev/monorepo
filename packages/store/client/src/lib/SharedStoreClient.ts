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
  Selector,
} from '@coalesce.dev/store-common';
import { Path } from 'ts-toolbelt/out/Object/Path';
import { TrackedPromise } from './TrackedPromise';

const DEFAULT_TIMEOUT = 60_000;
const ALIVE_POLL_INTERVAL_MS = 2000;
const ALIVE_POLL_TIMEOUT_MS = 1500;
const ALIVE_POLL_INIT_TIMEOUT_MS = DEFAULT_TIMEOUT;

enablePatches();

export class SharedStoreClient<T extends RootState> {
  private _worker: SharedWorker | null = null;
  private _comm!: MessagePort | Worker;
  private readonly _workerFactory: () => SharedWorker | Worker;
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
    workerFactory: () => SharedWorker | Worker,
    schema: SharedStoreSchema<T>
  ) {
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
    const startTime = performance.now();
    console.debug('Sync start...');
    this._isSynced = false;
    this._worker?.port?.close();
    if (this._comm && 'terminate' in this._comm) this._comm.terminate();

    for (const [id, [, reject]] of Array.from(this._callbacks)) {
      reject(ERR_TERM);
      clearTimeout(id);
    }
    this._callbacks.clear();

    const worker = this._workerFactory();
    if ('terminate' in worker) {
      this._worker = null;
      this._comm = worker;
    } else {
      this._worker = worker;
      this._comm = worker.port;
    }

    clearInterval(this._alivePollHandle);

    const sendKeepAlive = (timeout = ALIVE_POLL_TIMEOUT_MS) => {
      return this.makeRequest({ type: 'a', id: -1 }, timeout, true).catch(
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
    };

    this._comm.onmessage = (e) => {
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

    await sendKeepAlive(ALIVE_POLL_INIT_TIMEOUT_MS);

    this._alivePollHandle = setInterval(
      () => sendKeepAlive(),
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
      this._comm.postMessage({ ...event, id });
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
