import { SharedStoreSchema } from '@coalesce.dev/store-core';
import {
  createHttpEntry,
  HttpPluginConfig,
  HttpPluginData,
} from '@coalesce.dev/store-http';

export type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

export type User = {
  id: number;
  name: string;
  username: string;
};

export type Album = {
  userId: number;
  id: number;
  title: string;
};

export type Photo = {
  albumId: number;
  id: number;
  title: string;
  url: string;
  thumbnailUrl: string;
};

export type StoreState = {
  valueA: {
    counter: number;
  };
  list: number[];
  todo: Record<string, HttpPluginData<Todo>>;
  todoList: Record<string, HttpPluginData<Todo[]>>;
  user: Record<string, HttpPluginData<User>>;
  album: Record<string, HttpPluginData<Album>>;
  albumList: Record<string, HttpPluginData<Album[]>>;
  albumPhotosList: Record<string, HttpPluginData<Photo[]>>;
};

export const schema: SharedStoreSchema<StoreState, { http: HttpPluginConfig }> =
  {
    version: 1,
    entries: {
      valueA: {
        initialValue: {
          counter: 8,
        },
        allowDirectMutation: true,
      },
      list: {
        initialValue: [],
        allowDirectMutation: true,
      },
      todo: createHttpEntry({
        query: (req: { id: number }) =>
          `https://jsonplaceholder.typicode.com/todos/${req.id}`,
        expireMs: 15000,
      }),
      todoList: createHttpEntry({
        query: 'https://jsonplaceholder.typicode.com/todos',
        expireMs: 15000,
      }),
      user: createHttpEntry({
        query: (req: { id: number }) =>
          `https://jsonplaceholder.typicode.com/users/${req.id}`,
        expireMs: 120000,
      }),
      albumList: createHttpEntry({
        query: `https://jsonplaceholder.typicode.com/albums`,
        expireMs: 120000,
      }),
      album: createHttpEntry({
        query: (req: { id: number }) =>
          `https://jsonplaceholder.typicode.com/albums/${req.id}`,
        expireMs: 120000,
      }),
      albumPhotosList: createHttpEntry({
        query: (req: { id: number }) =>
          `https://jsonplaceholder.typicode.com/album/${req.id}/photos`,
        expireMs: 120000,
      }),
    },
  };
