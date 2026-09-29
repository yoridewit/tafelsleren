import { addDays } from './dates';

export interface FactState {
  box: number; // 0 = nieuw, 1..5
  due: string | null;
  fastDays: string[]; // laatste dagen waarop snel én goed
  seen: number;
  wrong: number;
  /** Dag waarop de som voor het laatst een doos omhoog ging (vanaf box 3 max. één stap per dag). */
  promoted?: string;
}

export const FAST_MS = 5000;
/** Tweecijferige antwoorden kosten meer tijd om te tikken. */
export const FAST_MS_BIG = 7000;

/** Binnen hoeveel milliseconden een goed antwoord op een som met dit product als "snel" telt. */
export function fastLimitMs(product: number): number {
  return product >= 10 ? FAST_MS_BIG : FAST_MS;
}

const INTERVAL_DAYS = [0, 0, 1, 2, 4, 7];

export function newFactState(): FactState {
  return { box: 0, due: null, fastDays: [], seen: 0, wrong: 0 };
}

export interface AnswerOptions {
  /** Grens voor een snel antwoord (standaard FAST_MS). */
  fastMs?: number;
  /** Verkeerd antwoord dat een tikfout lijkt: telt als gezien, maar verandert de box niet. */
  slip?: boolean;
}

export function applyAnswer(
  s: FactState,
  correct: boolean,
  ms: number,
  today: string,
  { fastMs = FAST_MS, slip = false }: AnswerOptions = {},
): FactState {
  if (!correct && slip) return { ...s, seen: s.seen + 1 };
  let box: number;
  let fastDays = s.fastDays;
  let promoted = s.promoted;
  if (!correct) box = Math.max(1, s.box - 1);
  else if (ms <= fastMs) {
    if (!fastDays.includes(today)) fastDays = [...fastDays, today].slice(-5);
    // Box 1 t/m 3 zijn leerstappen die op één dag kunnen; vanaf box 3 maximaal één stap per dag.
    if (promoted === today && s.box >= 3) box = s.box;
    else {
      box = Math.min(5, Math.max(1, s.box) + 1);
      promoted = today;
    }
  } else box = Math.max(1, s.box);
  return {
    box,
    due: addDays(today, INTERVAL_DAYS[box]),
    fastDays,
    seen: s.seen + 1,
    wrong: s.wrong + (correct ? 0 : 1),
    ...(promoted ? { promoted } : {}),
  };
}

export function isKnown(s: FactState | undefined): boolean {
  return !!s && s.box >= 4 && new Set(s.fastDays).size >= 2;
}

export type FactStatus = 'nieuw' | 'oefenen' | 'bijna' | 'gekend';

export function factStatus(s: FactState | undefined): FactStatus {
  if (!s || s.box === 0) return 'nieuw';
  if (isKnown(s)) return 'gekend';
  if (s.box >= 3) return 'bijna';
  return 'oefenen';
}

export function isDue(s: FactState | undefined, today: string): boolean {
  return !!s && s.box > 0 && s.due !== null && s.due <= today;
}
