import { Bell, CalendarDays, Compass, Radar, UserRound, UsersRound } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Link, NavLink } from '../lib/links';
import { useApp } from '../state/hooks';
import { Logo } from './Logo';
import { NotificationCenter } from './NotificationCenter';
import { SearchBar } from './SearchBar';
import { SimulationPanel } from './SimulationPanel';
import { UserAvatar } from './UserAvatar';

const NAV = [
  { to: '/app', label: 'Meu Avisê', icon: Radar, end: true },
  { to: '/app/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/app/explorar', label: 'Explorar', icon: Compass },
  { to: '/app/alertas', label: 'Alertas', icon: Bell },
  { to: '/app/comunidade', label: 'Comunidade', icon: UsersRound },
  { to: '/app/perfil', label: 'Perfil', icon: UserRound },
];
const MOBILE_NAV = NAV.filter((n) => n.to !== '/app/comunidade');

export function Sidebar() {
  const { user, data } = useApp();
  const unread = data?.notifications.filter((n) => !n.read).length ?? 0;
  return (
    <aside className="sidebar">
      <Link to={user ? '/app' : '/'}>
        <Logo />
      </Link>
      <nav aria-label="Principal">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="side-link">
            <Icon size={20} />
            {label}
            {to === '/app/alertas' && unread > 0 && <span className="count">{unread}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer">
        {user ? (
          <>
            <SimulationPanel compact />
            <Link to="/app/perfil" className="side-link">
              <UserAvatar name={user.name} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', color: 'var(--text)', fontSize: 14 }}>{user.name}</span>
                <span className="faint" style={{ fontSize: 12 }}>@{user.username}</span>
              </span>
            </Link>
          </>
        ) : (
          <div className="card card-pad">
            <strong>Você escolhe o que quer.</strong>
            <p className="muted" style={{ fontSize: 13, margin: '4px 0 12px' }}>
              O AVISÊ fica de olho.
            </p>
            <Link to="/criar-conta" className="btn btn-primary btn-sm btn-block">
              Criar meu Avisê
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

export function BottomNavigation() {
  const { data } = useApp();
  const unread = data?.notifications.filter((n) => !n.read).length ?? 0;
  return (
    <nav className="bottom-nav" aria-label="Principal">
      {MOBILE_NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end}>
          <Icon size={22} />
          {label}
          {to === '/app/alertas' && unread > 0 && <span className="nav-dot">{unread > 9 ? '9+' : unread}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function TopBar() {
  const { user } = useApp();
  return (
    <header className="topbar">
      <Link to={user ? '/app' : '/'} className="logo">
        <Logo size={28} />
      </Link>
      <div className="topbar__search">
        <SearchBar />
      </div>
      <Link to="/app/comunidade" className="icon-btn topbar__mobile-only" aria-label="Comunidade">
        <UsersRound size={21} />
      </Link>
      {user ? (
        <NotificationCenter />
      ) : (
        <>
          <Link to="/entrar" className="btn btn-ghost btn-sm">
            Entrar
          </Link>
          <Link to="/criar-conta" className="btn btn-primary btn-sm">
            Criar conta
          </Link>
        </>
      )}
    </header>
  );
}

export function AppLayout() {
  const { user } = useApp();
  const location = useLocation();
  if (user && !user.onboarded) return <Navigate to="/onboarding" replace />;
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <TopBar />
        <main className="content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) return <Navigate to={`/entrar?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}
