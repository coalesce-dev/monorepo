import { SharedStore } from './SharedStore';
import {
  createErrorResponse,
  createId,
  createSuccessResponse,
  EventMessage,
  KeepAliveRequest,
  RequestMessage,
  ResponseMessage,
  RootState,
} from '@coalesce.dev/store-core';

type RequestWithoutAlive = Exclude<RequestMessage, KeepAliveRequest>;

export class StorePort<T extends RootState> {
  private _hasClosed = false;
  private readonly _id: string;
  private _store: SharedStore<T>;

  constructor(
    store: SharedStore<T>,
    public readonly port: MessagePort,
    onMessage: (
      message: RequestWithoutAlive
    ) => ResponseMessage | PromiseLike<ResponseMessage>
  ) {
    this._id = createId();
    this._store = store;

    let deadPortTimeout: number;

    this.postMessage({
      stype: 'e',
      type: 'i',
      data: {
        instanceId: store.instanceId,
        schemaVersion: store.schema.version,
      },
    });

    port.onmessage = async (e) => {
      if (this._hasClosed) {
        console.error('Received message on dead port.');
        throw new Error('ERR_DEAD_PORT');
      }
      clearTimeout(deadPortTimeout);
      deadPortTimeout = setTimeout(() => {
        console.debug('Port', this.id, 'timed out, removing');
        store.killDeadPort(this);
      }, store.deadPortTimeout) as unknown as number;

      const req = e.data as RequestMessage;
      switch (req.type) {
        case 'a': {
          this.postMessage(createSuccessResponse(req));
          break;
        }
        default: {
          try {
            const response = await onMessage(req as RequestWithoutAlive);
            this.postMessage(response ?? createSuccessResponse(req));
          } catch (e) {
            this.postMessage(createErrorResponse(req, e));
          }
        }
      }
    };
  }

  get id() {
    return this._id;
  }

  postMessage(msg: ResponseMessage | EventMessage) {
    if (this._hasClosed) {
      console.error('Attempted to send message on dead port.');
      throw new Error('ERR_DEAD_PORT');
    }
    try {
      this.port.postMessage(msg);
    } catch {
      this._store.killDeadPort(this);
    }
  }

  close() {
    if (this._hasClosed) {
      console.error('Attempted to close already closed port:', this._id);
    }
    this.port.close();
    this._hasClosed = true;
  }
}
