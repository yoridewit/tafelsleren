import { describe, it, expect } from 'vitest';
import { allowedScreen, minutesToday, remainingMinutes, timeUpToday } from './timeLimit';
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
    const none = { ...save, settings: { ...save.settings, dailyLimitMinutes: null } };
    expect(timeUpToday(none, T)).toBe(false);
    const limited = { ...save, settings: { ...save.settings, dailyLimitMinutes: 30 } };
    expect(timeUpToday(limited, T)).toBe(false);
    const atLimit = { ...save, settings: { ...save.settings, dailyLimitMinutes: 20 } };
    expect(timeUpToday(atLimit, T)).toBe(true);
    const overLimit = { ...save, settings: { ...save.settings, dailyLimitMinutes: 10 } };
    expect(timeUpToday(overLimit, T)).toBe(true);
  });

  describe('allowedScreen', () => {
    const limited = { ...emptySave(), timeByDay: { [T]: 20 * 60_000 }, settings: { ...emptySave().settings, dailyLimitMinutes: 20 } };
    const roomLeft = { ...limited, timeByDay: { [T]: 5 * 60_000 } };

    it('sends a round to the island screen when the time is up, from any path', () => {
      expect(allowedScreen({ name: 'round', island: 3 }, limited, T)).toEqual({ name: 'island', island: 3 });
    });

    it('lets a round start while there is time left or no limit', () => {
      expect(allowedScreen({ name: 'round', island: 3 }, roomLeft, T)).toEqual({ name: 'round', island: 3 });
      expect(allowedScreen({ name: 'round', island: 3 }, { ...emptySave(), settings: { ...emptySave().settings, dailyLimitMinutes: null } }, T)).toEqual({ name: 'round', island: 3 });
    });

    it('never blocks the other screens, also when the time is up', () => {
      for (const screen of [{ name: 'home' }, { name: 'shop' }, { name: 'album' }, { name: 'discover', island: 1 }, { name: 'island', island: 1 }] as const)
        expect(allowedScreen(screen, limited, T)).toEqual(screen);
    });
  });

  describe('remainingMinutes', () => {
    const withLimit = (limit: number | null, usedMin: number) => ({
      ...emptySave(),
      timeByDay: { [T]: usedMin * 60_000 },
      settings: { ...emptySave().settings, dailyLimitMinutes: limit },
    });

    it('is null without a limit', () => {
      expect(remainingMinutes(withLimit(null, 3), T)).toBeNull();
    });

    it('counts down, rounding up to whole minutes', () => {
      expect(remainingMinutes(withLimit(10, 0), T)).toBe(10);
      expect(remainingMinutes(withLimit(10, 2.5), T)).toBe(8);
      expect(remainingMinutes(withLimit(10, 9.9), T)).toBe(1);
    });

    it('never goes below zero', () => {
      expect(remainingMinutes(withLimit(10, 10), T)).toBe(0);
      expect(remainingMinutes(withLimit(10, 25), T)).toBe(0);
    });
  });

  it('a fresh save has a ten minute limit', () => {
    expect(emptySave().settings.dailyLimitMinutes).toBe(10);
  });
});
