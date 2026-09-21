import { daysBetween } from './dates';

/** Aantal oefendagen in de huidige reeks. Eén dag overslaan mag, twee niet. */
export function currentStreak(days: string[], today: string): number {
  const sorted = [...new Set(days)].sort().reverse();
  if (!sorted.length || daysBetween(sorted[0], today) > 2) return 0;
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (daysBetween(sorted[i], sorted[i - 1]) > 2) break;
    count++;
  }
  return count;
}
