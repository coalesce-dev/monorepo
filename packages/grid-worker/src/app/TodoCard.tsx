import { useEffect, useState } from 'react';
import { Todo, User } from '../schema';
import { storeClient } from './store';
import { fetchValue } from './FetchValue';

export function TodoCard({ id }: { id: number }) {
  const [todo, setTodo] = useState<Todo | undefined>();
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (isVisible) {
      fetchValue(storeClient, 'todo', { id }).then(setTodo);
    }
  }, [id, isVisible]);

  const [user, setUser] = useState<User | undefined>();
  useEffect(() => {
    if (isVisible) {
      if (todo)
        fetchValue(storeClient, 'user', { id: todo.userId }).then(setUser);
    }
  }, [todo?.userId, isVisible]);

  const [div, setDiv] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!div) return;
    const observer = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) {
        setIsVisible(true);
      }
    });
    observer.observe(div);
    return () => observer.disconnect();
  }, [div]);

  return (
    <div
      style={{
        background: '#eee',
        minHeight: 200,
      }}
      ref={setDiv}
    >
      {todo ? (
        <>
          <h2>{todo.title}</h2>
          <h3>{user ? `${user.name} (${user.username})` : 'Loading'}</h3>
          <p>Completed: {todo.completed ? 'Y' : 'N'}</p>
        </>
      ) : (
        <h1>Loading...</h1>
      )}
    </div>
  );
}
