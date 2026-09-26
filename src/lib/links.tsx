import type { KeyboardEvent, MouseEvent } from 'react';
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  useLocation,
  useMatch,
  useNavigate,
  useResolvedPath,
  type LinkProps,
  type NavLinkProps,
} from 'react-router-dom';

/**
 * Na versão publicada como link do Claude, o ambiente intercepta cliques em
 * `<a href>`. Ali os links internos viram elementos que não são `<a>` que navegam
 * pelo roteador; no site normal continuam sendo links de verdade.
 */
const IN_MEMORY = import.meta.env.VITE_ROUTER === 'memory';

function useInternalNav(to: LinkProps['to'], replace?: boolean) {
  const navigate = useNavigate();
  return {
    role: 'link',
    tabIndex: 0,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter') navigate(to, { replace });
    },
    go: (e: MouseEvent<HTMLElement>) => {
      if (e.defaultPrevented) return;
      e.preventDefault();
      navigate(to, { replace });
    },
  };
}

export function Link({ to, replace, onClick, style, ...rest }: LinkProps) {
  const nav = useInternalNav(to, replace);
  if (!IN_MEMORY) return <RouterLink to={to} replace={replace} onClick={onClick} style={style} {...rest} />;
  const { reloadDocument: _r, preventScrollReset: _p, relative: _rel, viewTransition: _v, state: _s, discover: _d, ...anchor } = rest as LinkProps & Record<string, unknown>;
  void [_r, _p, _rel, _v, _s, _d];
  return (
    <span
      {...(anchor as React.HTMLAttributes<HTMLSpanElement>)}
      role={nav.role}
      tabIndex={nav.tabIndex}
      onKeyDown={nav.onKeyDown}
      style={{ cursor: 'pointer', ...style }}
      onClick={(e) => {
        onClick?.(e as unknown as MouseEvent<HTMLAnchorElement>);
        nav.go(e);
      }}
    />
  );
}

export function NavLink({ to, end, className, children, ...rest }: NavLinkProps) {
  const resolved = useResolvedPath(to);
  const active = !!useMatch({ path: resolved.pathname, end: !!end });
  if (!IN_MEMORY) return <RouterNavLink to={to} end={end} className={className} {...rest}>{children}</RouterNavLink>;
  const cls = typeof className === 'function' ? className({ isActive: active, isPending: false, isTransitioning: false }) : `${className ?? ''}${active ? ' active' : ''}`;
  return (
    <Link to={to} className={cls} aria-current={active ? 'page' : undefined} style={rest.style as React.CSSProperties}>
      {typeof children === 'function' ? children({ isActive: active, isPending: false, isTransitioning: false }) : children}
    </Link>
  );
}

/** Volta para a tela anterior do app; se não houver, vai para `fallback`. */
export function useGoBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();
  return () => (location.key !== 'default' ? navigate(-1) : navigate(fallback));
}
