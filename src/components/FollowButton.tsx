import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Artist } from '../core/types';
import { useApp, useRequireAuth } from '../state/hooks';
import { FollowModal } from './FollowModal';
import { useToast } from './Toast';

export function FollowButton({ artist, size = 'sm', block }: { artist: Artist; size?: 'sm' | 'md'; block?: boolean }) {
  const { data } = useApp();
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const following = !!data?.artistPrefs.some((p) => p.artistId === artist.id);
  return (
    <>
      <button
        className={`btn ${following ? 'btn-success' : 'btn-secondary'} ${size === 'sm' ? 'btn-sm' : ''} ${block ? 'btn-block' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          requireAuth(() => setOpen(true));
        }}
      >
        {following ? <Check size={16} /> : <Plus size={16} />}
        {following ? 'Seguindo' : 'Seguir'}
      </button>
      {open && (
        <FollowModal
          artist={artist}
          onClose={() => setOpen(false)}
          onSaved={(s) => toast({ icon: '✓', title: `Seguindo ${artist.name}`, text: `Vamos avisar sobre novos shows: ${s}.` })}
        />
      )}
    </>
  );
}
