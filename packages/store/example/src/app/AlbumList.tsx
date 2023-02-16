import { useAlbumList } from './storeHooks';
import { AlbumCard } from './AlbumCard';

export function AlbumList() {
  const albums = useAlbumList();

  if (!albums) return <div>Loading...</div>;

  return (
    <div>
      {albums.map((album) => (
        <AlbumCard key={album.id} id={album.id} />
      ))}
    </div>
  );
}
