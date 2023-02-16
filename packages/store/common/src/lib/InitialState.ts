import { RootState, SharedStoreSchema } from './SharedStoreSchema';

export function createInitialState<T extends RootState>(
  schema: SharedStoreSchema<T>
): T {
  return Object.fromEntries(
    Object.entries(schema.entries).map(([k, v]) => {
      return [k, v.initialValue];
    })
  ) as unknown as T;
}
