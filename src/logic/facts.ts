/** Een feit is een ongeordend paar: 3×7 en 7×3 delen dezelfde sleutel "3-7". */
export type FactKey = string;

export function factKey(a: number, b: number): FactKey {
  return a <= b ? `${a}-${b}` : `${b}-${a}`;
}

export function parseFactKey(k: FactKey): [number, number] {
  const [a, b] = k.split('-').map(Number);
  return [a, b];
}

export const ALL_FACTS: FactKey[] = [];
for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) ALL_FACTS.push(factKey(a, b));

export interface Island {
  tables: number[];
  name: string;
  color: string;
  emoji: string;
}

export const ISLANDS: Island[] = [
  { tables: [1, 10], name: 'Tafel van 1 en 10', color: '#f472b6', emoji: '🌸' },
  { tables: [2], name: 'Tafel van 2', color: '#fb923c', emoji: '🍓' },
  { tables: [5], name: 'Tafel van 5', color: '#facc15', emoji: '🌻' },
  { tables: [3], name: 'Tafel van 3', color: '#4ade80', emoji: '🐸' },
  { tables: [4], name: 'Tafel van 4', color: '#2dd4bf', emoji: '🐢' },
  { tables: [6], name: 'Tafel van 6', color: '#38bdf8', emoji: '🐬' },
  { tables: [7], name: 'Tafel van 7', color: '#818cf8', emoji: '🦋' },
  { tables: [8], name: 'Tafel van 8', color: '#c084fc', emoji: '🦄' },
  { tables: [9], name: 'Tafel van 9', color: '#f87171', emoji: '🐉' },
];

/** Volgorde waarin keersommen binnen een tafel worden aangeleerd: ankers eerst, dan afgeleide sommen. */
export const MULTIPLIER_ORDER = [1, 2, 10, 5, 4, 6, 9, 3, 8, 7];

export function introOrderForIsland(island: number): FactKey[] {
  const out: FactKey[] = [];
  for (const m of MULTIPLIER_ORDER)
    for (const t of ISLANDS[island].tables) {
      const k = factKey(m, t);
      if (!out.includes(k)) out.push(k);
    }
  return out;
}

export function factsForIsland(island: number): FactKey[] {
  return introOrderForIsland(island);
}

/** Kies de volgorde zo dat de tafel het tweede getal is (3 × 7 hoort bij de tafel van 7). */
export function orientFact(k: FactKey, tables: number[], rng: () => number = Math.random): { a: number; b: number } {
  const [x, y] = parseFactKey(k);
  const xIn = tables.includes(x);
  const yIn = tables.includes(y);
  if (yIn && !xIn) return { a: x, b: y };
  if (xIn && !yIn) return { a: y, b: x };
  return rng() < 0.5 ? { a: x, b: y } : { a: y, b: x };
}
