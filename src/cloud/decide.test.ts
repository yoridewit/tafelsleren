import { describe, it, expect } from 'vitest';
import { decide, isPristine } from './decide';
import { emptySave, type SaveData } from '../logic/storage';
import { newFactState } from '../logic/leitner';

const older = '2026-09-01T10:00:00.000Z';
const newer = '2026-09-10T10:00:00.000Z';
const played = (updatedAt: string): SaveData => ({ ...emptySave('Pip'), roundsDone: 1, stars: 5, updatedAt });
const pristine = (updatedAt: string): SaveData => ({ ...emptySave('Pip'), updatedAt });

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
});
