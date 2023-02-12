// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.css';
import { useCallback, useEffect, useState } from 'react';
import { storeClient } from './store';
import { StoreState } from '../schema';

export function App() {
  const [value, setValue] = useState<StoreState['valueA']>(() =>
    storeClient.getValue('valueA')
  );

  const addItem = useCallback(() => {
    storeClient
      .mutateValue('valueA', (d) => void console.log('INC:', d.counter++))
      .catch(console.error);
    // appendItem(Math.random());//.then(updateData);
  }, []);

  useEffect(
    () =>
      storeClient.subscribeKeyValueChange('valueA', () =>
        setValue(storeClient.getValue('valueA'))
      ),
    []
  );

  const removeItem = useCallback(() => {}, []);

  return (
    <>
      <button onClick={addItem}>Add</button>
      <div>{value.counter}</div>
      <ul>
        {/*{data.map((d, index) => (*/}
        {/*  <li>{d}<button onClick={() => removeItem(index)}>X</button></li>*/}
        {/*))}*/}
      </ul>
    </>
  );
}

export default App;
