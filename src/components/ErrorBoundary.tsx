import { Component, type ReactNode } from 'react';

/** Mostra o erro na tela em vez de deixar a página em branco. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="auth">
        <div className="card auth__card stack">
          <h1>Algo deu errado nesta tela</h1>
          <p className="muted">Toque em “Voltar ao início” para continuar. Se acontecer de novo, envie a mensagem abaixo.</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--yellow)', margin: 0 }}>{String(this.state.error.stack ?? this.state.error.message).slice(0, 800)}</pre>
          <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }
}
