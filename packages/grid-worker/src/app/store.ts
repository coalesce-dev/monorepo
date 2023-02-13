import { SharedStoreClient } from '@coalesce.dev/store';
import { schema } from '../schema';

export const storeClient = new SharedStoreClient(
  () => new SharedWorker(new URL('../worker', import.meta.url)),
  schema
);

(window as unknown as { store: any }).store = storeClient;
