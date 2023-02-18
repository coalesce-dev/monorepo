# Shared Store - Client - React

> @coalesce.dev/store-client-react

This package provides React hooks and components to use with `@coalesce.dev/store-client`.

## Usage

Wrap your application component with a `SharedStoreProvider` at a higher level than any usage:

```tsx
<SharedStoreProvider store={storeClient}>
  <App />
</SharedStoreProvider>
```

### Selecting State

Values can be retrieved from the store using the `useSharedValue` hook. For easier usage, a store specific hook can be implemented:

```ts
export function useMySharedValue<S extends Selector>(selector: S) {
  return useSharedValue<StoreState /* set your store's state type here */, S>(
    selector
  );
}
```

### Mutating State

Values can be mutated using the `useSharedState` hook. Similarly, a store specific hook can also be implemented:

```ts
export function useMySharedState<S extends Selector>(selector: S) {
  return useSharedState<StoreState, S>(selector);
}
```

This hook returns a tuple containing the current state and a callback to change the value. Note that this callback is asynchronous and changes will not be immediately reflected.

To get a reference to the store, use the `useSharedStore` hook.
