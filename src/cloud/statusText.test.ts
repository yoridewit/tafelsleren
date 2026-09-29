import { describe, expect, it } from 'vitest';
import { statusText } from './statusText';

describe('statusText', () => {
  it('geeft voor elke status een Nederlandse tekst', () => {
    expect(statusText({ kind: 'off' })).toBe('Niet ingesteld');
    expect(statusText({ kind: 'signedOut' })).toBe('Niet ingelogd');
    expect(statusText({ kind: 'syncing' })).toBe('Bezig met opslaan…');
    expect(statusText({ kind: 'offline' })).toBe('Offline, wordt later opgeslagen');
    expect(statusText({ kind: 'error' })).toBe('Opslaan mislukt, wordt opnieuw geprobeerd');
  });

  it('toont bij een fout het detail als dat er is', () => {
    expect(statusText({ kind: 'error', detail: 'unavailable' })).toBe('Opslaan mislukt (unavailable), wordt opnieuw geprobeerd');
  });

  it('toont bij synced het tijdstip', () => {
    expect(statusText({ kind: 'synced', at: '2026-09-23T12:32:00.000Z' })).toMatch(/^Laatst opgeslagen \d{1,2}[:.]\d{2}/);
  });
});
