import { SharedStoreSchema } from '@coalesce.dev/store-core';
import { HttpPluginConfig, HttpPluginData } from '@coalesce.dev/store-http';

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

export type StoreState = {
  valueA: {
    counter: number;
  };
  todo: Record<string, HttpPluginData<Todo>>;
  todoList: Record<string, HttpPluginData<Todo[]>>;
  user: Record<string, HttpPluginData<User>>;
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
      todo: {
        initialValue: {},
        pluginId: 'http',
        config: {
          query: (req: { id: number }) =>
            `https://jsonplaceholder.typicode.com/todos/${req.id}`,
          expireMs: 15000,
        },
      },
      todoList: {
        initialValue: {},
        pluginId: 'http',
        config: {
          query: 'https://jsonplaceholder.typicode.com/todos',
          expireMs: 15000,
        },
      },
      user: {
        initialValue: {},
        pluginId: 'http',
        config: {
          query: (req: { id: number }) =>
            `https://jsonplaceholder.typicode.com/users/${req.id}`,
          expireMs: 120000,
        },
      },
    },
  };
