import { RootState } from '@coalesce.dev/store-core';
import { SharedStoreClient } from '@coalesce.dev/store';
import { storeClient } from './store';

export function fetchValue<T extends RootState, K extends keyof T & string>(
  store: SharedStoreClient<T>,
  key: K,
  req: unknown
) {
  return storeClient.selectValue([key, JSON.stringify(req), 'v'] as const);
}
