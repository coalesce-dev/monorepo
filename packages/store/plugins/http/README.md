# Shared Store - Plugins - HTTP

> @coalesce.dev/store-plugins-http

This package provides a plugin that syncs entries of a shared store with HTTP resources.

If using React, see `@coalesce.dev/store-plugins-http-react`.

## Usage

Define the schema:

```ts
import {
  createHttpEntry,
  HttpPluginState,
} from '@coalesce.dev/store-plugins-http';

export type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

export type StoreState = {
  todo: Record<string, HttpPluginData<Todo>>;
  todoList: Record<string, HttpPluginData<Todo[]>>;
};

export const schema = {
  version: 1,
  entries: {
    todo: createHttpEntry<Todo, number>({
      query: (req) => `https://jsonplaceholder.typicode.com/todos/${req}`,
      expireMs: 15000,
    }),
    todoList: createHttpEntry<Todo[]>({
      query: 'https://jsonplaceholder.typicode.com/todos',
      expireMs: 15000,
      autoRefresh: true,
    }),
  },
};
```

`query` can either be a string or a function taking a request and returning a string. If an `expireMs` value is not provided, it will never be refetched. `autoRefresh` causes the value to be refetched once it expires.

Values can then be selected using the following path format:

```
[
  keyof SchemaType["entries"],
  JsonString,
  "v"
]
```

For example, to select a Todo with id 8 using the schema listed above:

```ts
const todo = await storeClient.selectValue(['todo', '8', 'v'] as const);
```

Note that the `JSON_REQ` part of the selector **must** be valid JSON.
