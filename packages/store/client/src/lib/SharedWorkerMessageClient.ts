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

export class SharedWorkerMessageClient<T extends RootState>
  implements MessageClient
{
  private _worker: SharedWorker;

  constructor(
    private _client: SharedStoreClient<T>,
    worker: SharedWorker,
    receive: (msg: ResponseMessage | EventMessage) => void
  ) {
    this._worker = worker;
    this._worker.port.onmessage = (e) => {
      const message = e.data as ResponseMessage | EventMessage;
      receive(message);
    };
  }

  async init() {
    await this._client.sendKeepAlive(ALIVE_POLL_INIT_TIMEOUT_MS);
  }

  async sendMessage(message: RequestMessage) {
    this._worker.port.postMessage(message);
  }

  dispose() {
    this._worker.port.close();
  }
}
