import {
  EventMessage,
  RequestMessage,
  ResponseMessage,
  RootState,
} from '@coalesce.dev/store-common';
import { SharedStoreClient } from './SharedStoreClient';

export interface MessageClient {
  init(): Promise<void>;
  sendMessage(msg: RequestMessage): Promise<void>;
  dispose(): void;
}

export type MessageClientFactory<T extends RootState> = (
  client: SharedStoreClient<T>,
  receive: (msg: ResponseMessage | EventMessage) => void
) => MessageClient;
