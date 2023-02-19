import { WorkerStoreHandler } from '@coalesce.dev/store-worker';
import { HttpPlugin } from '@coalesce.dev/store-plugins-http';
import { SharedStore } from '@coalesce.dev/store-common';
import { schema } from '@coalesce.dev/store-example-shared';

const store = new SharedStore('testStoreId', schema, new WorkerStoreHandler(), {
  ...HttpPlugin,
});
