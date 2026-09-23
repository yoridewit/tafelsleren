import { describe, it, expect } from 'vitest';
import { emptySave, parseSave } from './storage';

describe('updatedAt', () => {
  it('emptySave zet updatedAt gelijk aan createdAt', () => {
    const s = emptySave('Pip');
    expect(s.updatedAt).toBe(s.createdAt);
  });

  it('parseSave houdt een geldige updatedAt', () => {
    const s = parseSave({ version: 1, createdAt: '2026-09-01T10:00:00.000Z', updatedAt: '2026-09-10T10:00:00.000Z' });
    expect(s!.updatedAt).toBe('2026-09-10T10:00:00.000Z');
  });

  it('parseSave valt terug op createdAt als updatedAt ontbreekt of ongeldig is', () => {
    const missing = parseSave({ version: 1, createdAt: '2026-09-01T10:00:00.000Z' });
    expect(missing!.updatedAt).toBe('2026-09-01T10:00:00.000Z');
    const bad = parseSave({ version: 1, createdAt: '2026-09-01T10:00:00.000Z', updatedAt: 'gisteren' });
    expect(bad!.updatedAt).toBe('2026-09-01T10:00:00.000Z');
  });
});
