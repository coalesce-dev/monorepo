import type { AnyArray, AnyObject } from 'immer/dist/types/types-internal';

export interface SharedStoreSchemaEntry<Data> {
  initialValue: Data;
  allowDirectMutation?: boolean;
}

export type RootState = Record<string, AnyObject | AnyArray>;

export interface SharedStoreSchema<Data extends RootState> {
  version: number;
  entries: {
    [Property in keyof Data]: SharedStoreSchemaEntry<Data[Property]>;
  };
}
