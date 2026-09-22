import type { SaveData } from './storage';

export const TIME_LIMIT_OPTIONS = [10, 20, 30, 40, 50, 60];

export function minutesToday(save: SaveData, today: string): number {
  return (save.timeByDay[today] ?? 0) / 60000;
}

/** Of de door de ouder ingestelde dagelijkse tijdslimiet bereikt is. */
export function timeUpToday(save: SaveData, today: string): boolean {
  const limit = save.settings.dailyLimitMinutes;
  return limit != null && minutesToday(save, today) >= limit;
}
