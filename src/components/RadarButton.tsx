import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Event } from '../core/types';
import { useApp, useRequireAuth } from '../state/hooks';
import { RadarModal } from './RadarModal';
import { useToast } from './Toast';

export function RadarButton({ event, size = 'md', block, short }: { event: Event; size?: 'sm' | 'md' | 'lg'; block?: boolean; short?: boolean }) {
  const { data } = useApp();
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const inRadar = !!data?.radar.some((r) => r.eventId === event.id);
  const sz = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  return (
    <>
      <button
        className={`btn radar-btn ${inRadar ? 'is-in' : 'btn-primary'} ${sz} ${block ? 'btn-block' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          requireAuth(() => setOpen(true));
        }}
      >
        {inRadar ? <Check size={17} strokeWidth={2.6} /> : <Plus size={17} strokeWidth={2.6} />}
        {inRadar ? (short ? 'No Avisê' : 'No seu Avisê') : short ? 'Avisê' : 'Adicionar ao Meu Avisê'}
      </button>
      {open && (
        <RadarModal
          event={event}
          onClose={() => setOpen(false)}
          onSaved={(isNew) =>
            toast({
              icon: '📡',
              title: isNew ? 'No seu Avisê!' : 'Radar atualizado',
              text: isNew ? `Agora é com a gente. Vamos ficar de olho em ${event.title} e te avisar se algo mudar.` : 'Suas preferências para este evento foram salvas.',
            })
          }
        />
      )}
    </>
  );
}
