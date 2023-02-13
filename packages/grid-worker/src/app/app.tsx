// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.css';
import { useCallback, useEffect, useState } from 'react';
import { storeClient } from './store';
import { StoreState, Todo } from '../schema';
import { TodoCard } from './TodoCard';
import { fetchValue } from './FetchValue';

export function App() {
  const [value, setValue] = useState<StoreState['valueA']>(() =>
    storeClient.getValue('valueA')
  );

  const addItem = useCallback(() => {
    storeClient
      .mutateValue('valueA', (d) => void console.log('INC:', d.counter++))
      .catch(console.error);
  }, []);

  const [todos, setTodos] = useState<Todo[]>([]);
  useEffect(() => {
    fetchValue(storeClient, 'todoList', []).then(setTodos);
  }, []);

  useEffect(
    () =>
      storeClient.subscribeKeyValueChange('valueA', () =>
        setValue(storeClient.getValue('valueA'))
      ),
    []
  );

  return (
    <>
      <button onClick={addItem}>Add</button>
      <div>{value.counter}</div>
      {todos.map((todo) => (
        <TodoCard key={todo.id} id={todo.id} />
      ))}
    </>
  );
}

export default App;
