/**
 * Alle zinnen die de app hardop zegt. Ze worden met `npm run audio` ingesproken (ElevenLabs) en als
 * public/audio/<id>.mp3 opgeslagen. De schermen tonen dezelfde tekst via `phraseText`, zodat wat er staat
 * en wat het elfje zegt altijd gelijk is.
 */
import { hintFor } from '../logic/hints';
import { ISLANDS } from '../logic/facts';
import { STICKERS } from './stickers';

/** De app is voor één kind gemaakt. */
export const CHILD_NAME = 'Floor';

export const PRAISE = ['Goed zo!', 'Super!', 'Knap hoor!', 'Toppie!', 'Jippie!', 'Wauw!', 'Heel goed!'];

export const questionId = (a: number, b: number) => `q-${a}-${b}`;
export const factId = (a: number, b: number) => `d-${a}-${b}`;
export const hintId = (a: number, b: number) => `h-${a}-${b}`;
export const praiseId = (i: number) => `p-${i}`;
export const sharedId = (shared: number) => `eiland-gedeeld-${shared}`;
export const discoverDoneId = (n: number) => `ontdek-${n}`;
export const islandOpenId = (i: number) => `eiland-open-${i}`;
export const stickerId = (id: string) => `sticker-${id}`;

/** Maakt van een rekenstap iets wat je kunt uitspreken: "5 × 7 = 35" → "5 keer 7 is 35". */
export function spoken(step: string): string {
  return step.replace(/×/g, 'keer').replace(/\+/g, 'plus').replace(/−/g, 'min').replace(/=/g, 'is');
}

function discoverTip(n: number): string {
  if (n === 1) return 'Keer 1 is makkelijk: het getal blijft hetzelfde!';
  if (n === 10) return 'Keer 10: zet er een 0 achter!';
  return `Bijvoorbeeld 6 × ${n}: dat is 5 × ${n} en dan nog één ${n} erbij. En 9 × ${n} is 10 × ${n} min één ${n}.`;
}

export function sharedText(shared: number, total: number): string {
  const fresh = total - shared;
  return `Weet je wat? ${shared} van deze sommen ken je al van andere tafels. Je draait ze gewoon om! ${
    fresh === 1 ? 'Er is er maar één echt nieuw.' : `Er zijn er maar ${fresh} echt nieuw.`
  }`;
}

const LINES: Record<string, string> = {};

for (let a = 1; a <= 10; a++)
  for (let b = 1; b <= 10; b++) {
    LINES[questionId(a, b)] = `${a} keer ${b}`;
    LINES[factId(a, b)] = `${a} keer ${b} is ${a * b}.`;
    const h = hintFor(a, b);
    LINES[hintId(a, b)] = spoken([`${h.title}.`, h.tip, ...h.steps.map((s) => `${s}.`)].join(' '));
  }
PRAISE.forEach((p, i) => (LINES[praiseId(i)] = p));

Object.assign(LINES, {
  bijna: 'Bijna! Kijk maar.',
  nieuw: 'Een nieuwe som!',
  test: 'Hoi! Zeven keer zes is tweeënveertig. Goed zo!',

  // welkom
  'welkom-1': `Hoi ${CHILD_NAME}! Ik ben een elfje, en samen gaan we de tafels leren. Maar eerst: ik heb nog geen naam. Wil jij er een voor mij kiezen?`,
  'welkom-3': 'Joepie! Laten we beginnen!',

  // kaart
  'home-0': `Hoi ${CHILD_NAME}! Zullen we samen oefenen?`,
  'home-1': `Goed bezig, ${CHILD_NAME}! Nog één rondje?`,
  'home-2': 'Super! Genoeg geoefend vandaag. Morgen weer?',

  // eiland
  'eiland-klaar': 'Deze tafel ken je! Blijf af en toe oefenen, dan vergeet je hem niet.',
  'eiland-oefen': 'Elke dag een beetje oefenen, dan zit het zo in je hoofd!',
  'eiland-ontdek': 'Laten we eerst samen ontdekken hoe deze tafel werkt!',

  // ronde
  stoppen: 'Wil je stoppen met deze ronde?',

  // resultaat
  'res-top': `Fantastisch, ${CHILD_NAME}!`,
  'res-goed': `Goed gedaan, ${CHILD_NAME}!`,
  'res-knap': `Knap geoefend, ${CHILD_NAME}!`,
  'res-moeilijk': 'Moeilijke sommen komen vaker terug. Zo leer je ze vanzelf!',
  'res-genoeg': 'Je hebt vandaag al heel wat rondes gedaan. Wat knap! Je hersenen onthouden het beste als je morgen weer even oefent.',

  // winkel en album
  'winkel-welkom': 'Welkom in de winkel! Tik op iets om het te passen.',
  gekocht: 'Wat staat dat mooi!',
  sparen: 'Nog even sparen! Oefenen levert sterren op.',
  'winkel-later': 'Dit komt later in de winkel, als je verder bent in het toverbos.',
  album: 'Dit is jouw stickerboek! Hoeveel heb je er al?',

  // snelspel
  'snel-start': 'Hoeveel sommen kun jij goed doen in één minuut? Alleen sommen die je al kent!',
  'snel-go': 'Daar gaan we!',
  'snel-klaar': 'De tijd is op! Goed gedaan!',
  record: 'Wauw, een nieuw record!',

  ouders: 'Dit deel is voor papa of mama.',
});

// "8 van deze sommen ken je al": bij eiland i (één tafel) zijn dat alle tafels van eerdere eilanden.
for (let shared = 2; shared <= 9; shared++) LINES[sharedId(shared)] = sharedText(shared, 10);
for (let n = 1; n <= 10; n++)
  LINES[discoverDoneId(n)] = spoken(`Deze sommen zijn extra handig. Daarmee kun je de andere uitrekenen! ${discoverTip(n)}`);
ISLANDS.forEach((isl, i) => {
  if (i > 0) LINES[islandOpenId(i)] = `Hoera! Een nieuw eiland: de ${isl.name.toLowerCase()} is open!`;
});
for (const s of STICKERS) LINES[stickerId(s.id)] = `Je hebt een nieuwe sticker verdiend: ${s.name}!`;

export { discoverTip };

/** Tekst van een zin. */
export function phraseText(id: string): string {
  return LINES[id] ?? '';
}

/** Alle zinnen, op id. */
export const PHRASES: Record<string, string> = { ...LINES };
