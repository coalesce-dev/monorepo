import { SharedStore } from '@coalesce.dev/store-worker';
import { schema } from '../schema';
import { HttpPlugin } from '@coalesce.dev/store-plugins-http';

const store = new SharedStore('testStoreId', schema, {
  http: new HttpPlugin(),
});
