import { ISLANDS, factsForIsland, introOrderForIsland, orientFact, type FactKey } from './facts';
import { factStatus, isDue, isKnown, type FactState } from './leitner';

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
  limits?: IslandLimits;
}

/**
 * Hoeveel sommen er tegelijk "in aanleren" (box 1-2) mogen staan voordat een eiland
 * even geen nieuwe sommen meer introduceert. Tafel 1&10 en tafel 2 hebben ruimere eilanden
 * (meer sommen resp. makkelijker sommen), dus die krijgen een hogere grens.
 */
const DEFAULT_LEARNING_CAP = 6;
const LEARNING_CAP: Partial<Record<number, number>> = { 0: 9, 1: 9 };

/** Hoeveel nieuwe sommen er per ronde en per dag bij mogen komen (perDay null = geen daglimiet). */
export interface IslandLimits {
  perRound: number;
  perDay: number | null;
}

/** Eiland 0 en 1 zijn makkelijk (3 per ronde); vanaf de tafel van 5 zijn nieuwe sommen lastiger: 1 per ronde, 2 per dag. */
export function defaultLimits(island: number): IslandLimits {
  return island >= 2 ? { perRound: 1, perDay: 2 } : { perRound: 3, perDay: null };
}

export function learningCapForIsland(island: number): number {
  return LEARNING_CAP[island] ?? DEFAULT_LEARNING_CAP;
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
export function buildRound({ island, facts, unlocked, today, rng = Math.random, size = 10, limits = defaultLimits(island) }: RoundOptions): Question[] {
  const tables = ISLANDS[island].tables;
  const islandFacts = factsForIsland(island);
  const learning = islandFacts.filter((k) => facts[k] && facts[k].box >= 1 && facts[k].box <= 2).length;
  const practicedAny = Object.values(facts).some((s) => s.box > 0);
  const cap = learningCapForIsland(island);
  // De allereerste ronde (nog niets geoefend) mag er 4 hebben; daarna geldt de limiet per ronde.
  const perRound = practicedAny ? limits.perRound : Math.max(limits.perRound, 4);
  let maxNew = Math.min(learning >= cap ? 0 : learning >= cap - 2 ? 1 : perRound, perRound);
  if (limits.perDay !== null) {
    const introducedToday = Object.values(facts).filter((s) => s.introduced === today).length;
    maxNew = Math.min(maxNew, Math.max(0, limits.perDay - introducedToday));
  }
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
  // Opvulling: eerst sommen die nog niet gekend zijn en vandaag nog niet stegen, dan die al gestegen zijn, en
  // gekende sommen pas als laatste. Extra herhaling van een som die vandaag toch niet verder kan, levert niets op.
  const priority = (k: FactKey) => (isKnown(facts[k]) ? 2 : facts[k].promoted === today ? 1 : 0);
  const fillerPool = [...islandFacts.filter(practiced), ...otherFacts.filter(practiced)];
  const filler = [0, 1, 2].flatMap((p) => [
    ...shuffle(fillerPool.filter((k) => islandFacts.includes(k) && priority(k) === p), rng),
    ...shuffle(fillerPool.filter((k) => !islandFacts.includes(k) && priority(k) === p), rng),
  ]);
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
