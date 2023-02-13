import { RootState } from '@coalesce.dev/store-core';
import { useSharedValue } from '@coalesce.dev/store-react';

export function useFetchValue<T extends RootState, K extends keyof T & string>(
  key: K,
  req: unknown,
  prevent?: boolean
) {
  return useSharedValue<T, readonly [K, string, 'v'] | null>(
    prevent ? null : ([key, JSON.stringify(req), 'v'] as const),
    []
  );
}

export function useCachedFetchValue<
  T extends RootState,
  K extends keyof T & string
>(key: K, req: unknown, prevent?: boolean) {
  return useSharedValue<T, readonly [K, string, 'v'] | null>(
    prevent ? null : ([key, JSON.stringify(req), 'v'] as const)
  );
}
