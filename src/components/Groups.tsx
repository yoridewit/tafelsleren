const COLORS = ['#f472b6', '#fb923c', '#f5b82e', '#34d399', '#2dd4bf', '#60a5fa', '#818cf8', '#a78bfa', '#f87171', '#84cc16'];

/** a groepjes van b stippen, stippen in rijtjes van 5 zodat je vijftallen ziet. */
export function Groups({ a, b, small = false }: { a: number; b: number; small?: boolean }) {
  return (
    <div className={`groups ${small ? 'groups-small' : ''}`} aria-label={`${a} groepjes van ${b}`}>
      {Array.from({ length: a }, (_, g) => (
        <div className="group" key={g} style={{ borderColor: COLORS[g % COLORS.length], gridTemplateColumns: `repeat(${Math.min(b, 5)}, var(--dot))` }}>
          {Array.from({ length: b }, (_, i) => (
            <span className="dot" key={i} style={{ background: COLORS[g % COLORS.length] }} />
          ))}
        </div>
      ))}
    </div>
  );
}
