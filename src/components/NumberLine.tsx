/** Getallenlijn van 0 tot 10×n met `jumps` sprongen van n. */
export function NumberLine({ n, jumps }: { n: number; jumps: number }) {
  const W = 1000;
  const pad = 30;
  const x = (k: number) => pad + ((W - 2 * pad) * k) / 10;
  return (
    <svg viewBox={`0 0 ${W} 150`} className="numberline" role="img" aria-label={`${jumps} sprongen van ${n}`}>
      <line x1={pad} y1={100} x2={W - pad} y2={100} stroke="#c9bdf5" strokeWidth="6" strokeLinecap="round" />
      {Array.from({ length: 11 }, (_, k) => (
        <g key={k}>
          <line x1={x(k)} y1={88} x2={x(k)} y2={112} stroke="#b3a6ea" strokeWidth={k % 5 === 0 ? 5 : 3} strokeLinecap="round" />
          <text x={x(k)} y={140} textAnchor="middle" fontSize="28" fontWeight={k === jumps ? 900 : 700} fill={k <= jumps ? '#2b2250' : '#b8b0cf'} fontFamily="Nunito, sans-serif">
            {k * n}
          </text>
        </g>
      ))}
      {Array.from({ length: jumps }, (_, k) => (
        <path
          key={k}
          d={`M${x(k)} 95 Q${(x(k) + x(k + 1)) / 2} 20 ${x(k + 1)} 95`}
          fill="none"
          stroke="#f472b6"
          strokeWidth="5"
          strokeLinecap="round"
          className="jump"
        />
      ))}
      {jumps > 0 && <circle cx={x(jumps)} cy={100} r="13" fill="#f472b6" stroke="white" strokeWidth="4" />}
    </svg>
  );
}
