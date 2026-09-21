import { addDays } from './dates';

export interface FactState {
  box: number; // 0 = nieuw, 1..5
  due: string | null;
  fastDays: string[]; // laatste dagen waarop snel én goed
  seen: number;
  wrong: number;
  /** Dag waarop de som voor het laatst een doos omhoog ging (max. één stap per dag). */
  promoted?: string;
}

export const FAST_MS = 4000;
const INTERVAL_DAYS = [0, 0, 1, 2, 4, 7];

export function newFactState(): FactState {
  return { box: 0, due: null, fastDays: [], seen: 0, wrong: 0 };
}

export function applyAnswer(s: FactState, correct: boolean, ms: number, today: string): FactState {
  let box: number;
  let fastDays = s.fastDays;
  let promoted = s.promoted;
  if (!correct) box = 1;
  else if (ms <= FAST_MS) {
    if (!fastDays.includes(today)) fastDays = [...fastDays, today].slice(-5);
    if (promoted === today) box = Math.max(1, s.box);
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
