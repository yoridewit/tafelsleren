import { describe, it, expect } from 'vitest';
import { decide, isPristine } from './decide';
import { emptySave, type SaveData } from '../logic/storage';
import { newFactState } from '../logic/leitner';

const older = '2026-09-01T10:00:00.000Z';
const newer = '2026-09-10T10:00:00.000Z';
const lineageA = '2026-08-01T10:00:00.000Z';
const lineageB = '2026-09-05T10:00:00.000Z';
const played = (updatedAt: string, createdAt = lineageA, roundsDone = 1): SaveData => ({
  ...emptySave('Pip'),
  roundsDone,
  stars: 5,
  createdAt,
  updatedAt,
});
const pristine = (updatedAt: string, createdAt = lineageA): SaveData => ({ ...emptySave('Pip'), createdAt, updatedAt });
const withSeen = (save: SaveData, seen: number): SaveData => ({
  ...save,
  facts: { '2-3': { ...newFactState(), seen } },
});

describe('isPristine', () => {
  it('is waar voor een net aangemaakt profiel', () => {
    expect(isPristine(emptySave('Pip'))).toBe(true);
  });

  it('is onwaar zodra er sterren, rondes, aankopen of geziene sommen zijn', () => {
    expect(isPristine({ ...emptySave('Pip'), stars: 1 })).toBe(false);
    expect(isPristine({ ...emptySave('Pip'), roundsDone: 1 })).toBe(false);
    expect(isPristine({ ...emptySave('Pip'), owned: ['strik'] })).toBe(false);
    expect(isPristine({ ...emptySave('Pip'), facts: { '2-3': { ...newFactState(), seen: 1 } } })).toBe(false);
  });
});

describe('decide', () => {
  it('doet niets als beide kanten ontbreken', () => {
    expect(decide(null, null)).toBe('none');
  });

  it('pusht als remote ontbreekt', () => {
    expect(decide(played(newer), null)).toBe('push');
    expect(decide(pristine(newer), null)).toBe('push');
  });

  it('herstelt als local ontbreekt', () => {
    expect(decide(null, played(older))).toBe('restore');
  });

  it('herstelt als local leeg is en remote voortgang heeft, ook als local nieuwer is', () => {
    expect(decide(pristine(newer), played(older))).toBe('restore');
  });

  it('pusht als remote leeg is en local voortgang heeft, ook als remote nieuwer is', () => {
    expect(decide(played(older), pristine(newer))).toBe('push');
  });

  it('doet niets als beide leeg zijn', () => {
    expect(decide(pristine(older), pristine(newer))).toBe('none');
  });

  it('laat de nieuwste winnen als beide voortgang hebben', () => {
    expect(decide(played(older), played(newer))).toBe('restore');
    expect(decide(played(newer), played(older))).toBe('push');
  });

  it('doet niets bij gelijke tijdstempels', () => {
    expect(decide(played(newer), played(newer))).toBe('none');
  });

  describe('verschillende createdAt (opnieuw aangemaakt profiel)', () => {
    it('laat de save met de meeste voortgang winnen, ook als local nieuwer is', () => {
      const local = played(newer, lineageB, 1);
      const remote = played(older, lineageA, 40);
      expect(decide(local, remote)).toBe('restore');
    });

    it('pusht als local meer voortgang heeft, ook als local ouder is', () => {
      const local = played(older, lineageB, 40);
      const remote = played(newer, lineageA, 1);
      expect(decide(local, remote)).toBe('push');
    });

    it('vergelijkt bij gelijke rondes het totaal aantal geziene sommen', () => {
      const local = withSeen(played(newer, lineageB, 3), 5);
      const remote = withSeen(played(older, lineageA, 3), 50);
      expect(decide(local, remote)).toBe('restore');
      expect(decide(withSeen(played(older, lineageB, 3), 50), withSeen(played(newer, lineageA, 3), 5))).toBe('push');
    });

    it('laat bij gelijke voortgang de nieuwste winnen', () => {
      expect(decide(played(older, lineageB), played(newer, lineageA))).toBe('restore');
      expect(decide(played(newer, lineageB), played(older, lineageA))).toBe('push');
    });

    it('doet niets bij gelijke voortgang en gelijke tijdstempels', () => {
      expect(decide(played(newer, lineageB), played(newer, lineageA))).toBe('none');
    });
  });

  it('gebruikt bij dezelfde createdAt de nieuwste updatedAt, ook als die minder voortgang heeft', () => {
    expect(decide(played(newer, lineageA, 1), played(older, lineageA, 40))).toBe('push');
    expect(decide(played(older, lineageA, 40), played(newer, lineageA, 1))).toBe('restore');
  });
});
