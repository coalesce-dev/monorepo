import { SharedStoreSchema } from '@coalesce.dev/store-core';

export type StoreState = {
  valueA: {
    counter: number;
  };
};

export const schema: SharedStoreSchema<StoreState> = {
  version: 1,
  entries: {
    valueA: {
      initialValue: {
        counter: 8,
      },
      allowDirectMutation: true,
    },
  },
};
