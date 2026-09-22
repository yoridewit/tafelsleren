import { useId } from 'react';
import { itemById, type ItemSlot } from '../data/shop';
import { BACKGROUNDS, BACK_ITEMS, HATS, NECK, PETS, WANDS, WINGS, wandSparkles } from './ElfItems';

export type ElfMood = 'blij' | 'juichen' | 'denken';

interface Props {
  wearing?: Partial<Record<ItemSlot, string>>;
  mood?: ElfMood;
  size?: number | string;
  className?: string;
}

const SKIN = '#ffe4d1';
const SKIN_EDGE = '#f5c4a6';

export function Elf({ wearing = {}, mood = 'blij', size = 220, className = '' }: Props) {
  // Unieke verlooprand-id's per elfje: er staan soms meerdere elfjes tegelijk op het scherm (bijv. de winkel).
  const uid = useId();
  const skinGrad = `elf-skin-${uid}`;
  const dressGrad = `elf-dress-${uid}`;
  const hairGrad = `elf-hair-${uid}`;
  const cheer = mood === 'juichen';
  const hand = cheer ? { l: [36, 70], r: [164, 70] } : { l: [62, 168], r: [142, 164] };
  const cape = wearing.sjaal === 'cape';
  const arms = (
    <>
      <g stroke={SKIN_EDGE} strokeWidth="9" strokeLinecap="round" fill="none">
        <path d={`M86 128 Q${cheer ? '62 118' : '70 150'} ${hand.l[0]} ${hand.l[1]}`} />
        <path d={`M114 128 Q${cheer ? '138 118' : '130 148'} ${hand.r[0]} ${hand.r[1]}`} />
      </g>
      <circle cx={hand.l[0]} cy={hand.l[1]} r="7" fill={SKIN} stroke={SKIN_EDGE} strokeWidth="2" />
    </>
  );
  return (
    <svg
      viewBox="0 -30 200 290"
      width={size}
      className={`elf ${cheer ? 'elf-cheer' : ''} ${className}`}
      role="img"
      aria-label="elfje"
    >
      <defs>
        <radialGradient id={skinGrad} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#fff5ec" />
          <stop offset="100%" stopColor={SKIN} />
        </radialGradient>
        <linearGradient id={dressGrad} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id={hairGrad} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      {wearing.achtergrond && BACKGROUNDS[wearing.achtergrond]}
      <g className="elf-body">
        <g className="elf-wings">{WINGS[wearing.vleugels ?? 'default'] ?? WINGS.default}</g>
        {cape && BACK_ITEMS.cape}

        {/* benen */}
        <g stroke={SKIN_EDGE} strokeWidth="9" strokeLinecap="round">
          <line x1="90" y1="200" x2="88" y2="232" />
          <line x1="110" y1="200" x2="112" y2="232" />
        </g>
        <ellipse cx="84" cy="236" rx="12" ry="7" fill="#ec4899" />
        <ellipse cx="116" cy="236" rx="12" ry="7" fill="#ec4899" />

        {!cheer && arms}

        {/* jurkje */}
        <path
          d="M86 118 L114 118 L122 130 L146 204 Q134 214 122 206 Q111 216 100 206 Q89 216 78 206 Q66 214 54 204 L78 130Z"
          fill={`url(#${dressGrad})`}
          stroke="#059669"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M88 150 Q100 158 112 150" stroke="#a7f3d0" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="100" cy="176" r="4" fill="#fef08a" />
        <circle cx="86" cy="188" r="3" fill="#fef08a" />
        <circle cx="114" cy="188" r="3" fill="#fef08a" />

        {/* oren */}
        <path d="M64 80 L34 58 L66 66Z" fill={`url(#${skinGrad})`} stroke={SKIN_EDGE} strokeWidth="2" strokeLinejoin="round" />
        <path d="M136 80 L166 58 L134 66Z" fill={`url(#${skinGrad})`} stroke={SKIN_EDGE} strokeWidth="2" strokeLinejoin="round" />

        {/* haar achter */}
        <path d="M58 76 C52 120 70 128 76 112 L124 112 C130 128 148 120 142 76Z" fill="#c026d3" />

        {/* hoofd */}
        <circle cx="100" cy="78" r="40" fill={`url(#${skinGrad})`} stroke={SKIN_EDGE} strokeWidth="2" />

        {/* haar voor */}
        <path
          d="M60 74 C58 30 142 30 140 74 C128 58 116 52 104 56 C96 48 76 54 60 74Z"
          fill={`url(#${hairGrad})`}
        />
        <path d="M66 62 Q80 50 92 52" stroke="#f0abfc" strokeWidth="4" fill="none" strokeLinecap="round" />
        {!wearing.hoed && (
          <g transform="translate(130 50)">
            {[0, 72, 144, 216, 288].map((r) => (
              <circle key={r} cx={6 * Math.cos((r * Math.PI) / 180)} cy={6 * Math.sin((r * Math.PI) / 180)} r="5" fill="#fde047" />
            ))}
            <circle r="4" fill="#fb923c" />
          </g>
        )}

        {/* gezicht */}
        {mood === 'juichen' ? (
          <g stroke="#3b2a4d" strokeWidth="4" fill="none" strokeLinecap="round">
            <path d="M80 82 Q86 74 92 82" />
            <path d="M108 82 Q114 74 120 82" />
          </g>
        ) : (
          <g className="elf-eyes">
            <ellipse cx="86" cy="82" rx="6.5" ry="8" fill="#3b2a4d" />
            <ellipse cx="114" cy="82" rx="6.5" ry="8" fill="#3b2a4d" />
            <circle cx="88.5" cy="78.5" r="2.6" fill="#fff" />
            <circle cx="116.5" cy="78.5" r="2.6" fill="#fff" />
          </g>
        )}
        <circle cx="76" cy="96" r="7" fill="#fda4af" opacity="0.7" />
        <circle cx="124" cy="96" r="7" fill="#fda4af" opacity="0.7" />
        {mood === 'juichen' ? (
          <path d="M88 98 Q100 116 112 98Z" fill="#be123c" stroke="#3b2a4d" strokeWidth="3" strokeLinejoin="round" />
        ) : mood === 'denken' ? (
          <path d="M92 102 Q100 100 108 104" stroke="#3b2a4d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M88 99 Q100 111 112 99" stroke="#3b2a4d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        )}

        {cheer && arms}
        {wearing.sjaal && NECK[wearing.sjaal]}
        {wearing.hoed && HATS[wearing.hoed]}

        {/* rechterhand met staf */}
        <g transform={`translate(${hand.r[0]} ${hand.r[1]})`}>
          {wearing.staf && WANDS[wearing.staf]}
          {wearing.staf && itemById(wearing.staf) && wandSparkles(itemById(wearing.staf)!.rarity)}
          <circle r="7" fill={SKIN} stroke={SKIN_EDGE} strokeWidth="2" />
        </g>
      </g>
      {wearing.huisdier && (
        <g transform="translate(36 236) scale(1.35) translate(-36 -236)">
          <g className="elf-pet">{PETS[wearing.huisdier]}</g>
        </g>
      )}
    </svg>
  );
}
