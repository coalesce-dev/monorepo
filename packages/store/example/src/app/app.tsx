// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.css';
import { useCallback } from 'react';
import { useTypedSharedState, useTypedSharedValue } from './storeHooks';
import { useSharedStore } from '@coalesce.dev/store-client-react';
import { AlbumList } from './AlbumList';
import { StoreState } from '@coalesce.dev/store-example-shared';

export function App() {
  const [value, setValue] = useTypedSharedState(['valueA', 'counter'] as const);
  const list = useTypedSharedValue(['list'] as const);
  const store = useSharedStore<StoreState>();
  const addItem = useCallback(() => {
    setValue(value + 1);
  }, [value]);
  return (
    <>
      <button onClick={addItem}>Increment</button>
      <div>{value}</div>
      <button
        onClick={() => store.mutateValue('list', (d) => d.push(Math.random()))}
      >
        Add Item
      </button>
      <ul>
        {list.map((l, i) => (
          <li key={i}>
            {l}
            <button
              onClick={() => store.mutateValue('list', (d) => d.splice(i, 1))}
            >
              X
            </button>
          </li>
        ))}
      </ul>
      <AlbumList />
    </>
  );
}

export default App;
