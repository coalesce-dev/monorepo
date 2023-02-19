import { createHttpPluginHooks } from '@coalesce.dev/store-plugins-http-react';
import { Selector } from '@coalesce.dev/store-common';
import {
  useSharedState,
  useSharedValue,
} from '@coalesce.dev/store-client-react';
import { schema, StoreState } from '@coalesce.dev/store-example-shared';

export function useTypedSharedValue<S extends Selector>(selector: S) {
  return useSharedValue<StoreState, S>(selector);
}

export function useTypedSharedState<S extends Selector>(selector: S) {
  return useSharedState<StoreState, S>(
    selector
  ) as S[0] extends keyof StoreState
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

  useAlbumSuspended,
  useUserSuspended,
  useAlbumPhotosListSuspended,
} = createHttpPluginHooks(schema);
