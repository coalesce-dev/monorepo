import type { AnyArray, AnyObject } from 'immer/dist/types/types-internal';

export type SharedStoreSchemaEntry<
  Value,
  PluginId extends string | void = void,
  Config = void
> = {
  initialValue: Value;
  allowDirectMutation?: boolean;
  initialHydrate?: boolean;
} & (PluginId extends string
  ? {
      pluginId: PluginId;
      config: Config;
    }
  : {});

export type RootState = Record<string, AnyObject | AnyArray>;

export interface SharedStoreSchema<
  Data extends RootState,
  EntryTypes extends Record<string, unknown> = {}
> {
  version: number;
  entries: {
    [Property in keyof Data & string]:
      | SharedStoreSchemaEntry<Data[Property]>
      | {
          [PluginId in keyof EntryTypes & string]: SharedStoreSchemaEntry<
            Data[Property],
            PluginId,
            EntryTypes[PluginId]
          >;
        }[keyof EntryTypes & string];
  };
}
