import type { ReactElement } from 'react';

/* Alle items zijn getekend in het coördinatenstelsel van het elfje (viewBox 0 -30 200 290).
   Hoofd: middelpunt (100,78), straal 40. Nek ~ (100,118). Rechterhand ~ (142,165). */

const star = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`);
  }
  return pts.join(' ');
};

const heart = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy + s * 0.9} C${cx - s * 1.6} ${cy - s * 0.1} ${cx - s * 0.7} ${cy - s * 1.2} ${cx} ${cy - s * 0.4} C${cx + s * 0.7} ${cy - s * 1.2} ${cx + s * 1.6} ${cy - s * 0.1} ${cx} ${cy + s * 0.9}Z`;

export const BACKGROUNDS: Record<string, ReactElement> = {
  sterrenhemel: (
    <g>
      <defs>
        <linearGradient id="bg-nacht" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e1b4b" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <rect x="0" y="-30" width="200" height="290" rx="28" fill="url(#bg-nacht)" />
      {[
        [25, 0], [170, -10], [150, 40], [30, 70], [180, 110], [15, 140], [60, 20], [120, -15],
      ].map(([x, y], i) => (
        <polygon key={i} points={star(x, y, i % 2 ? 5 : 8)} fill="#fde68a" />
      ))}
      <circle cx="165" cy="10" r="14" fill="#fef9c3" />
      <circle cx="171" cy="5" r="12" fill="#312e81" />
    </g>
  ),
  regenboog: (
    <g>
      <rect x="0" y="-30" width="200" height="290" rx="28" fill="#bae6fd" />
      {['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa'].map((c, i) => (
        <path key={c} d={`M${10 + i * 9} 170 A ${90 - i * 9} ${90 - i * 9} 0 0 1 ${190 - i * 9} 170`} stroke={c} strokeWidth="9" fill="none" />
      ))}
      <ellipse cx="30" cy="172" rx="30" ry="14" fill="#fff" />
      <ellipse cx="170" cy="172" rx="30" ry="14" fill="#fff" />
      <rect x="0" y="215" width="200" height="45" rx="0" fill="#86efac" />
    </g>
  ),
  paddenstoelen: (
    <g>
      <rect x="0" y="-30" width="200" height="290" rx="28" fill="#d9f99d" />
      <rect x="0" y="200" width="200" height="60" fill="#65a30d" />
      {[
        [25, 205, 1], [178, 210, 0.8], [160, 170, 0.55],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x="-8" y="-25" width="16" height="30" rx="6" fill="#fef3c7" />
          <path d="M-30 -22 Q0 -60 30 -22Z" fill="#ef4444" />
          <circle cx="-12" cy="-32" r="4" fill="#fff" />
          <circle cx="8" cy="-38" r="5" fill="#fff" />
          <circle cx="18" cy="-27" r="3" fill="#fff" />
        </g>
      ))}
    </g>
  ),
  kasteel: (
    <g>
      <rect x="0" y="-30" width="200" height="290" rx="28" fill="#fbcfe8" />
      <g fill="#c4b5fd">
        <rect x="120" y="60" width="60" height="140" />
        <rect x="112" y="40" width="22" height="160" />
        <rect x="166" y="40" width="22" height="160" />
        <polygon points="110,40 123,5 136,40" fill="#a78bfa" />
        <polygon points="164,40 177,5 190,40" fill="#a78bfa" />
        <rect x="140" y="160" width="20" height="40" rx="10" fill="#7c3aed" />
      </g>
      <rect x="0" y="210" width="200" height="50" fill="#f9a8d4" />
    </g>
  ),
};

export const PETS: Record<string, ReactElement> = {
  lieveheersbeestje: (
    <g transform="translate(34 222)">
      <circle cx="0" cy="-10" r="9" fill="#1f2937" />
      <ellipse cx="0" cy="6" rx="18" ry="16" fill="#ef4444" />
      <line x1="0" y1="-8" x2="0" y2="22" stroke="#1f2937" strokeWidth="2" />
      <circle cx="-8" cy="2" r="3.5" fill="#1f2937" />
      <circle cx="8" cy="2" r="3.5" fill="#1f2937" />
      <circle cx="-7" cy="13" r="3" fill="#1f2937" />
      <circle cx="7" cy="13" r="3" fill="#1f2937" />
      <circle cx="-3" cy="-12" r="2" fill="#fff" />
      <circle cx="3" cy="-12" r="2" fill="#fff" />
    </g>
  ),
  katje: (
    <g transform="translate(34 218)">
      <ellipse cx="0" cy="18" rx="20" ry="14" fill="#fb923c" />
      <path d="M-18 -8 L-16 -26 L-4 -14Z M18 -8 L16 -26 L4 -14Z" fill="#fb923c" />
      <circle cx="0" cy="0" r="18" fill="#fb923c" />
      <circle cx="-7" cy="-2" r="3" fill="#1f2937" />
      <circle cx="7" cy="-2" r="3" fill="#1f2937" />
      <path d="M-3 5 L0 8 L3 5" stroke="#1f2937" strokeWidth="1.8" fill="none" />
      <path d="M-20 3 H-10 M-20 8 H-10 M20 3 H10 M20 8 H10" stroke="#7c2d12" strokeWidth="1.2" />
      <path d="M18 20 Q34 18 30 0" stroke="#fb923c" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  ),
  uiltje: (
    <g transform="translate(34 216)">
      <ellipse cx="0" cy="10" rx="20" ry="24" fill="#a16207" />
      <ellipse cx="0" cy="16" rx="13" ry="15" fill="#fde68a" />
      <path d="M-18 -10 L-14 -22 L-6 -12Z M18 -10 L14 -22 L6 -12Z" fill="#a16207" />
      <circle cx="-8" cy="-4" r="8" fill="#fff" />
      <circle cx="8" cy="-4" r="8" fill="#fff" />
      <circle cx="-8" cy="-4" r="4" fill="#1f2937" />
      <circle cx="8" cy="-4" r="4" fill="#1f2937" />
      <polygon points="-3,3 3,3 0,9" fill="#f59e0b" />
    </g>
  ),
  draakje: (
    <g transform="translate(36 214)">
      <path d="M14 20 Q38 26 34 4 L40 0 L30 0" fill="#22c55e" />
      <ellipse cx="0" cy="18" rx="18" ry="16" fill="#4ade80" />
      <ellipse cx="0" cy="22" rx="10" ry="10" fill="#bbf7d0" />
      <path d="M-14 6 L-24 -6 L-6 0Z" fill="#86efac" />
      <circle cx="0" cy="-4" r="16" fill="#4ade80" />
      <path d="M-8 -18 L-6 -28 L-2 -18Z M4 -18 L8 -28 L10 -17Z" fill="#fde047" />
      <circle cx="-6" cy="-6" r="3" fill="#1f2937" />
      <circle cx="6" cy="-6" r="3" fill="#1f2937" />
      <path d="M-5 3 Q0 7 5 3" stroke="#166534" strokeWidth="2" fill="none" />
    </g>
  ),
  eenhoorn: (
    <g transform="translate(36 214)">
      <ellipse cx="4" cy="22" rx="22" ry="14" fill="#fff" stroke="#e9d5ff" strokeWidth="2" />
      <ellipse cx="-6" cy="-2" rx="15" ry="17" fill="#fff" stroke="#e9d5ff" strokeWidth="2" />
      <ellipse cx="-12" cy="8" rx="9" ry="7" fill="#fbcfe8" />
      <polygon points="-4,-18 2,-40 6,-16" fill="#fde047" stroke="#f59e0b" strokeWidth="1.5" />
      <path d="M6 -14 Q22 -8 16 10 Q26 4 24 18" stroke="#f472b6" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M8 -8 Q18 0 12 14" stroke="#a78bfa" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="-4" cy="-4" r="3" fill="#1f2937" />
    </g>
  ),
};

export const WINGS: Record<string, ReactElement> = {
  default: (
    <g fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2" opacity="0.9">
      <ellipse cx="60" cy="118" rx="30" ry="46" transform="rotate(-35 60 118)" />
      <ellipse cx="68" cy="165" rx="18" ry="28" transform="rotate(25 68 165)" />
      <ellipse cx="140" cy="118" rx="30" ry="46" transform="rotate(35 140 118)" />
      <ellipse cx="132" cy="165" rx="18" ry="28" transform="rotate(-25 132 165)" />
    </g>
  ),
  vlindervleugels: (
    <g stroke="#9a3412" strokeWidth="2">
      <path d="M96 130 C40 60 10 100 30 140 C45 165 80 150 96 140Z" fill="#fb923c" />
      <path d="M96 142 C60 150 40 190 70 195 C88 197 96 170 96 150Z" fill="#f472b6" />
      <path d="M104 130 C160 60 190 100 170 140 C155 165 120 150 104 140Z" fill="#fb923c" />
      <path d="M104 142 C140 150 160 190 130 195 C112 197 104 170 104 150Z" fill="#f472b6" />
      <circle cx="50" cy="120" r="9" fill="#fef08a" />
      <circle cx="150" cy="120" r="9" fill="#fef08a" />
      <circle cx="72" cy="178" r="6" fill="#fff" />
      <circle cx="128" cy="178" r="6" fill="#fff" />
    </g>
  ),
  'gouden-vleugels': (
    <g>
      <g fill="#fde047" stroke="#d97706" strokeWidth="2">
        <ellipse cx="56" cy="112" rx="34" ry="52" transform="rotate(-38 56 112)" />
        <ellipse cx="66" cy="168" rx="20" ry="32" transform="rotate(25 66 168)" />
        <ellipse cx="144" cy="112" rx="34" ry="52" transform="rotate(38 144 112)" />
        <ellipse cx="134" cy="168" rx="20" ry="32" transform="rotate(-25 134 168)" />
      </g>
      {[[40, 95], [60, 130], [160, 95], [140, 130], [66, 170], [134, 170]].map(([x, y], i) => (
        <polygon key={i} points={star(x, y, 6)} fill="#fff" />
      ))}
    </g>
  ),
  regenboogvleugels: (
    <g opacity="0.95">
      {['#f87171', '#facc15', '#4ade80', '#60a5fa', '#c084fc'].map((c, i) => (
        <g key={c} fill="none" stroke={c} strokeWidth="7">
          <ellipse cx="58" cy="115" rx={36 - i * 7} ry={52 - i * 9} transform="rotate(-35 58 115)" />
          <ellipse cx="142" cy="115" rx={36 - i * 7} ry={52 - i * 9} transform="rotate(35 142 115)" />
        </g>
      ))}
      <g fill="#fce7f3" stroke="#f472b6" strokeWidth="2">
        <ellipse cx="68" cy="167" rx="18" ry="28" transform="rotate(25 68 167)" />
        <ellipse cx="132" cy="167" rx="18" ry="28" transform="rotate(-25 132 167)" />
      </g>
    </g>
  ),
};

/** Items achter het lijf (bijv. een cape). */
export const BACK_ITEMS: Record<string, ReactElement> = {
  cape: (
    <g>
      <path d="M78 118 L48 222 Q100 238 152 222 L122 118Z" fill="#1e3a8a" />
      {[[70, 180], [100, 205], [130, 175], [88, 150], [118, 145]].map(([x, y], i) => (
        <polygon key={i} points={star(x, y, 6)} fill="#fde68a" />
      ))}
    </g>
  ),
};

export const NECK: Record<string, ReactElement> = {
  'sjaal-rood': (
    <g>
      <rect x="76" y="110" width="48" height="14" rx="7" fill="#ef4444" />
      <rect x="106" y="116" width="12" height="36" rx="5" fill="#dc2626" transform="rotate(-8 112 116)" />
      <path d="M107 150 h12 M108 146 h11" stroke="#fecaca" strokeWidth="2" />
    </g>
  ),
  parels: (
    <g fill="#fff" stroke="#e9d5ff" strokeWidth="1">
      {Array.from({ length: 11 }, (_, i) => {
        const a = Math.PI * (0.15 + (0.7 * i) / 10);
        return <circle key={i} cx={100 - 24 * Math.cos(a)} cy={108 + 14 * Math.sin(a)} r="3.6" />;
      })}
      <circle cx="100" cy="126" r="5" fill="#fbcfe8" />
    </g>
  ),
  regenboogsjaal: (
    <g>
      {['#f87171', '#facc15', '#4ade80', '#60a5fa'].map((c, i) => (
        <rect key={c} x={76} y={109 + i * 4} width="48" height="4.5" fill={c} />
      ))}
      {['#f87171', '#facc15', '#4ade80', '#60a5fa'].map((c, i) => (
        <rect key={c + 'e'} x={84 + i * 3} y={118} width="3.5" height="34" fill={c} transform="rotate(8 90 118)" />
      ))}
    </g>
  ),
  cape: (
    <g>
      <path d="M78 114 Q100 126 122 114" stroke="#1e3a8a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <polygon points={star(100, 121, 7)} fill="#fde047" stroke="#d97706" strokeWidth="1" />
    </g>
  ),
};

export const HATS: Record<string, ReactElement> = {
  strik: (
    <g transform="translate(128 46) rotate(20)">
      <path d="M0 0 L-20 -12 L-20 12Z" fill="#f472b6" stroke="#db2777" strokeWidth="2" />
      <path d="M0 0 L20 -12 L20 12Z" fill="#f472b6" stroke="#db2777" strokeWidth="2" />
      <circle r="6" fill="#ec4899" />
    </g>
  ),
  feestmuts: (
    <g>
      <polygon points="76,44 124,44 108,-8" fill="#38bdf8" />
      <path d="M81 36 L119 36 M88 22 L114 22 M95 8 L111 8" stroke="#facc15" strokeWidth="5" />
      <circle cx="108" cy="-10" r="8" fill="#f472b6" />
    </g>
  ),
  bloemenkrans: (
    <g>
      <path d="M62 60 Q100 20 138 60" stroke="#16a34a" strokeWidth="4" fill="none" />
      {[[64, 56, '#f472b6'], [78, 42, '#facc15'], [94, 35, '#fff'], [110, 35, '#f472b6'], [124, 42, '#c084fc'], [136, 56, '#facc15']].map(
        ([x, y, c], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 72, 144, 216, 288].map((r) => (
              <circle key={r} cx={5 * Math.cos((r * Math.PI) / 180)} cy={5 * Math.sin((r * Math.PI) / 180)} r="4" fill={c as string} />
            ))}
            <circle r="3" fill="#f59e0b" />
          </g>
        ),
      )}
    </g>
  ),
  heksenhoed: (
    <g>
      <path d="M72 44 L104 -26 L116 -12 L128 44Z" fill="#7c3aed" />
      <ellipse cx="100" cy="44" rx="50" ry="10" fill="#6d28d9" />
      <rect x="76" y="32" width="50" height="8" fill="#f472b6" />
      <polygon points={star(106, 10, 7)} fill="#fde047" />
      <polygon points={star(92, 24, 4)} fill="#fde047" />
    </g>
  ),
  kroon: (
    <g>
      <path d="M70 46 L68 14 L84 30 L100 6 L116 30 L132 14 L130 46Z" fill="#facc15" stroke="#d97706" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="100" cy="34" r="5" fill="#ef4444" />
      <circle cx="82" cy="38" r="3.5" fill="#3b82f6" />
      <circle cx="118" cy="38" r="3.5" fill="#22c55e" />
    </g>
  ),
  diadeem: (
    <g>
      <path d="M64 58 Q100 28 136 58" stroke="#facc15" strokeWidth="5" fill="none" />
      <polygon points={star(100, 30, 14)} fill="#fde047" stroke="#d97706" strokeWidth="2" />
      <circle cx="80" cy="44" r="3.5" fill="#f9a8d4" />
      <circle cx="120" cy="44" r="3.5" fill="#f9a8d4" />
    </g>
  ),
};

/** Toverstaven, getekend vanaf de hand (0,0). */
export const WANDS: Record<string, ReactElement> = {
  sterrenstaf: (
    <g>
      <line x1="0" y1="8" x2="10" y2="-44" stroke="#a16207" strokeWidth="5" strokeLinecap="round" />
      <polygon points={star(11, -52, 15)} fill="#fde047" stroke="#d97706" strokeWidth="2" />
    </g>
  ),
  hartjesstaf: (
    <g>
      <line x1="0" y1="8" x2="10" y2="-44" stroke="#f9a8d4" strokeWidth="5" strokeLinecap="round" />
      <path d={heart(11, -52, 12)} fill="#ec4899" stroke="#be185d" strokeWidth="2" />
    </g>
  ),
  maanstaf: (
    <g>
      <line x1="0" y1="8" x2="10" y2="-44" stroke="#c4b5fd" strokeWidth="5" strokeLinecap="round" />
      <circle cx="11" cy="-54" r="14" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
      <circle cx="18" cy="-58" r="12" fill="#fff" opacity="0.95" />
    </g>
  ),
  regenboogstaf: (
    <g>
      <line x1="0" y1="8" x2="10" y2="-44" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <line x1="0" y1="8" x2="10" y2="-44" stroke="#f472b6" strokeWidth="6" strokeDasharray="5 5" strokeLinecap="round" />
      {['#f87171', '#facc15', '#4ade80', '#60a5fa', '#c084fc'].map((c, i) => (
        <circle key={c} cx="11" cy="-54" r={16 - i * 3} fill={c} />
      ))}
    </g>
  ),
};
