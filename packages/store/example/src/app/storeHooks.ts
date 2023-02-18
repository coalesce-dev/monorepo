import { schema, StoreState } from '../schema';
import { createHttpPluginHooks } from '@coalesce.dev/store-plugins-http-react';
import { Selector } from '@coalesce.dev/store-common';
import { Path } from 'ts-toolbelt/out/Object/Path';
import {
  useSharedState,
  useSharedValue,
} from '@coalesce.dev/store-client-react';

export function useTypedSharedValue<S extends Selector>(
  selector: S
): Path<StoreState, S> {
  return useSharedValue<StoreState, S>(selector) as Path<StoreState, S>;
}

export function useTypedSharedState<S extends Selector>(selector: S) {
  return useSharedState<StoreState, S>(
    selector
  ) as unknown as S[0] extends keyof StoreState
    ? typeof schema['entries'][S[0]] extends { allowDirectMutation: true }
      ? ReturnType<typeof useSharedState<StoreState, S>>
      : never
    : never;
}

export const {
  useTodo,
  useAlbum,
  useTodoList,
  useAlbumList,
  useAlbumPhotosList,
  useUser,
} = createHttpPluginHooks(schema);
