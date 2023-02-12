import { SharedStore } from '@coalesce.dev/store-worker';
import { schema } from '../schema';

const store = new SharedStore('testStoreId', schema);
