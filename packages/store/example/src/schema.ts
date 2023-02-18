import {
  createHttpEntry,
  HttpPluginState,
} from '@coalesce.dev/store-plugins-http';

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
  todo: HttpPluginState<Todo>;
  todoList: HttpPluginState<Todo[]>;
  user: HttpPluginState<User>;
  album: HttpPluginState<Album>;
  albumList: HttpPluginState<Album[]>;
  albumPhotosList: HttpPluginState<Photo[]>;
};

export const schema = {
  version: 1,
  entries: {
    valueA: {
      initialValue: {
        counter: 8,
      },
      allowDirectMutation: true as const,
    },
    list: {
      initialValue: [],
      allowDirectMutation: true as const,
    },
    todo: createHttpEntry<Todo, number>({
      query: (req) => `https://jsonplaceholder.typicode.com/todos/${req}`,
      expireMs: 15000,
    }),
    todoList: createHttpEntry<Todo[]>({
      query: 'https://jsonplaceholder.typicode.com/todos',
      expireMs: 15000,
    }),
    user: createHttpEntry<User, number>({
      query: (req) => `https://jsonplaceholder.typicode.com/users/${req}`,
      expireMs: 120000,
    }),
    albumList: createHttpEntry<Album[]>({
      query: `https://jsonplaceholder.typicode.com/albums`,
      expireMs: 120000,
      autoRefresh: true,
    }),
    album: createHttpEntry<Album, number>({
      query: (req) => `https://jsonplaceholder.typicode.com/albums/${req}`,
      expireMs: 120000,
    }),
    albumPhotosList: createHttpEntry<Photo[], number>({
      query: (req) =>
        `https://jsonplaceholder.typicode.com/album/${req}/photos`,
      expireMs: 120000,
      autoRefresh: true,
    }),
  },
};
