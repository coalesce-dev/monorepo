import { RootState } from './SharedStoreSchema';
import { Selector, SelectValueRequest, SelectValueResponse } from './Messages';
import { Patch } from 'immer';

export interface ISharedStore<
  T extends RootState,
  EntryTypes extends Record<string, unknown> = {}
> {
  get state(): T;
  select<T>(path: Selector): T;
  applyPatches(patches: Patch[]): void;
  selectValueAsync(req: SelectValueRequest): Promise<SelectValueResponse>;
  getWatchCount(path: Selector): number;
}
