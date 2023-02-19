import { RootState, SharedStoreSchemaEntry } from './SharedStoreSchema';
import { ISharedStore } from './ISharedStore';
import { Selector } from './Messages';

export interface SharedStorePlugin<EntryConfig> {
  intercept<Value>(
    path: Selector,
    entry: SharedStoreSchemaEntry<Value, string, EntryConfig>,
    store: ISharedStore<RootState, { [key: string]: EntryConfig }>
  ): PromiseLike<Value>;
}
