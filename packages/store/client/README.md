# Shared Store - Client

> @coalesce.dev/store-client

This package provides a library used to interface with the worker component (see `@coalesce.dev/store-worker`) of a shared store.

If using React, see `@coalesce.dev/store-client-react`.

## Usage

### Setup

Setup a schema to be used by the worker and client. For example:

```ts
export type StoreState = {
  valueA: {
    counter: number;
  };
};

export const schema = {
  version: 1,
  entries: {
    valueA: {
      initialValue: {
        counter: 8,
      },
      allowDirectMutation: true as const,
    },
  },
};
```

Connect to a shared store worker using the `SharedStoreClient` class:

```ts
import { SharedStoreClient } from '@coalesce.dev/store-client';
import { schema, StoreState } from '../schema';

export const storeClient = new SharedStoreClient<StoreState>(
  () =>
    new SharedWorker(new URL('../worker', import.meta.url), {
      name: 'example-worker',
    }),
  schema
);
```

### Selecting Values

Values can then be selected from the client:

```ts
const count = await storeClient.selectValue(['valueA', 'counter'] as const);
console.log('Current count:', count);
```

`selectValue` will always retrieve the current value from the store. The synchronous method `selectLocalValue` can be used to retrieve the value that is cached within the client:

```ts
await storeClient.waitForSync(); // wait for the initial sync of state, only neccessary once
// ...
const count = storeClient.selectLocalValue(['valueA', 'counter'] as const);
console.log('Current count:', count);
```

### Mutating Values

Values can be mutated using `mutateValue` and passing in a mutation recipe (see immer docs [here](https://immerjs.github.io/immer/produce)):

```ts
await storeClient.mutateValue('valueA', (d) => d.counter++);
```

Each connected client (including the client the mutation originated from) will receive a patch event that will keep its local store in sync with any changes in the worker. Only entries that have the `allowDirectMutation` flag set to true in the schema are allowed to be mutated. If a value is attempted to be mutated that does not have this flag set, the promise returned will reject.
