import { StoreState } from '../schema';
import { useFetchValue } from '@coalesce.dev/store-plugins-http-react';
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
  return useSharedState<StoreState, S>(selector);
}

export function useTypedFetchValue<K extends keyof StoreState & string>(
  key: K,
  req: unknown,
  prevent?: boolean
) {
  return useFetchValue<StoreState, K>(key, req, prevent);
}

export function useTodo(id?: number) {
  return useTypedFetchValue('todo', { id }, id == null);
}

export function useTodoList() {
  return useTypedFetchValue('todoList', null);
}

export function useUser(id?: number) {
  return useTypedFetchValue('user', { id }, id == null);
}

export function useAlbumList() {
  return useTypedFetchValue('albumList', null);
}

export function useAlbum(id?: number) {
  return useTypedFetchValue('album', { id }, id == null);
}

export function useAlbumPhotos(id?: number) {
  return useTypedFetchValue('albumPhotosList', { id }, id == null);
}
