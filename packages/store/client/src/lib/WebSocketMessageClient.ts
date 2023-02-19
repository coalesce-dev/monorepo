import { MessageClient } from './MessageClient';
import { SharedStoreClient } from './SharedStoreClient';
import {
  EventMessage,
  RequestMessage,
  ResponseMessage,
  RootState,
} from '@coalesce.dev/store-common';

export class WebSocketMessageClient<T extends RootState>
  implements MessageClient
{
  private _ws: WebSocket;

  constructor(
    private _client: SharedStoreClient<T>,
    url: URL,
    receive: (msg: ResponseMessage | EventMessage) => void
  ) {
    this._ws = new WebSocket(url.toString(), ['coalesce.dev-shared_store']);
    this._ws.onmessage = (e) => {
      const message = JSON.parse(e.data);
      receive(message);
    };
  }

  async init() {
    if (this._ws.readyState === WebSocket.CONNECTING) {
      await new Promise<void>((resolve, reject) => {
        this._ws.onopen = () => resolve();
        this._ws.onclose = () => reject();
      });
    } else if (this._ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket did not connect.');
    }
    await this._client.sendKeepAlive();
  }

  async sendMessage(msg: RequestMessage) {
    this._ws.send(JSON.stringify(msg));
  }

  dispose(): void {
    this._ws.close();
  }
}
