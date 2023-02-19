import { WebSocketServer } from 'ws';
import { HttpPlugin } from '@coalesce.dev/store-plugins-http';
import {
  createInitialState,
  createSuccessResponse,
  SharedStore,
} from '@coalesce.dev/store-common';
import { schema } from '@coalesce.dev/store-example-shared';

console.log('Hello World!');

const store = new SharedStore(
  'test',
  schema,
  {
    async init(store) {
      store.state = createInitialState(store.schema);
    },
    broadcastEvent(msg) {
      const json = JSON.stringify(msg);
      for (const ws of wss.clients) {
        ws.send(json);
      }
    },
    notifyMutation() {
      // TODO
    },
  },
  { ...HttpPlugin }
);

const wss = new WebSocketServer({
  port: 8083,
});

wss.on('error', console.error);
wss.on('connection', (ws) => {
  ws.on('message', async (e) => {
    const message = JSON.parse(String(e));
    if (message.type === 'a') {
      ws.send(JSON.stringify(createSuccessResponse(message)));
    } else {
      console.log('Received message', message);
      const response = await store.handleMessage(message);
      ws.send(JSON.stringify(response));
    }
  });
});
