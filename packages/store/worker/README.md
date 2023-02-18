# Shared Store - Worker

> @coalesce.dev/store-worker

This package provides a library used to create the worker component of a shared store.

## Usage

Create a file to be used as the entry point of the worker. For example, here is a file that sets up a store using the HTTP plugin:

```ts
import { SharedStore } from '@coalesce.dev/store-worker';
import { schema } from '../schema';
import { HttpPlugin } from '@coalesce.dev/store-plugins-http';

const store = new SharedStore('exampleStoreId', schema, {
  ...HttpPlugin,
});
```

This worker can then be loaded using the `@coalesce.dev/store-client` package:

```ts
import { SharedStoreClient } from '@coalesce.dev/store-client';
import { schema } from '../schema';

export const storeClient = new SharedStoreClient(
  () =>
    new SharedWorker(new URL('../worker', import.meta.url), {
      name: 'example-worker',
    }),
  schema
);
```

The state of the worker will periodically be persisted in an IndexedDB database shortly after any mutations. When the worker is restarted, it will load this previous state.
