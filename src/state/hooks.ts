import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { store } from './store';

export function useApp() {
  const root = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return { root, world: root.world, user: store.user, data: store.data, store };
}

/** Executa a ação se houver sessão; senão leva para o cadastro e volta depois. */
export function useRequireAuth() {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (action: () => void) => {
      if (user) action();
      else navigate(`/criar-conta?next=${encodeURIComponent(location.pathname + location.search)}`);
    },
    [user, navigate, location],
  );
}

/** Relógio que atualiza a cada `ms` (countdowns). */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setMatch(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return match;
}
