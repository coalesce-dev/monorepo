import { RootState, Selector } from '@coalesce.dev/store-common';
import { SharedStoreContext } from './store-react';
import { useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { SharedStoreClient } from '@coalesce.dev/store-client';
import { Path } from 'ts-toolbelt/out/Object/Path';

export function useSharedStore<T extends RootState>() {
  const store = useContext(SharedStoreContext);
  if (!store)
    throw new Error('Hook must be called from within a SharedStoreProvider.');
  return store as unknown as SharedStoreClient<T>;
}

function useStableArray<T extends readonly unknown[] | null>(array: T): T {
  const last = useRef(array);
  if (last.current?.length !== array?.length) {
    last.current = array;
  } else if (array?.length != null && last.current?.length != null) {
    for (let i = 0; i < array.length; i++) {
      if (array[i] !== last.current[i]) {
        last.current = array;
        break;
      }
    }
  }
  return last.current;
}

export function useForceRerender() {
  return useReducer((i) => i + 1, 0)[1];
}

export function useSharedValue<T extends RootState, S extends Selector | null>(
  selector: S,
  deps?: unknown[]
) {
  const rerender = useForceRerender();
  const stableSelector = useStableArray(selector);
  const store = useSharedStore<T>();
  useEffect(
    () => {
      if (stableSelector) {
        if (deps)
          store
            .selectValue<NonNullable<S>>(stableSelector as NonNullable<S>)
            .then(rerender);
        return store.subscribeKeyValueChange(stableSelector[0], rerender);
      }
      return undefined;
    },
    deps ? [stableSelector, store, ...deps] : [stableSelector, store]
  );
  return (
    stableSelector === null
      ? undefined
      : store.selectLocalValue<NonNullable<S>>(stableSelector as NonNullable<S>)
  ) as S extends null ? undefined : Path<T, NonNullable<S>>;
}

export function useSharedState<T extends RootState, S extends Selector>(
  selector: S,
  deps?: unknown[]
): [Path<T, S>, (v: Path<T, S>) => Promise<void> | undefined];
export function useSharedState<T extends RootState, S extends Selector | null>(
  selector: S,
  deps?: unknown[]
): [
  Path<T, NonNullable<S>> | undefined,
  (v: Path<T, NonNullable<S>>) => Promise<void> | undefined
] {
  const rerender = useForceRerender();
  const stableSelector = useStableArray(selector);
  const store = useSharedStore<T>();
  useEffect(
    () => {
      if (stableSelector) {
        if (deps)
          store
            .selectValue<NonNullable<S>>(stableSelector as NonNullable<S>)
            .then(rerender);
        return store.subscribeKeyValueChange(stableSelector[0], rerender);
      }
      return undefined;
    },
    deps ? [stableSelector, store, ...deps] : [stableSelector, store]
  );

  const setValue = useCallback(
    (v: Path<T, NonNullable<S>>) => {
      if (stableSelector)
        return store.mutateValue(stableSelector[0], (d) => {
          let r: any = d;
          for (let i = 1; i < stableSelector.length - 1; i++) {
            if (typeof r !== 'object') return; // TODO: should this create?
            r = r[stableSelector[i]];
          }
          if (typeof r === 'object') {
            r[stableSelector[stableSelector.length - 1]] = v;
          }
        });
      return undefined;
    },
    [stableSelector]
  );
  return [
    stableSelector
      ? store.selectLocalValue<NonNullable<S>>(stableSelector as NonNullable<S>)
      : undefined,
    setValue,
  ];
}
