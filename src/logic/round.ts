import { ISLANDS, factsForIsland, introOrderForIsland, orientFact, type FactKey } from './facts';
import { factStatus, isDue, type FactState } from './leitner';

export interface Question {
  a: number;
  b: number;
  key: FactKey;
  isNew: boolean;
}

export interface RoundOptions {
  island: number;
  facts: Record<FactKey, FactState>;
  unlocked: number[];
  today: string;
  rng?: () => number;
  size?: number;
}

export function shuffle<T>(xs: T[], rng: () => number = Math.random): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Stelt een ronde samen: een paar nieuwe sommen (elk 2×, met ruimte ertussen),
 * aangevuld met sommen die aan de beurt zijn voor herhaling en bekende sommen.
 */
export function buildRound({ island, facts, unlocked, today, rng = Math.random, size = 10 }: RoundOptions): Question[] {
  const tables = ISLANDS[island].tables;
  const islandFacts = factsForIsland(island);
  const learning = islandFacts.filter((k) => facts[k] && facts[k].box >= 1 && facts[k].box <= 2).length;
  const practicedAny = Object.values(facts).some((s) => s.box > 0);
  const maxNew = learning >= 6 ? 0 : learning >= 4 ? 1 : practicedAny ? 3 : 4;
  const newKeys = introOrderForIsland(island)
    .filter((k) => factStatus(facts[k]) === 'nieuw')
    .slice(0, maxNew);

  const byDue = (x: FactKey, y: FactKey) =>
    (facts[x].due ?? '').localeCompare(facts[y].due ?? '') || facts[x].box - facts[y].box;
  const practiced = (k: FactKey) => !!facts[k] && facts[k].box > 0;

  const otherFacts = [...new Set(unlocked.filter((i) => i !== island).flatMap(factsForIsland))].filter(
    (k) => !islandFacts.includes(k),
  );
  const islandDue = islandFacts.filter((k) => isDue(facts[k], today)).sort(byDue);
  const otherDue = otherFacts.filter((k) => isDue(facts[k], today)).sort(byDue).slice(0, 3);
  const filler = [...shuffle(islandFacts.filter(practiced), rng), ...shuffle(otherFacts.filter(practiced), rng)];
  const reviewSlots = Math.max(0, size - 2 * newKeys.length);
  const reviews = shuffle([...new Set([...islandDue, ...otherDue, ...filler])].slice(0, reviewSlots), rng);

  // Weven: nieuwe som, even later nog eens; herhalingen ertussen.
  const out: Question[] = [];
  const firsts = [...newKeys];
  const seconds: { key: FactKey; readyAt: number }[] = [];
  const revQueue = [...reviews];
  const ask = (key: FactKey, isNew: boolean) => {
    const own = islandFacts.includes(key) ? tables : [];
    out.push({ ...orientFact(key, own, rng), key, isNew });
  };
  while (firsts.length || seconds.length || revQueue.length) {
    const pos = out.length;
    const readyIdx = seconds.findIndex((s) => s.readyAt <= pos);
    if (readyIdx >= 0) {
      ask(seconds.splice(readyIdx, 1)[0].key, true);
    } else if (firsts.length && (pos % 2 === 0 || revQueue.length <= firsts.length)) {
      const k = firsts.shift()!;
      ask(k, true);
      seconds.push({ key: k, readyAt: pos + 2 });
    } else if (revQueue.length) {
      ask(revQueue.shift()!, false);
    } else {
      ask(seconds.shift()!.key, true);
    }
  }
  return out;
}
