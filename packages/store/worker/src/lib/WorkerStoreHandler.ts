import { StorePort } from './StorePort';
import {
  createInitialState,
  EventMessage,
  RootState,
  SharedStore,
  StoreHandler,
} from '@coalesce.dev/store-common';
import { get, set } from 'idb-keyval';

export class WorkerStoreHandler<T extends RootState>
  implements StoreHandler<T>
{
  private _store!: SharedStore<T>;
  private _ports = new Set<StorePort<T>>();
  private _deadPortTimeout = 60_000;
  private _storageKey!: string;
  private _lastWriteTs = 0;
  private _writeInterval = 1000;
  private _writeTimeout: number | undefined;

  async init(store: SharedStore<T>) {
    this._store = store;
    this._storageKey = `SStore__${this._store.storeId}`;
    this.startListening();
    const ls = await get(this._storageKey);
    this._store.state = { ...createInitialState(this._store.schema), ...ls };
    console.log('Initial State:', this._store.state);
  }

  private startListening() {
    if ('onconnect' in globalThis) {
      onconnect = (e) => {
        this._ports.add(
          new StorePort(
            this,
            e.ports[0],
            this.store.handleMessage.bind(this.store)
          )
        );
      };
    } else {
      this._ports.add(
        new StorePort(
          this,
          globalThis,
          this.store.handleMessage.bind(this.store)
        )
      );
    }
  }

  public get store() {
    return this._store;
  }

  public get deadPortTimeout() {
    return this._deadPortTimeout;
  }

  public broadcastEvent(msg: EventMessage) {
    for (const port of Array.from(this._ports)) {
      port.postMessage(msg);
    }
  }

  public killDeadPort(port: StorePort<T>) {
    console.debug('Killing dead port');
    this._ports.delete(port);
    port.close();
  }

  private async persist() {
    this._lastWriteTs = Date.now();
    this._writeTimeout = undefined;
    console.log('PERSISTING...');
    await set(this._storageKey, this._store.state);
    console.log('PERSISTED');
  }

  public notifyMutation() {
    if (!this._writeTimeout) {
      this._writeTimeout = setTimeout(async () => {
        await this.persist();
      }, this._lastWriteTs - Date.now() + this._writeInterval);
    }
  }
}
