import { createContext, PropsWithChildren } from 'react';
import { SharedStoreClient } from '@coalesce.dev/store-client';

export const SharedStoreContext = createContext<SharedStoreClient<any> | null>(
  null
);

export function SharedStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: SharedStoreClient<any> }>) {
  return (
    <SharedStoreContext.Provider value={store}>
      {children}
    </SharedStoreContext.Provider>
  );
}
