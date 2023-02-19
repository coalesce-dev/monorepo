import {
  SharedStoreClient,
  SharedWorkerMessageClient,
  WebSocketMessageClient,
  WorkerMessageClient,
} from '@coalesce.dev/store-client';
import { schema, StoreState } from '@coalesce.dev/store-example-shared';

const useWebSocket = window.location.search === '?ws';

export const storeClient = new SharedStoreClient<StoreState>(
  (client, receive) =>
    useWebSocket
      ? new WebSocketMessageClient(
          client,
          new URL('ws://192.168.1.132:8083'),
          receive
        )
      : 'SharedWorker' in globalThis
      ? new SharedWorkerMessageClient(
          client,
          new SharedWorker(new URL('../worker', import.meta.url), {
            name: 'example-worker',
          }),
          receive
        )
      : new WorkerMessageClient(
          client,
          new Worker(new URL('../worker', import.meta.url), {
            name: 'example-worker',
          }),
          receive
        ),
  schema
);

(window as unknown as { store: any }).store = storeClient;
