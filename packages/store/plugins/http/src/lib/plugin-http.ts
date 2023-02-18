import {
  ISharedStore,
  RootState,
  Selector,
  SharedStorePlugin,
  SharedStoreSchemaEntry,
} from '@coalesce.dev/store-common';

export const PluginId = 'http';

export type HttpPluginState<T> = Record<string, HttpPluginData<T>>;

export type HttpPluginEntryType = { http: HttpPluginConfig };

export interface HttpPluginConfig<R = void> {
  query: string | ((data: R) => string);
  expireMs?: number;
  autoRefresh?: boolean;
}

const JSON_CONTENT_TYPE = /^application\/(.+\+)?json(;.*)?$/;

export interface HttpPluginData<Value> {
  ts: number;
  v: Value;
}

export type HttpPluginEntry<Req, Res> = SharedStoreSchemaEntry<
  Record<string, HttpPluginData<Res>>,
  typeof PluginId,
  HttpPluginConfig<Req>
>;

export function createHttpEntry<Res, Req = void>(
  config: HttpPluginConfig<Req>
): HttpPluginEntry<Req, Res> {
  return {
    initialHydrate: false,
    allowDirectMutation: false,
    initialValue: {},
    pluginId: PluginId,
    config,
  };
}

class HttpPluginImpl implements SharedStorePlugin<HttpPluginConfig> {
  private _purge = new Map<string, Map<string | number, number>>();

  async intercept<Value>(
    path: Selector,
    entry: SharedStoreSchemaEntry<Value, string, HttpPluginConfig>,
    store: ISharedStore<RootState, { [key: string]: HttpPluginConfig }>
  ): Promise<Value> {
    if (!this._purge.has(path[0]))
      this._purge.set(path[0], new Map<string, number>());
    const purgeMap = this._purge.get(path[0])!;
    const params = JSON.parse(String(path[1]));
    const query =
      typeof entry.config.query === 'string'
        ? entry.config.query
        : entry.config.query(params);
    const rootPath = path.slice(0, 2) as unknown as Selector;
    const existing = store.select<HttpPluginData<Value> | undefined>(rootPath);
    const now = Date.now();
    const dt = now - (existing?.ts ?? 0);
    if (!existing || (entry.config.expireMs && dt > entry.config.expireMs)) {
      const newData = await fetch(query).then((r) => {
        if (!r.ok) return Promise.reject(new Error(r.statusText));
        return JSON_CONTENT_TYPE.test(r.headers.get('Content-Type') ?? '')
          ? r.json()
          : r.text();
      });
      const newEntry: HttpPluginData<Value> = {
        ts: now,
        v: newData,
      };
      if (purgeMap.get(path[1]!)) {
        clearTimeout(purgeMap.get(path[1]!));
        purgeMap.delete(path[1]!);
      }
      if (entry.config.autoRefresh && entry.config.expireMs) {
        purgeMap.set(
          path[1]!,
          setTimeout(() => {
            if (store.getWatchCount(path))
              store.selectValueAsync({ type: 'sv', data: path, id: -1 });
          }, entry.config.expireMs) as unknown as number
        );
      }
      store.applyPatches([
        { path: [...rootPath], op: 'replace', value: newEntry },
      ]);
    }
    return store.select(path);
  }
}

export const HttpPlugin = {
  http: new HttpPluginImpl(),
};
