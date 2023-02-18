# Shared Store - Plugins - HTTP - React

> @coalesce.dev/store-plugins-http-react

This package provides React hooks and components to use with `@coalesce.dev/store-plugins-http`.

## Usage

Follow usage instructions from `@coalesce.dev/store-client-react` for information on setting up the required provider.

### Hook Generation

Hooks can be generated from a schema that defines HTTP entries using the `createHttpPluginHooks` function:

```ts
import { schema, StoreState } from '../schema';
import { createHttpPluginHooks } from '@coalesce.dev/store-plugins-http-react';

export const { useTodo, useTodoList } = createHttpPluginHooks(schema);
```

These generated hooks can then be used to fetch values in components.

#### Request Hooks

Entries that require a request must specify either a value of that request type or `undefined` to skip fetching any values:

```tsx
import { useTodoList } from './storeHooks';

function ExampleComponent({ id }: { id: number }) {
  const todo: Todo | undefined = useTodo(id);
  const alsoTodo: Todo | undefined = useTodo(id, false);
  const todoSkipped: Todo | undefined = useTodo(undefined);
  const todoAlsoSkipped: Todo | undefined = useTodo(id, true);

  // ...
}
```

#### Requestless Hooks

Entries that do not require a request value can omit the request parameter:

```tsx
import { useTodoList } from './storeHooks';

function ExampleComponent() {
  const todos: Todo[] | undefined = useTodoList();

  return (
    <ul>
      {todos?.map((t) => (
        <li key={t.id}>{t.title}</li>
      ))}
    </ul>
  );
}
```

They may also skip fetching values by either passing `undefined` as the first parameter, or passing `null` as the first parameter and `true` as the second:

```tsx
import { useTodoList } from './storeHooks';

function ExampleComponent() {
  const todos1 = useTodoList(undefined); // will always be undefined
  const todos2 = useTodoList(null, true); // will always be undefined

  // ...
}
```
