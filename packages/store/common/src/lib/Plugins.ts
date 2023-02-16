import {
  ISharedStore,
  RootState,
  Selector,
  SharedStoreSchemaEntry,
} from '@coalesce.dev/store-common';
export interface SharedStorePlugin<EntryConfig> {
  intercept<Value>(
    path: Selector,
    entry: SharedStoreSchemaEntry<Value, string, EntryConfig>,
    store: ISharedStore<RootState, { [key: string]: EntryConfig }>
  ): PromiseLike<Value>;
}