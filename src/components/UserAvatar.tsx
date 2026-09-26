import type { CSSProperties } from 'react';

export function initials(name: string) {
  const parts = name.replace(/&/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].length <= 3 ? parts[0].toUpperCase() : parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({ name, hue = 255, size = 40 }: { name: string; hue?: number; size?: number }) {
  return (
    <span className="avatar" style={{ '--h': hue, width: size, height: size, fontSize: size * 0.36 } as CSSProperties} aria-hidden>
      {initials(name)}
    </span>
  );
}
