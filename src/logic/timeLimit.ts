import type { Screen } from '../nav';
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

/** Resterende speeltijd van vandaag in hele minuten (naar boven afgerond); null zonder limiet. */
export function remainingMinutes(save: SaveData, today: string): number | null {
  const limit = save.settings.dailyLimitMinutes;
  if (limit == null) return null;
  return Math.max(0, Math.ceil(limit - minutesToday(save, today)));
}

/** Als de speeltijd voorbij is kan er geen ronde meer starten, ook niet via "Ontdekken": dan naar het eiland. */
export function allowedScreen(screen: Screen, save: SaveData, today: string): Screen {
  return screen.name === 'round' && timeUpToday(save, today) ? { name: 'island', island: screen.island } : screen;
}
