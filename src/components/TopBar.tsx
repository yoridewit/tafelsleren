import type { ReactNode } from 'react';

interface Props {
  onBack?: () => void;
  title?: ReactNode;
  stars?: number;
  right?: ReactNode;
}

export function TopBar({ onBack, title, stars, right }: Props) {
  return (
    <header className="topbar">
      {onBack ? (
        <button className="btn btn-round btn-white" onClick={onBack} aria-label="terug">
          ←
        </button>
      ) : (
        <span />
      )}
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-right">
        {right}
        {stars !== undefined && <span className="pill pill-stars">⭐ {stars}</span>}
      </div>
    </header>
  );
}
