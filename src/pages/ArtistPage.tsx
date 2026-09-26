import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EventTile } from '../components/EventCard';
import { EventCover } from '../components/EventCover';
import { FollowButton } from '../components/FollowButton';
import { UserAvatar } from '../components/UserAvatar';
import { describeScope, isInScope } from '../core/location';
import { catalog } from '../services/catalog';
import { isUpcoming } from '../services/recommendations';
import { useApp } from '../state/hooks';

export function ArtistPage() {
  const { id } = useParams();
  const { world, data } = useApp();
  const navigate = useNavigate();
  const artist = catalog.artist(id ?? '');
  if (!artist)
    return (
      <div className="empty">
        <h3>Artista não encontrado</h3>
        <Link to="/app/explorar" className="btn btn-primary">
          Explorar
        </Link>
      </div>
    );

  const pref = data?.artistPrefs.find((p) => p.artistId === artist.id);
  const home = catalog.city(data?.prefs.homeCityId) ?? null;
  const events = world.events.filter((e) => e.artistIds.includes(artist.id) && isUpcoming(e)).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginLeft: -10, marginBottom: 10 }}>
        <ArrowLeft size={17} /> Voltar
      </button>
      <EventCover hue={artist.hue} className="artist-hero">
        <div className="artist-hero__inner">
          <UserAvatar name={artist.name} hue={artist.hue} size={88} />
          <div className="spacer">
            <h1>{artist.name}</h1>
            <p className="muted">
              {artist.genre} · {artist.followers.toLocaleString('pt-BR')} seguidores no AVISÊ
            </p>
          </div>
          <FollowButton artist={artist} size="md" />
        </div>
      </EventCover>

      <div className="card card-pad" style={{ marginTop: 14 }}>
        {pref ? (
          <>
            <strong>Você acompanha {artist.name} em: {describeScope(pref, catalog.cityName, home?.name)}</strong>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              Vamos avisar quando surgir show novo nessa área. Toque em “Seguindo” para mudar.
            </p>
          </>
        ) : (
          <>
            <strong>Siga {artist.name} para saber de novas datas</strong>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              Você escolhe onde acompanhar: sua cidade, até X km, cidades específicas, Brasil inteiro ou internacional.
            </p>
          </>
        )}
        <p className="hint" style={{ marginTop: 8 }}>
          {artist.bio} Dados de agenda desta página são fictícios (demonstração).
        </p>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Próximos eventos</h2>
          <span className="faint" style={{ fontSize: 13 }}>
            {events.length}
          </span>
        </div>
        {events.length === 0 ? (
          <div className="empty">
            <h3>Evento ainda não anunciado</h3>
            <p>Estamos acompanhando. {pref ? 'Você será avisado assim que surgir uma data.' : 'Siga o artista para ser avisado.'}</p>
          </div>
        ) : (
          <div className="grid grid--3">
            {events.map((e) => {
              const city = catalog.city(e.cityId)!;
              const outside = pref && !isInScope(pref, city, home);
              return <EventTile key={e.id} event={e} reason={outside ? 'Fora da área que você escolheu para este artista.' : undefined} />;
            })}
          </div>
        )}
      </section>
    </>
  );
}
