import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { guardWrite } from './guard';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('guardWrite', () => {
  it('geeft het resultaat door als alles goed gaat', async () => {
    await expect(guardWrite(async () => 42, { online: () => true })).resolves.toBe(42);
  });

  it('gooit meteen en start niets als er geen verbinding is', async () => {
    const run = vi.fn(async () => 1);
    await expect(guardWrite(run, { online: () => false })).rejects.toThrow('Offline');
    expect(run).not.toHaveBeenCalled();
  });

  it('breekt af als de schrijfactie blijft hangen', async () => {
    const pending = guardWrite(() => new Promise<void>(() => {}), { online: () => true, timeoutMs: 15_000 });
    const assertion = expect(pending).rejects.toThrow('Time-out');
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
  });

  it('geeft fouten van de schrijfactie zelf door', async () => {
    const failing = async () => {
      throw new Error('geweigerd');
    };
    await expect(guardWrite(failing, { online: () => true })).rejects.toThrow('geweigerd');
  });
});
