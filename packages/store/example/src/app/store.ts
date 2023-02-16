import { SharedStoreClient } from '@coalesce.dev/store-client';
import { schema } from '../schema';

export const storeClient = new SharedStoreClient(
  () =>
    new SharedWorker(new URL('../worker', import.meta.url), {
      name: 'example-worker',
    }),
  schema
);

(window as unknown as { store: any }).store = storeClient;
