import { SharedStoreClient } from '@coalesce.dev/store-client';
import { schema, StoreState } from '../schema';

export const storeClient = new SharedStoreClient<StoreState>(
  () =>
    'SharedWorker' in globalThis
      ? new SharedWorker(new URL('../worker', import.meta.url), {
          name: 'example-worker',
        })
      : new Worker(new URL('../worker', import.meta.url), {
          name: 'example-worker',
        }),
  schema
);

(window as unknown as { store: any }).store = storeClient;
