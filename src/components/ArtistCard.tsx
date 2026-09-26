import { Link } from 'react-router-dom';
import type { Artist } from '../core/types';
import { FollowButton } from './FollowButton';
import { UserAvatar } from './UserAvatar';

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <div className="card artist-card">
      <Link to={`/app/artista/${artist.id}`} className="stack" style={{ alignItems: 'center', gap: 10 }}>
        <UserAvatar name={artist.name} hue={artist.hue} size={84} />
        <span className="artist-card__name">{artist.name}</span>
        <small>{artist.genre}</small>
      </Link>
      <FollowButton artist={artist} block />
    </div>
  );
}
