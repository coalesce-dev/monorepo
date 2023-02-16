import { useEffect, useState } from 'react';
import { Photo } from '../schema';

export function PhotoCard({ photo }: { photo: Photo }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setExpanded] = useState(false);

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
      style={{ background: '#ddd', minHeight: 200, padding: '0.5rem' }}
      ref={setDiv}
    >
      <h2>{photo.title}</h2>
      {isVisible && (
        <img
          onClick={() => setExpanded((v) => !v)}
          src={isExpanded ? photo.url : photo.thumbnailUrl}
        />
      )}
    </div>
  );
}
