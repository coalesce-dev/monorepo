import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import App from './app/app';
import { enablePatches } from 'immer';
import { SharedStoreProvider } from '@coalesce.dev/store-react';
import { storeClient } from './app/store';

enablePatches();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <SharedStoreProvider store={storeClient}>
      <App />
    </SharedStoreProvider>
  </StrictMode>
);
