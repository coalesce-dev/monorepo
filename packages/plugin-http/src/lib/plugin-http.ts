import {
  ISharedStore,
  RootState,
  Selector,
  SharedStorePlugin,
  SharedStoreSchemaEntry,
} from '@coalesce.dev/store-core';

export interface HttpPluginConfig {
  query: string | ((data: any) => string);
  expireMs?: number;
}

const JSON_CONTENT_TYPE = /^application\/(.+\+)?json(;.*)?$/;

export interface HttpPluginData<Value> {
  ts: number;
  v: Value;
}

export class HttpPlugin implements SharedStorePlugin<HttpPluginConfig> {
  async intercept<Value>(
    path: Selector,
    entry: SharedStoreSchemaEntry<Value, string, HttpPluginConfig>,
    store: ISharedStore<RootState, { [key: string]: HttpPluginConfig }>
  ): Promise<Value> {
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
      store.applyPatches([
        { path: [...rootPath], op: 'replace', value: newEntry },
      ]);
    }
    return store.select(path);
  }
}
