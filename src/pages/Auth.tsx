import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from '../lib/links';
import { Logo } from '../components/Logo';
import { useApp } from '../state/hooks';

function safeNext(next: string | null) {
  return next && next.startsWith('/app') ? next : '/app';
}

export function AuthPage({ mode }: { mode: 'signin' | 'signup' }) {
  const { store } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'signup') {
        store.signUp(name, email, password);
        navigate(`/onboarding?next=${encodeURIComponent(next)}`);
      } else {
        const u = store.signIn(email, password);
        navigate(u.onboarded ? next : '/onboarding');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const demo = () => {
    store.signInDemo();
    navigate(next);
  };

  return (
    <div className="auth">
      <Link to="/" className="auth__logo">
        <Logo />
      </Link>
      <div className="card auth__card">
        <h1>{mode === 'signup' ? 'Criar meu Avisê' : 'Entrar'}</h1>
        <p className="muted" style={{ margin: '6px 0 22px' }}>
          {mode === 'signup' ? 'Você escolhe o que quer. O AVISÊ fica de olho.' : 'Que bom te ver de novo.'}
        </p>
        <form className="stack" style={{ gap: 14 }} onSubmit={submit}>
          {mode === 'signup' && (
            <label className="field">
              <span>Nome</span>
              <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" />
            </label>
          )}
          <label className="field">
            <span>E-mail</span>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              className="input"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Mínimo de 6 caracteres' : '••••••'}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-lg btn-block" type="submit">
            {mode === 'signup' ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
        <div className="auth__or">
          <span>ou</span>
        </div>
        <button className="btn btn-secondary btn-block" onClick={demo}>
          Entrar com a conta de demonstração
        </button>
        <p className="hint" style={{ marginTop: 10, textAlign: 'center' }}>
          A conta demo já vem com BTS, Festival Alvorada e outros eventos no Radar.
        </p>
        <p style={{ marginTop: 22, textAlign: 'center', fontSize: 14 }} className="muted">
          {mode === 'signup' ? (
            <>
              Já tem conta?{' '}
              <Link className="link" to={`/entrar?next=${encodeURIComponent(next)}`}>
                Entrar
              </Link>
            </>
          ) : (
            <>
              Ainda não tem conta?{' '}
              <Link className="link" to={`/criar-conta?next=${encodeURIComponent(next)}`}>
                Criar meu Avisê
              </Link>
            </>
          )}
        </p>
      </div>
      <p className="faint" style={{ fontSize: 12, maxWidth: 400, textAlign: 'center' }}>
        Protótipo: a conta fica salva apenas neste navegador (sem servidor). Não use uma senha real.
      </p>
    </div>
  );
}
