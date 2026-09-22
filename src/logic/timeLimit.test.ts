import { describe, it, expect } from 'vitest';
import { minutesToday, timeUpToday } from './timeLimit';
import { emptySave } from './storage';

const T = '2026-09-21';

describe('timeLimit', () => {
  it('minutesToday reads today’s accumulated time', () => {
    const save = { ...emptySave(), timeByDay: { [T]: 5 * 60_000 } };
    expect(minutesToday(save, T)).toBe(5);
    expect(minutesToday(save, '2026-09-22')).toBe(0);
  });

  it('timeUpToday is false without a limit, true once the limit is reached', () => {
    const save = { ...emptySave(), timeByDay: { [T]: 20 * 60_000 } };
    expect(timeUpToday(save, T)).toBe(false);
    const limited = { ...save, settings: { ...save.settings, dailyLimitMinutes: 30 } };
    expect(timeUpToday(limited, T)).toBe(false);
    const atLimit = { ...save, settings: { ...save.settings, dailyLimitMinutes: 20 } };
    expect(timeUpToday(atLimit, T)).toBe(true);
    const overLimit = { ...save, settings: { ...save.settings, dailyLimitMinutes: 10 } };
    expect(timeUpToday(overLimit, T)).toBe(true);
  });
});
