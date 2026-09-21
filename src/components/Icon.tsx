import type { ReactElement } from 'react';

/** Eigen lijn-icoontjes (24×24, afgeronde lijnen) zodat de bediening overal hetzelfde oogt. */
const PATHS: Record<string, ReactElement> = {
  back: <path d="M15 18l-6-6 6-6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l11-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  musicOff: (
    <>
      <path d="M9 18V6l11-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
      <path d="M3 3l18 18" />
    </>
  ),
  star: (
    <path
      d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"
      fill="currentColor"
      strokeWidth="1.2"
    />
  ),
  flame: (
    <path
      d="M12 2.5c.8 3.2 4.8 5.3 4.8 9.8a4.8 4.8 0 0 1-9.6 0c0-2 1-3.5 2-4.4.3 1.6 1.1 2.6 2.2 3C10.8 8.2 11 5.2 12 2.5z"
      fill="currentColor"
      strokeWidth="1.2"
    />
  ),
  bag: (
    <>
      <path d="M5.5 8h13l-1.2 12.2a1 1 0 0 1-1 .8H7.7a1 1 0 0 1-1-.8z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" />
      <path d="M9 7h6" />
    </>
  ),
  bolt: <path d="M13 2.5L4.5 13.5H11L10 21.5l8.5-11H12z" fill="currentColor" strokeWidth="1.2" />,
  speaker: (
    <>
      <path d="M11 5L6.5 9H3.5v6h3L11 19z" fill="currentColor" strokeWidth="1.2" />
      <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  play: <path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5a.8.8 0 0 0-1.2.7z" fill="currentColor" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  backspace: (
    <>
      <path d="M9 5h10.5A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5H9l-6-7z" />
      <path d="M12.5 9.5l5 5M17.5 9.5l-5 5" />
    </>
  ),
  map: (
    <>
      <path d="M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </>
  ),
  replay: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4.5H15" />
    </>
  ),
  sparkle: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" fill="currentColor" strokeWidth="1.2" />,
  download: <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />,
  upload: <path d="M12 16V5M7 9.5l5-5 5 5M5 20h14" />,
  trash: <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, className = '' }: { name: IconName; size?: number | string; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
