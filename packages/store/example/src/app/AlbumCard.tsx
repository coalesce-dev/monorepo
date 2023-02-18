import {
  useAlbumPhotosListSuspended,
  useAlbumSuspended,
  useUserSuspended,
} from './storeHooks';
import { Suspense } from 'react';
import { PhotoCard } from './PhotoCard';
import { ObservedDiv } from './ObservedDiv';

function UserInfo({ id }: { id: number }) {
  const user = useUserSuspended(id);

  return <h3>{user.name}</h3>;
}

function AlbumPhotoList({ id }: { id: number }) {
  const photos = useAlbumPhotosListSuspended(id);

  return (
    <>
      {photos.map((p, i) => (
        <PhotoCard key={i} photo={p} />
      ))}
    </>
  );
}

function AlbumCardContent({ id }: { id: number }) {
  const album = useAlbumSuspended(id);

  return (
    <>
      <h2>{album.title}</h2>
      <Suspense fallback={<div>Loading user info...</div>}>
        <UserInfo id={album.userId} />
      </Suspense>
      <Suspense fallback={<div>Loading photo list...</div>}>
        <AlbumPhotoList id={id} />
      </Suspense>
    </>
  );
}

export function AlbumCard({ id }: { id: number }) {
  return (
    <ObservedDiv
      style={{ background: '#eee', minHeight: 200, padding: '0.5rem' }}
    >
      <Suspense fallback={<h2>Loading album data... ({id})</h2>}>
        <AlbumCardContent id={id} />
      </Suspense>
    </ObservedDiv>
  );
}
