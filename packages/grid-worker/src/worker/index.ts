import {EventMessage, RequestMessage, ResponseEventMessage} from "../types/Events";
import {enablePatches, produceWithPatches} from "immer";

enablePatches();

export {};

console.log("WORKER");

let data: number[] = [];

const ports = new Set<MessagePort>();

const DEAD_PORT_TIMEOUT_MS = 60_000;
const instance = Math.random().toFixed(8).substring(2);

onconnect = (e) => {
  const port = e.ports[0];
  ports.add(port);
  let deadPortTimeout: number;

  const postMessage = (msg: ResponseEventMessage) => {
    try {
      port.postMessage(msg);
    } catch {
      ports.delete(port);
    }
  }

  const broadcastEvent = (msg: EventMessage) => {
    for (const port of Array.from(ports)) {
      port.postMessage(msg);
    }
  }

  postMessage({
    type: "info",
    data: {
      instance
    }
  });

  port.onmessage = (e) => {
    console.debug("WORKER RECEIVED:", e);
    clearTimeout(deadPortTimeout);
    ports.add(port);
    deadPortTimeout = setTimeout(() => {
      console.log("Port timed out, removing");
      ports.delete(port);
    }, DEAD_PORT_TIMEOUT_MS) as unknown as number;

    const event = e.data as RequestMessage;

    switch (event.type) {
      case "alive": {
        postMessage({
          type: "success",
          id: event.id
        });
        break;
      }
      case "data": {
        postMessage({
          type: "data",
          id: event.id,
          data
        });
        break;
      }
      case "append": {
        const [newData, patches] = produceWithPatches(data, d => void d.push(event.item));
        data = newData;
        postMessage({
          type: "success",
          id: event.id
        });
        broadcastEvent({
          type: "update",
          data: {
            patches
          }
        });
        break;
      }
      case "remove": {
        const [newData, patches] = produceWithPatches(data, d => void d.splice(event.index, 1));
        data = newData;
        postMessage({
          type: "success",
          id: event.id
        });
        broadcastEvent({
          type: "update",
          data: {
            patches
          }
        });
        break;
      }
      default: {
        console.error(`Invalid event type '${(event as RequestMessage).type}'`);
      }
    }
  }
};
