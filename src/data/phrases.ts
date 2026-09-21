/**
 * Alle zinnetjes die de app hardop zegt. Ze worden met `npm run audio` één keer ingesproken
 * (ElevenLabs) en als public/audio/<id>.mp3 opgeslagen. Dit bestand heeft bewust geen imports,
 * zodat het generatiescript het direct kan gebruiken.
 */

export const PRAISE = ['Goed zo!', 'Super!', 'Knap hoor!', 'Toppie!', 'Jippie!', 'Wauw!', 'Heel goed!'];

export const questionId = (a: number, b: number) => `q-${a}-${b}`;
export const factId = (a: number, b: number) => `d-${a}-${b}`;
export const praiseId = (i: number) => `p-${i}`;

export const questionText = (a: number, b: number) => `${a} keer ${b}`;
export const factText = (a: number, b: number) => `${a} keer ${b} is ${a * b}.`;

export const PHRASES: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (let a = 1; a <= 10; a++)
    for (let b = 1; b <= 10; b++) {
      out[questionId(a, b)] = questionText(a, b);
      out[factId(a, b)] = factText(a, b);
    }
  PRAISE.forEach((p, i) => (out[praiseId(i)] = p));
  out.bijna = 'Bijna! Kijk maar.';
  out.nieuw = 'Een nieuwe som!';
  out.test = 'Hoi! Zeven keer zes is tweeënveertig. Goed zo!';
  return out;
})();
