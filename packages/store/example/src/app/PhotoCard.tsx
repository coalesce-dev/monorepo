import { useState } from 'react';
import { ObservedDiv } from './ObservedDiv';
import { Photo } from '@coalesce.dev/store-example-shared';

export function PhotoCard({ photo }: { photo: Photo }) {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <ObservedDiv
      style={{ background: '#ddd', minHeight: 200, padding: '0.5rem' }}
    >
      <h2>{photo.title}</h2>
      <img
        onClick={() => setExpanded((v) => !v)}
        src={isExpanded ? photo.url : photo.thumbnailUrl}
        alt={photo.title}
      />
    </ObservedDiv>
  );
}
