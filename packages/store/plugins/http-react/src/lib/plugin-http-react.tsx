import {
  RootState,
  SharedStoreSchema,
  SharedStoreSchemaEntry,
} from '@coalesce.dev/store-common';
import { useSharedValue } from '@coalesce.dev/store-client-react';
import { Path } from 'ts-toolbelt/out/Object/Path';
import {
  HttpPluginConfig,
  HttpPluginData,
  HttpPluginEntry,
  HttpPluginEntryType,
  PluginId,
} from '@coalesce.dev/store-plugins-http';

export function useFetchValue<T extends RootState, K extends keyof T & string>(
  key: K,
  req: unknown,
  prevent?: boolean
) {
  return (
    useSharedValue<T, readonly [K, string] | null>(
      prevent || req === undefined
        ? null
        : ([key, JSON.stringify(req)] as const),
      []
    ) as { v?: Path<T, [K, string, 'v']> }
  )?.v;
}

type Hooks<T extends SharedStoreSchema<RootState, HttpPluginEntryType>> = {
  [K in keyof T['entries'] & string as T['entries'][K] extends HttpPluginEntry<
    any,
    any
  >
    ? `use${Capitalize<K>}`
    : never]: T['entries'][K] extends SharedStoreSchemaEntry<
    Record<string, HttpPluginData<infer Response>>,
    typeof PluginId,
    HttpPluginConfig<infer Request>
  >
    ? Request extends void
      ? (request?: undefined | null, prevent?: boolean) => Response | undefined
      : (
          request: Request | undefined,
          prevent?: boolean
        ) => Response | undefined
    : never;
};

export function createHttpPluginHooks<
  T extends SharedStoreSchema<RootState, HttpPluginEntryType>
>(schema: T): Hooks<T> {
  const entries = Object.entries(schema.entries)
    .map(([k, v]) => {
      if (!('pluginId' in v && v.pluginId === 'http')) {
        return undefined;
      }
      return [
        'use' + k[0].toUpperCase() + k.substring(1),
        function (req: unknown, prevent?: boolean) {
          return useFetchValue(k, arguments.length === 0 ? null : req, prevent);
        },
      ] as const;
    })
    .filter(Boolean) as [string, unknown][];
  console.log(entries);
  return Object.fromEntries(entries) as Hooks<T>;
}

// function createHooks<T extends SharedStoreSchema<RootState, HttpPluginEntryType>, P = "http">(schema: T) {
//   for (const entryKey in schema.entries) {
//     const entry = schema.entries[entryKey];
//     if ("pluginId" in entry && entry.pluginId === "http") {
//       entry.config.
//     }
//   }
// }
