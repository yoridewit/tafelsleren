import { describe, it, expect } from 'vitest';
import { PHRASES, factId, hintId, phraseText, questionId, sharedText, spoken, stickerId } from './phrases';
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

  it('greets Floor by name', () => {
    expect(phraseText('home-0')).toBe('Hoi Floor! Zullen we samen oefenen?');
    expect(phraseText('welkom-1')).toMatch(/^Hoi Floor!/);
    expect(Object.keys(PHRASES).some((id) => id.endsWith('.n'))).toBe(false);
  });

  it('shared-facts text handles one new fact', () => {
    expect(sharedText(9, 10)).toContain('Er is er maar één echt nieuw.');
    expect(sharedText(3, 10)).toContain('Er zijn er maar 7 echt nieuw.');
  });
});
