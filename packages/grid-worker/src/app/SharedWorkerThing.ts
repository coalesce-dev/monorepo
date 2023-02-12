import {
  EventMessage,
  RequestMessage,
  ResponseEventMessage,
} from '../types/Events';
import {
  ERR_TERM,
  ERR_TIMEOUT,
  isTerminatedError,
  isTimeoutError,
} from '../types/Errors';

let pollHandle: number;
let worker: SharedWorker;
const callbacks = new Map<
  number,
  [(d: unknown) => void, (reason?: unknown) => void]
>();
attemptReset();

const eventCallbacks = new Map<
  EventMessage['type'],
  Set<(d: unknown) => void>
>();

let currentInstance: string | undefined;

const DEFAULT_TIMEOUT = 60_000;

function makeRequest<T>(
  event: RequestMessage,
  timeout = DEFAULT_TIMEOUT
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      callbacks.delete(id);
      console.error('Timeout on request', id, event);
      reject(ERR_TIMEOUT);
    }, timeout) as unknown as number;
    console.debug('Sending request', id, event);
    callbacks.set(id, [resolve as (d: unknown) => void, reject]);
    worker.port.postMessage({ ...event, id });
  });
}

export function requestData(): Promise<number[]> {
  return makeRequest({
    type: 'data',
    id: -1,
  });
}

export function appendItem(item: number): Promise<void> {
  return makeRequest({
    type: 'append',
    item,
    id: -1,
  });
}

export function removeItem(index: number): Promise<void> {
  return makeRequest({
    type: 'remove',
    index,
    id: -1,
  });
}

export function subscribeEvent<Event extends EventMessage>(
  type: Event['type'],
  callback: (data: Event['data']) => void
) {
  if (!eventCallbacks.has(type)) {
    eventCallbacks.set(type, new Set());
  }
  const callbacks = eventCallbacks.get(type) as Set<
    (data: EventMessage['data']) => void
  >;

  callbacks.add(callback);

  return () => void callbacks.delete(callback);
}

function attemptReset() {
  console.debug('Attempting to reset worker...');
  worker?.port?.close();

  for (const [id, [, reject]] of Array.from(callbacks)) {
    reject(ERR_TERM);
    clearTimeout(id);
  }
  callbacks.clear();

  worker = new SharedWorker(new URL('../worker', import.meta.url));

  clearInterval(pollHandle);
  pollHandle = setInterval(
    () =>
      makeRequest({ type: 'alive', id: -1 }, 500).catch((err) => {
        if (isTerminatedError(err)) {
          return Promise.resolve(undefined);
        }
        if (isTimeoutError(err)) {
          console.error('Worker is not responding, reload the page.');
          attemptReset();
          return Promise.resolve();
        } else {
          return Promise.reject(err);
        }
      }),
    1_000
  ) as unknown as number;

  worker.port.onmessage = (e) => {
    console.debug('APP RECEIVED:', e);
    const event = e.data as ResponseEventMessage;
    if (event.id != null) {
      // Response
      clearTimeout(event.id);
      const callback = callbacks.get(event.id);
      if (!callback) {
        console.error('Invalid request ID:', event.id);
      } else {
        callbacks.delete(event.id);
        callback[0]('data' in event ? event.data : undefined);
      }
    } else {
      // Event
      if (event.type === 'info') {
        currentInstance = event.data.instance;
      }
      const callbacks = eventCallbacks.get(event.type);
      if (!callbacks) return;
      for (const cb of callbacks) {
        cb(event.data);
      }
    }
  };
}

export function getCurrentInstanceId() {
  return currentInstance;
}
