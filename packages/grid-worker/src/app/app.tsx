// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.css';
import { useCallback, useEffect, useState } from 'react';
import {appendItem, removeItem, requestData, subscribeEvent} from './SharedWorkerThing';
import {applyPatches} from "immer";
import {DataUpdatedEvent} from "../types/Events";

export function App() {
  const [data, setData] = useState<number[]>([-1]);

  const updateData = useCallback(() => {
    requestData().then((d) => {
      console.log('Component received data:', d);
      setData(d);
    });
  }, []);

  useEffect(() => subscribeEvent("info", updateData));

  useEffect(() => {
    updateData();
    return subscribeEvent<DataUpdatedEvent>("update", (data) => {
      setData(v => applyPatches(v, data.patches));
    });
  }, []);

  const addItem = useCallback(() => {
    appendItem(Math.random());//.then(updateData);
  }, []);

  return (
    <>
      <button onClick={addItem}>Add</button>
      <ul>
        {data.map((d, index) => (
          <li>{d}<button onClick={() => removeItem(index)}>X</button></li>
        ))}
      </ul>
    </>
  );
}

export default App;
