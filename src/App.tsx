import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AppLayout, RequireAuth } from './components/AppLayout';
import { ToastProvider } from './components/Toast';
import { Alertas } from './pages/Alertas';
import { ArtistPage } from './pages/ArtistPage';
import { AuthPage } from './pages/Auth';
import { Busca } from './pages/Busca';
import { Calendario } from './pages/Calendario';
import { Comunidade } from './pages/Comunidade';
import { EventPage } from './pages/EventPage';
import { Explorar } from './pages/Explorar';
import { Ingresso } from './pages/Ingresso';
import { Landing } from './pages/Landing';
import { MeuAvise } from './pages/MeuAvise';
import { Onboarding } from './pages/Onboarding';
import { Perfil } from './pages/Perfil';
import { ScrollToTop } from './components/ScrollToTop';

function NotFound() {
  return (
    <div className="empty" style={{ margin: 40 }}>
      <h3>Página não encontrada</h3>
      <Link to="/" className="btn btn-primary">
        Ir para o início
      </Link>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/entrar" element={<AuthPage mode="signin" />} />
          <Route path="/criar-conta" element={<AuthPage mode="signup" />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<RequireAuth><MeuAvise /></RequireAuth>} />
            <Route path="calendario" element={<RequireAuth><Calendario /></RequireAuth>} />
            <Route path="explorar" element={<Explorar />} />
            <Route path="busca" element={<Busca />} />
            <Route path="alertas" element={<RequireAuth><Alertas /></RequireAuth>} />
            <Route path="comunidade" element={<Comunidade />} />
            <Route path="perfil" element={<RequireAuth><Perfil /></RequireAuth>} />
            <Route path="evento/:id" element={<EventPage />} />
            <Route path="artista/:id" element={<ArtistPage />} />
            <Route path="ingresso/:listingId" element={<Ingresso />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
