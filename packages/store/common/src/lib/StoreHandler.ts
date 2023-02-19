import { RootState } from './SharedStoreSchema';
import { SharedStore } from './SharedStore';
import { EventMessage } from './Messages';

export interface StoreHandler<T extends RootState> {
  init(store: SharedStore<T>): Promise<void>;
  broadcastEvent(msg: EventMessage): void;
  notifyMutation(): void;
}
