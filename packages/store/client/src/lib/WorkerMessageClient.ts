import {
  EventMessage,
  RequestMessage,
  ResponseMessage,
  RootState,
} from '@coalesce.dev/store-common';
import { MessageClient } from './MessageClient';
import {
  ALIVE_POLL_INIT_TIMEOUT_MS,
  SharedStoreClient,
} from './SharedStoreClient';

export class WorkerMessageClient<T extends RootState> implements MessageClient {
  private _worker: Worker;

  constructor(
    private _client: SharedStoreClient<T>,
    worker: Worker,
    receive: (msg: ResponseMessage | EventMessage) => void
  ) {
    this._worker = worker;
    this._worker.onmessage = (e) => {
      const message = e.data as ResponseMessage | EventMessage;
      receive(message);
    };
  }

  async init() {
    await this._client.sendKeepAlive(ALIVE_POLL_INIT_TIMEOUT_MS);
  }

  async sendMessage(message: RequestMessage) {
    this._worker.postMessage(message);
  }

  dispose() {
    this._worker.terminate();
  }
}
