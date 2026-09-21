import { ALL_FACTS, ISLANDS, factsForIsland, type FactKey } from './facts';
import { factStatus, isKnown, type FactState } from './leitner';

export interface IslandProgress {
  total: number;
  known: number;
  almost: number;
  practicing: number;
  fresh: number;
  mastered: boolean;
}

export function islandProgress(island: number, facts: Record<FactKey, FactState>): IslandProgress {
  const keys = factsForIsland(island);
  const p = { total: keys.length, known: 0, almost: 0, practicing: 0, fresh: 0, mastered: false };
  for (const k of keys) {
    const s = factStatus(facts[k]);
    if (s === 'gekend') p.known++;
    else if (s === 'bijna') p.almost++;
    else if (s === 'oefenen') p.practicing++;
    else p.fresh++;
  }
  p.mastered = p.practicing === 0 && p.fresh === 0 && p.known >= Math.ceil(p.total * 0.8);
  return p;
}

/** Eilanden blijven open als ze eenmaal open zijn; het volgende gaat open na beheersing van het vorige. */
export function computeUnlocks(facts: Record<FactKey, FactState>, unlocked: number[]): number[] {
  const out = new Set(unlocked);
  out.add(0);
  for (let i = 1; i < ISLANDS.length; i++)
    if (out.has(i - 1) && islandProgress(i - 1, facts).mastered) out.add(i);
  return [...out].sort((a, b) => a - b);
}

/** Sommen van dit eiland die je (door omdraaien) al bij eerdere eilanden tegenkomt. */
export function sharedWithEarlier(island: number): FactKey[] {
  const earlier = new Set(ISLANDS.slice(0, island).flatMap((_, i) => factsForIsland(i)));
  return factsForIsland(island).filter((k) => earlier.has(k));
}

/** Sommen die bijna of helemaal gekend zijn (voor het snelspel). */
export function strongFacts(facts: Record<FactKey, FactState>): FactKey[] {
  return ALL_FACTS.filter((k) => ['bijna', 'gekend'].includes(factStatus(facts[k])));
}

export function knownCount(facts: Record<FactKey, FactState>): number {
  return ALL_FACTS.filter((k) => isKnown(facts[k])).length;
}
