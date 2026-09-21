import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface Props {
  onBack?: () => void;
  backIcon?: 'back' | 'close';
  title?: ReactNode;
  stars?: number;
  left?: ReactNode;
  right?: ReactNode;
}

export function StarChip({ stars }: { stars: number }) {
  return (
    <span className="chip-stat chip-stars" aria-label={`${stars} sterren`}>
      <Icon name="star" />
      {stars}
    </span>
  );
}

export function TopBar({ onBack, backIcon = 'back', title, stars, left, right }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        {onBack && (
          <button className="btn btn-white btn-icon" onClick={onBack} aria-label={backIcon === 'close' ? 'stoppen' : 'terug'}>
            <Icon name={backIcon} size={26} />
          </button>
        )}
        {left}
      </div>
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-right">
        {right}
        {stars !== undefined && <StarChip stars={stars} />}
      </div>
    </header>
  );
}
