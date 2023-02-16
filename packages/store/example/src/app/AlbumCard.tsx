import { useAlbum, useAlbumPhotos, useUser } from './storeHooks';
import { useEffect, useState } from 'react';
import { PhotoCard } from './PhotoCard';

export function AlbumCard({ id }: { id: number }) {
  const [isVisible, setIsVisible] = useState(false);

  const album = useAlbum(isVisible ? id : undefined);
  const user = useUser(album?.userId);
  const photos = useAlbumPhotos(isVisible ? id : undefined);

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
    <div style={{ background: '#eee', minHeight: 200 }} ref={setDiv}>
      {!album ? undefined : (
        <>
          <h2>{album.title}</h2>
          <h3>{user?.name ?? 'Loading...'}</h3>
          {!!photos && photos.map((p, i) => <PhotoCard key={i} photo={p} />)}
        </>
      )}
    </div>
  );
}
