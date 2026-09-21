const COLORS = ['#f472b6', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc', '#f87171', '#a3e635'];

/** a groepjes van b stippen, stippen in rijtjes van 5 zodat je vijftallen ziet. */
export function Groups({ a, b, small = false }: { a: number; b: number; small?: boolean }) {
  return (
    <div className={`groups ${small ? 'groups-small' : ''}`} aria-label={`${a} groepjes van ${b}`}>
      {Array.from({ length: a }, (_, g) => (
        <div className="group" key={g} style={{ borderColor: COLORS[g % COLORS.length] }}>
          {Array.from({ length: b }, (_, i) => (
            <span className="dot" key={i} style={{ background: COLORS[g % COLORS.length] }} />
          ))}
        </div>
      ))}
    </div>
  );
}
