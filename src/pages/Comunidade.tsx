import { Award, Camera, Sparkles, Star } from 'lucide-react';
import { Link } from '../lib/links';

export function Comunidade() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Comunidade</h1>
          <p>Experiências reais de quem foi — focada em eventos, não em feed infinito.</p>
        </div>
      </div>
      <div className="empty" style={{ padding: '44px 20px' }}>
        <span className="badge badge--purple">Próxima fase</span>
        <h3>Estamos preparando este espaço</h3>
        <p>Primeiro deixamos o Radar, os alertas e o monitoramento de preços funcionando muito bem. Depois vêm:</p>
        <div className="grid grid--2" style={{ width: '100%', maxWidth: 620, marginTop: 10, textAlign: 'left' }}>
          {[
            { icon: Camera, t: 'Experiências', d: 'Fotos e relatos por evento, com curtidas e comentários.' },
            { icon: Star, t: 'Avaliações', d: 'Experiência, organização, estrutura e custo-benefício. “Você iria novamente?”' },
            { icon: Sparkles, t: 'Minha retrospectiva', d: 'Seu ano em eventos, pronto para compartilhar.' },
            { icon: Award, t: 'Conquistas', d: 'Primeiro festival, 5 cidades, 10 avaliações…' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="card card-pad">
              <Icon size={20} color="var(--purple)" />
              <strong style={{ display: 'block', marginTop: 8 }}>{t}</strong>
              <p className="muted" style={{ fontSize: 13.5 }}>
                {d}
              </p>
            </div>
          ))}
        </div>
        <Link to="/app" className="btn btn-primary" style={{ marginTop: 12 }}>
          Voltar ao Meu Avisê
        </Link>
      </div>
    </>
  );
}
