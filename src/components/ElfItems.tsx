import type { ReactElement } from 'react';
import type { Rarity } from '../data/shop';

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

const snowflake = (cx: number, cy: number, r: number, color = '#fff'): ReactElement => (
  <g key={`${cx}-${cy}`} stroke={color} strokeWidth={Math.max(1.4, r * 0.22)} strokeLinecap="round">
    {[0, 60, 120].map((deg) => (
      <line
        key={deg}
        x1={cx - r * Math.cos((deg * Math.PI) / 180)}
        y1={cy - r * Math.sin((deg * Math.PI) / 180)}
        x2={cx + r * Math.cos((deg * Math.PI) / 180)}
        y2={cy + r * Math.sin((deg * Math.PI) / 180)}
      />
    ))}
  </g>
);

/** Hoeveel en hoe fel de sterretjes rond een toverstaf fonkelen: meer en groter naarmate de staf zeldzamer is. */
const SPARKLE_COUNT: Record<Rarity, number> = { gewoon: 2, zeldzaam: 3, episch: 5, legendarisch: 8 };
const SPARKLE_COLORS: Record<Rarity, string[]> = {
  gewoon: ['#fde047'],
  zeldzaam: ['#fde047', '#e0f2fe'],
  episch: ['#fde047', '#e9d5ff', '#fbcfe8'],
  legendarisch: ['#fde047', '#e9d5ff', '#fbcfe8', '#bae6fd', '#bbf7d0'],
};

/** Fonkelende sterretjes rond de punt van een toverstaf, getekend vanaf de hand (0,0). */
export function wandSparkles(rarity: Rarity): ReactElement {
  const n = SPARKLE_COUNT[rarity];
  const colors = SPARKLE_COLORS[rarity];
  return (
    <g className={`wand-sparkles rarity-${rarity}`}>
      {rarity === 'legendarisch' && <circle cx="11" cy="-54" r="28" fill="#fff7cc" opacity="0.16" />}
      {Array.from({ length: n }, (_, i) => {
        const a = (Math.PI * 2 * i) / n + 0.5;
        const dist = 18 + (i % 3) * 6;
        const x = 11 + dist * Math.cos(a);
        const y = -54 + dist * Math.sin(a) * 0.85;
        const r = 2.6 + (i % 2) * 1.3 + (rarity === 'legendarisch' ? 1.2 : 0);
        return (
          <polygon
            key={i}
            className="wand-sparkle"
            points={star(x, y, r)}
            fill={colors[i % colors.length]}
            style={{ animationDelay: `${(i * 0.28).toFixed(2)}s` }}
          />
        );
      })}
    </g>
  );
}

export const BACKGROUNDS: Record<string, ReactElement> = {
  bloemenweide: (
    <g>
      <rect x="0" y="-30" width="200" height="290" rx="28" fill="#dbeafe" />
      <ellipse cx="55" cy="10" rx="30" ry="10" fill="#fff" opacity="0.9" />
      <ellipse cx="150" cy="40" rx="24" ry="8" fill="#fff" opacity="0.8" />
      <rect x="0" y="205" width="200" height="55" fill="#86efac" />
      {[
        [20, 215, '#f472b6'],
        [55, 228, '#fde047'],
        [150, 220, '#ffffff'],
        [180, 232, '#c084fc'],
        [120, 238, '#fb923c'],
      ].map(([x, y, c]) => (
        <g key={String(x)} transform={`translate(${x} ${y})`}>
          <line x1="0" y1="0" x2="0" y2="16" stroke="#16a34a" strokeWidth="2" />
          {[0, 72, 144, 216, 288].map((r) => (
            <circle key={r} cx={5 * Math.cos((r * Math.PI) / 180)} cy={5 * Math.sin((r * Math.PI) / 180)} r="3.6" fill={c as string} />
          ))}
          <circle r="2.6" fill="#f59e0b" />
        </g>
      ))}
    </g>
  ),
  melkweg: (
    <g>
      <rect x="0" y="-30" width="200" height="290" rx="28" fill="#0f0a2e" />
      <ellipse cx="100" cy="90" rx="130" ry="34" fill="#7c3aed" opacity="0.45" transform="rotate(-25 100 90)" />
      <ellipse cx="100" cy="90" rx="96" ry="18" fill="#ec4899" opacity="0.4" transform="rotate(-25 100 90)" />
      <ellipse cx="100" cy="90" rx="64" ry="8" fill="#fde68a" opacity="0.5" transform="rotate(-25 100 90)" />
      {[
        [20, -12], [60, 8], [150, -14], [176, 30], [30, 60], [170, 100], [14, 130], [184, 150], [40, 190], [160, 200], [100, -18], [120, 20],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.2 : 1.4} fill="#fff" opacity="0.9" />
      ))}
      <polygon points={star(150, 60, 6)} fill="#fde68a" />
      <polygon points={star(36, 100, 5)} fill="#bae6fd" />
    </g>
  ),
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
  winterbos: (
    <g>
      <rect x="0" y="-30" width="200" height="290" rx="28" fill="#e0f2fe" />
      <rect x="0" y="215" width="200" height="45" fill="#f0f9ff" />
      {[
        [30, 210, 1],
        [170, 215, 0.85],
        [155, 175, 0.6],
        [45, 170, 0.75],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x="-4" y="-6" width="8" height="16" fill="#78350f" />
          <path d="M-22 -6 L0 -46 L22 -6Z" fill="#166534" />
          <path d="M-17 -22 L0 -52 L17 -22Z" fill="#15803d" />
          <path d="M-12 -36 L0 -58 L12 -36Z" fill="#16a34a" />
        </g>
      ))}
      {[
        [20, 10],
        [180, 30],
        [60, -10],
        [140, 5],
        [100, 40],
      ].map(([x, y]) => snowflake(x, y, 5, '#fff'))}
    </g>
  ),
  onderwaterwereld: (
    <g>
      <defs>
        <linearGradient id="bg-zee" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      <rect x="0" y="-30" width="200" height="290" rx="28" fill="url(#bg-zee)" />
      <rect x="0" y="220" width="200" height="40" fill="#fde68a" />
      {[
        [30, 220, '#fb7185'],
        [80, 224, '#f472b6'],
        [140, 218, '#fb923c'],
        [170, 226, '#fbbf24'],
      ].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 1, 2].map((n) => (
            <path key={n} d={`M${n * 8 - 8} 0 Q${n * 8 - 8} -22 ${n * 8} -14 Q${n * 8 + 8} -22 ${n * 8 + 8} 0Z`} fill={c as string} />
          ))}
        </g>
      ))}
      {[
        [24, 30],
        [170, 60],
        [50, 100],
        [150, 130],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#fff" opacity="0.6" />
      ))}
    </g>
  ),
  wolkenrijk: (
    <g>
      <defs>
        <linearGradient id="bg-wolken" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#bae6fd" />
        </linearGradient>
      </defs>
      <rect x="0" y="-30" width="200" height="290" rx="28" fill="url(#bg-wolken)" />
      {[
        [40, 200, 1],
        [150, 220, 0.8],
        [90, 170, 0.6],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <ellipse cx="0" cy="0" rx="34" ry="16" fill="#fff" />
          <ellipse cx="-18" cy="-8" rx="18" ry="14" fill="#fff" />
          <ellipse cx="18" cy="-8" rx="18" ry="14" fill="#fff" />
        </g>
      ))}
      <polygon
        points="100,60 110,84 136,84 114,98 122,122 100,108 78,122 86,98 64,84 90,84"
        fill="#fde047"
        opacity="0.9"
      />
    </g>
  ),
};

export const PETS: Record<string, ReactElement> = {
  konijntje: (
    <g transform="translate(34 218)">
      <ellipse cx="2" cy="18" rx="18" ry="14" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
      <ellipse cx="-8" cy="-24" rx="5" ry="15" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
      <ellipse cx="8" cy="-24" rx="5" ry="15" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
      <ellipse cx="-8" cy="-24" rx="2.5" ry="10" fill="#fbcfe8" />
      <ellipse cx="8" cy="-24" rx="2.5" ry="10" fill="#fbcfe8" />
      <circle cx="0" cy="0" r="17" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
      <circle cx="-6" cy="-2" r="2.8" fill="#1f2937" />
      <circle cx="6" cy="-2" r="2.8" fill="#1f2937" />
      <ellipse cx="0" cy="5" rx="2.5" ry="2" fill="#f472b6" />
      <path d="M0 7 v3 M0 10 q-4 3 -6 1 M0 10 q4 3 6 1" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
      <circle cx="19" cy="24" r="5" fill="#fff" stroke="#e5e7eb" strokeWidth="1" />
    </g>
  ),
  eendje: (
    <g transform="translate(34 220)">
      <ellipse cx="2" cy="16" rx="20" ry="14" fill="#fde047" stroke="#eab308" strokeWidth="1.5" />
      <path d="M6 14 q8 -6 14 2" stroke="#eab308" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="-4" cy="-4" r="15" fill="#fde047" stroke="#eab308" strokeWidth="1.5" />
      <ellipse cx="-16" cy="0" rx="8" ry="4.5" fill="#fb923c" />
      <circle cx="-5" cy="-7" r="2.6" fill="#1f2937" />
      <circle cx="-6" cy="-8" r="0.9" fill="#fff" />
      <path d="M-2 -19 q3 -7 7 -1" stroke="#eab308" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  feniks: (
    <g transform="translate(36 214)">
      <path d="M14 22 Q40 30 42 6 Q34 16 26 14 Q38 2 34 -10 Q26 4 16 8Z" fill="#f97316" />
      <path d="M18 24 Q34 40 24 44 Q20 36 14 30Z" fill="#dc2626" />
      <ellipse cx="2" cy="16" rx="18" ry="16" fill="#ef4444" />
      <ellipse cx="2" cy="22" rx="10" ry="9" fill="#fbbf24" />
      <path d="M-10 10 Q-30 0 -22 -14 Q-12 -4 -6 4Z" fill="#f97316" />
      <circle cx="-2" cy="-6" r="13" fill="#f97316" />
      <path d="M-10 -16 L-6 -30 L-2 -18 L0 -18 L4 -32 L8 -18Z" fill="#fde047" />
      <path d="M-15 -6 L-24 -3 L-15 0Z" fill="#facc15" />
      <circle cx="-4" cy="-8" r="2.6" fill="#1f2937" />
    </g>
  ),
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
  vosje: (
    <g transform="translate(34 216)">
      <path d="M-16 -6 L-22 -22 L-8 -10Z M16 -6 L22 -22 L8 -10Z" fill="#f97316" />
      <path d="M-16 -6 L-19 -16 L-11 -9Z M16 -6 L19 -16 L11 -9Z" fill="#fde68a" />
      <ellipse cx="0" cy="4" rx="19" ry="16" fill="#f97316" />
      <ellipse cx="0" cy="14" rx="10" ry="8" fill="#fff7ed" />
      <circle cx="-7" cy="-1" r="3" fill="#1f2937" />
      <circle cx="7" cy="-1" r="3" fill="#1f2937" />
      <polygon points="-3,7 3,7 0,12" fill="#1f2937" />
      <path d="M16 10 Q34 8 30 -8 Q28 4 16 10Z" fill="#f97316" />
      <ellipse cx="27" cy="0" rx="5" ry="9" fill="#fff7ed" transform="rotate(30 27 0)" />
    </g>
  ),
  zeepaardje: (
    <g transform="translate(34 214)">
      <path
        d="M0 -20 C14 -20 16 -6 8 2 C18 4 18 18 6 22 C10 26 4 30 -2 26 C-10 20 -8 8 -2 6 C-10 2 -12 -12 0 -20Z"
        fill="#fb923c"
        stroke="#c2410c"
        strokeWidth="2"
      />
      <path d="M4 -14 L14 -14 L8 -8Z" fill="#fdba74" />
      <circle cx="4" cy="-14" r="2.6" fill="#1f2937" />
      {[-4, 2, 8].map((y) => (
        <path key={y} d={`M-6 ${y} Q-12 ${y + 2} -6 ${y + 5}`} stroke="#c2410c" strokeWidth="1.5" fill="none" />
      ))}
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
  bladvleugels: (
    <g stroke="#166534" strokeWidth="2">
      <path d="M96 128 C50 70 14 110 30 150 C60 160 90 150 96 140Z" fill="#4ade80" />
      <path d="M104 128 C150 70 186 110 170 150 C140 160 110 150 104 140Z" fill="#4ade80" />
      <path d="M96 150 C60 160 44 190 66 196 C86 198 96 175 96 158Z" fill="#86efac" />
      <path d="M104 150 C140 160 156 190 134 196 C114 198 104 175 104 158Z" fill="#86efac" />
      <path d="M96 138 C70 122 50 118 34 122 M104 138 C130 122 150 118 166 122 M96 158 C80 170 70 180 68 190 M104 158 C120 170 130 180 132 190" fill="none" strokeWidth="1.5" />
    </g>
  ),
  feniksvleugels: (
    <g>
      {[false, true].map((mirror) => (
        <g key={String(mirror)} transform={mirror ? 'translate(200 0) scale(-1 1)' : undefined}>
          <path d="M96 128 C20 38 -6 108 12 162 C24 194 72 178 96 150Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" strokeLinejoin="round" />
          <path d="M96 132 C34 60 14 112 28 156 C38 180 74 168 96 148Z" fill="#f97316" />
          <path d="M96 138 C56 90 40 122 50 150 C58 166 80 160 96 148Z" fill="#facc15" />
          <path d="M14 150 L4 176 L22 166 L20 190 L36 172 L42 194 L54 170" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  ),
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
  libellevleugels: (
    <g fill="#bae6fd" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.85">
      <ellipse cx="52" cy="105" rx="40" ry="16" transform="rotate(-18 52 105)" />
      <ellipse cx="58" cy="140" rx="34" ry="13" transform="rotate(-10 58 140)" />
      <ellipse cx="148" cy="105" rx="40" ry="16" transform="rotate(18 148 105)" />
      <ellipse cx="142" cy="140" rx="34" ry="13" transform="rotate(10 142 140)" />
      <g stroke="#0369a1" strokeWidth="1" opacity="0.6">
        <line x1="20" y1="105" x2="84" y2="105" />
        <line x1="180" y1="105" x2="116" y2="105" />
      </g>
    </g>
  ),
  nachtvlindervleugels: (
    <g stroke="#1e1b4b" strokeWidth="2">
      <path d="M96 128 C30 70 4 118 20 158 C36 190 78 168 96 144Z" fill="#4c1d95" />
      <path d="M96 144 C56 158 30 206 62 214 C84 218 96 184 96 158Z" fill="#6d28d9" />
      <path d="M104 128 C170 70 196 118 180 158 C164 190 122 168 104 144Z" fill="#4c1d95" />
      <path d="M104 144 C144 158 170 206 138 214 C116 218 104 184 104 158Z" fill="#6d28d9" />
      <circle cx="46" cy="128" r="10" fill="#fde68a" stroke="#d97706" />
      <circle cx="154" cy="128" r="10" fill="#fde68a" stroke="#d97706" />
      <circle cx="46" cy="128" r="4" fill="#1e1b4b" />
      <circle cx="154" cy="128" r="4" fill="#1e1b4b" />
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
  'gestreepte-sjaal': (
    <g>
      <rect x="76" y="110" width="48" height="14" rx="7" fill="#fff" stroke="#e11d48" strokeWidth="1.5" />
      {[84, 96, 108, 119].map((x) => (
        <rect key={x} x={x - 3} y="111" width="5" height="12" fill="#f43f5e" />
      ))}
      <g transform="rotate(-8 112 116)">
        <rect x="106" y="116" width="12" height="36" rx="5" fill="#fff" stroke="#e11d48" strokeWidth="1.5" />
        {[122, 130, 138, 146].map((y) => (
          <rect key={y} x="106.8" y={y} width="10.4" height="4" fill="#f43f5e" />
        ))}
      </g>
    </g>
  ),
  pauwenkraag: (
    <g>
      {[-52, -32, -12, 12, 32, 52].map((a) => (
        <g key={a} transform={`translate(100 118) rotate(${a})`}>
          <ellipse cx="0" cy="26" rx="8" ry="18" fill="#0d9488" stroke="#0f766e" strokeWidth="1.5" />
          <ellipse cx="0" cy="33" rx="5" ry="7" fill="#38bdf8" />
          <circle cx="0" cy="35" r="2.6" fill="#fde047" />
        </g>
      ))}
      <rect x="76" y="108" width="48" height="12" rx="6" fill="#0f766e" stroke="#115e59" strokeWidth="1.5" />
    </g>
  ),
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
  zonnebloemketting: (
    <g>
      <path d="M78 112 Q100 128 122 112" stroke="#16a34a" strokeWidth="3" fill="none" />
      <g transform="translate(100 132)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
          <ellipse key={r} rx="6" ry="3.4" fill="#fde047" transform={`rotate(${r})`} />
        ))}
        <circle r="5.5" fill="#b45309" />
      </g>
    </g>
  ),
  wintersjaal: (
    <g>
      <rect x="74" y="108" width="52" height="18" rx="9" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2" />
      {[80, 92, 104, 116].map((x) => (
        <circle key={x} cx={x} cy="126" r="3" fill="#fff" />
      ))}
      <rect
        x="104"
        y="118"
        width="14"
        height="38"
        rx="6"
        fill="#bae6fd"
        stroke="#7dd3fc"
        strokeWidth="2"
        transform="rotate(-6 111 118)"
      />
      <circle cx="111" cy="156" r="6" fill="#fff" />
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
  strohoedje: (
    <g>
      <ellipse cx="100" cy="46" rx="56" ry="11" fill="#fcd34d" stroke="#d97706" strokeWidth="2" />
      <path d="M74 44 Q76 14 100 14 Q124 14 126 44Z" fill="#fde68a" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
      <rect x="74" y="32" width="52" height="8" fill="#ec4899" />
      <path d="M118 36 L132 26 L130 42Z" fill="#f472b6" stroke="#db2777" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  ),
  pompommuts: (
    <g>
      <path d="M64 50 Q64 12 100 12 Q136 12 136 50Z" fill="#60a5fa" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
      <rect x="62" y="42" width="76" height="13" rx="6" fill="#93c5fd" stroke="#2563eb" strokeWidth="2" />
      <path d="M76 42 V55 M88 42 V55 M100 42 V55 M112 42 V55 M124 42 V55" stroke="#2563eb" strokeWidth="1.5" />
      <circle cx="100" cy="9" r="10" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
    </g>
  ),
  regenboogkroon: (
    <g>
      <path d="M68 48 L64 14 L84 32 L100 4 L116 32 L136 14 L132 48Z" fill="#fde047" stroke="#d97706" strokeWidth="2.5" strokeLinejoin="round" />
      {['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc'].map((c, i) => (
        <circle key={c} cx={76 + i * 9.6} cy="40" r="4" fill={c} stroke="#fff" strokeWidth="1" />
      ))}
      <circle cx="64" cy="14" r="5" fill="#f472b6" stroke="#fff" strokeWidth="1" />
      <circle cx="100" cy="4" r="6" fill="#60a5fa" stroke="#fff" strokeWidth="1" />
      <circle cx="136" cy="14" r="5" fill="#4ade80" stroke="#fff" strokeWidth="1" />
    </g>
  ),
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
  paddenstoelhoedje: (
    <g transform="translate(100 30)">
      <path d="M-34 10 Q0 -34 34 10 Q0 22 -34 10Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="-14" cy="-2" r="5" fill="#fff" />
      <circle cx="10" cy="-10" r="6" fill="#fff" />
      <circle cx="20" cy="2" r="4" fill="#fff" />
      <rect x="-10" y="8" width="20" height="10" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
    </g>
  ),
  vlindertooi: (
    <g>
      <path d="M62 58 Q100 26 138 58" stroke="#7c3aed" strokeWidth="4" fill="none" />
      <g transform="translate(84 34) rotate(-15)">
        <path d="M0 0 C-14 -14 -22 -4 -14 6 C-8 12 -2 6 0 0Z" fill="#f472b6" stroke="#db2777" strokeWidth="1.5" />
        <path d="M0 0 C-10 10 -16 20 -6 22 C0 22 2 10 0 0Z" fill="#c084fc" stroke="#7c3aed" strokeWidth="1.5" />
      </g>
      <g transform="translate(116 34) rotate(15) scale(-1 1)">
        <path d="M0 0 C-14 -14 -22 -4 -14 6 C-8 12 -2 6 0 0Z" fill="#f472b6" stroke="#db2777" strokeWidth="1.5" />
        <path d="M0 0 C-10 10 -16 20 -6 22 C0 22 2 10 0 0Z" fill="#c084fc" stroke="#7c3aed" strokeWidth="1.5" />
      </g>
      <circle cx="100" cy="30" r="3" fill="#7c3aed" />
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
  sneeuwvlokkroon: (
    <g>
      <path d="M68 48 L66 16 L84 30 L100 4 L116 30 L134 16 L132 48Z" fill="#bfe9ff" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="100" cy="8" r="4" fill="#fff" />
      {snowflake(84, 24, 7, '#fff')}
      {snowflake(116, 24, 7, '#fff')}
      {snowflake(100, 40, 6, '#e0f2fe')}
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
  lolliestaf: (
    <g>
      <line x1="0" y1="8" x2="10" y2="-40" stroke="#f9fafb" strokeWidth="5" strokeLinecap="round" />
      <circle cx="11" cy="-52" r="15" fill="#f472b6" stroke="#be185d" strokeWidth="2" />
      <path d="M11 -52 a3 3 0 0 1 6 0 a6 6 0 0 1 -12 0 a9 9 0 0 1 18 0 a12 12 0 0 1 -24 0" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),
  galaxystaf: (
    <g>
      <line x1="0" y1="8" x2="10" y2="-42" stroke="#312e81" strokeWidth="5" strokeLinecap="round" />
      <circle cx="11" cy="-56" r="22" fill="#a78bfa" opacity="0.18" />
      <circle cx="11" cy="-56" r="17" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="2.5" />
      <path d="M2 -52 a10 10 0 0 1 18 -6 a6 6 0 0 1 -10 4" stroke="#e879f9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="4" cy="-63" r="1.6" fill="#fff" />
      <circle cx="18" cy="-50" r="1.4" fill="#fde68a" />
      <circle cx="17" cy="-65" r="1.2" fill="#bae6fd" />
    </g>
  ),
  sterrenstaf: (
    <g>
      <line x1="0" y1="8" x2="10" y2="-44" stroke="#a16207" strokeWidth="5" strokeLinecap="round" />
      <polygon points={star(11, -52, 15)} fill="#fde047" stroke="#d97706" strokeWidth="2" />
    </g>
  ),
  bloemenstaf: (
    <g>
      <line x1="0" y1="8" x2="10" y2="-40" stroke="#65a30d" strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(11 -48)">
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="0" cy="-8" rx="6" ry="3.5" fill="#f9a8d4" transform={`rotate(${r})`} />
        ))}
        <circle r="4" fill="#fde047" />
      </g>
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
  ijsstaf: (
    <g>
      <line x1="0" y1="8" x2="10" y2="-44" stroke="#bae6fd" strokeWidth="5" strokeLinecap="round" />
      <polygon points="11,-66 20,-48 11,-38 2,-48" fill="#bfe9ff" stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="11,-60 15,-50 11,-44 7,-50" fill="#fff" opacity="0.8" />
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
