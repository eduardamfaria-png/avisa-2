import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export function SearchBar({ size = 'md', autoFocus, placeholder = 'Artista, evento, festival, local…' }: { size?: 'md' | 'lg'; autoFocus?: boolean; placeholder?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const onSearchPage = location.pathname === '/app/busca';
  const [q, setQ] = useState(onSearchPage ? params.get('q') ?? '' : '');

  useEffect(() => {
    if (onSearchPage) setQ(params.get('q') ?? '');
  }, [onSearchPage, params]);

  return (
    <form
      role="search"
      className={`searchbar${size === 'lg' ? ' searchbar--lg' : ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) navigate(`/app/busca?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search size={19} />
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label="Buscar"
        onChange={(e) => {
          setQ(e.target.value);
          if (onSearchPage) navigate(`/app/busca?q=${encodeURIComponent(e.target.value)}`, { replace: true });
        }}
      />
    </form>
  );
}
