import { describe, it, expect } from 'vitest';
import { NAMED_IDS, PHRASES, factId, hintId, phraseText, phrasesToRecord, questionId, sharedText, spoken, stickerId } from './phrases';
import { STICKERS } from './stickers';

describe('phrases', () => {
  it('covers every question, fact and hint of the tables 1-10', () => {
    for (let a = 1; a <= 10; a++)
      for (let b = 1; b <= 10; b++) {
        expect(PHRASES[questionId(a, b)]).toBe(`${a} keer ${b}`);
        expect(PHRASES[factId(a, b)]).toBe(`${a} keer ${b} is ${a * b}.`);
        expect(PHRASES[hintId(a, b)]).toMatch(new RegExp(`is ${a * b}\\.$`));
      }
  });

  it('hints contain no symbols a voice would stumble over', () => {
    expect(PHRASES[hintId(6, 7)]).toBe('Rondom de 5. Eerst 5 keer, dan één 7 erbij. 5 keer 7 is 35. 35 plus 7 is 42.');
    for (const text of Object.values(PHRASES)) expect(text).not.toMatch(/[×=+−]/);
    expect(spoken('10 × 4 = 40')).toBe('10 keer 4 is 40');
  });

  it('has a line for every sticker', () => {
    for (const s of STICKERS) expect(PHRASES[stickerId(s.id)]).toContain(s.name);
  });

  it('named lines have a version with and without the name', () => {
    expect(phraseText('home-0', 'Floor')).toBe('Hoi Floor! Zullen we samen oefenen?');
    expect(phraseText('home-0')).toBe('Hoi! Zullen we samen oefenen?');
    const rec = phrasesToRecord('Floor');
    for (const id of NAMED_IDS) expect(rec[`${id}.n`]).toContain('Floor');
    expect(Object.keys(phrasesToRecord(null))).toEqual(Object.keys(PHRASES));
  });

  it('shared-facts text handles one new fact', () => {
    expect(sharedText(9, 10)).toContain('Er is er maar één echt nieuw.');
    expect(sharedText(3, 10)).toContain('Er zijn er maar 7 echt nieuw.');
  });
});
