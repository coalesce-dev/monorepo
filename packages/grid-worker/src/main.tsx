import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import "./app/SharedWorkerThing";

import App from './app/app';
import {enablePatches} from "immer";

enablePatches();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
