/**
 * Alle zinnen die de app hardop zegt. Ze worden met `npm run audio` ingesproken (ElevenLabs) en als
 * public/audio/<id>.mp3 opgeslagen. De schermen tonen dezelfde tekst via `phraseText`, zodat wat er staat
 * en wat het elfje zegt altijd gelijk is.
 *
 * Zinnen met een naam (functies) worden twee keer ingesproken: zonder naam (`<id>.mp3`) en met de naam uit
 * CHILD_NAME (`<id>.n.mp3`). De app gebruikt de versie met naam alleen als die naam klopt.
 */
import { hintFor } from '../logic/hints';
import { ISLANDS } from '../logic/facts';
import { STICKERS } from './stickers';

type Line = string | ((name: string | null) => string);

export const PRAISE = ['Goed zo!', 'Super!', 'Knap hoor!', 'Toppie!', 'Jippie!', 'Wauw!', 'Heel goed!'];

export const questionId = (a: number, b: number) => `q-${a}-${b}`;
export const factId = (a: number, b: number) => `d-${a}-${b}`;
export const hintId = (a: number, b: number) => `h-${a}-${b}`;
export const praiseId = (i: number) => `p-${i}`;
export const sharedId = (shared: number) => `eiland-gedeeld-${shared}`;
export const discoverDoneId = (n: number) => `ontdek-${n}`;
export const islandOpenId = (i: number) => `eiland-open-${i}`;
export const stickerId = (id: string) => `sticker-${id}`;

const hi = (name: string | null, text: string, sep = ' ') => (name ? `${text},${sep}${name}!` : `${text}!`);

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

const LINES: Record<string, Line> = {};

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
  'welkom-1': 'Hoi! Ik ben een elfje. Samen gaan we de tafels leren. Hoe heet jij?',
  'welkom-2': (n: string | null) =>
    `${hi(n, 'Leuk je te ontmoeten')} Ik heb nog geen naam. Wil jij er een voor mij kiezen?`,
  'welkom-3': 'Joepie! Laten we beginnen!',

  // kaart
  'home-0': (n: string | null) => `${n ? `Hoi ${n}!` : 'Hoi!'} Zullen we samen oefenen?`,
  'home-1': (n: string | null) => `${hi(n, 'Goed bezig')} Nog één rondje?`,
  'home-2': 'Super! Genoeg geoefend vandaag. Morgen weer?',

  // eiland
  'eiland-klaar': 'Deze tafel ken je! Blijf af en toe oefenen, dan vergeet je hem niet.',
  'eiland-oefen': 'Elke dag een beetje oefenen, dan zit het zo in je hoofd!',
  'eiland-ontdek': 'Laten we eerst samen ontdekken hoe deze tafel werkt!',

  // ronde
  stoppen: 'Wil je stoppen met deze ronde?',

  // resultaat
  'res-top': (n: string | null) => hi(n, 'Fantastisch'),
  'res-goed': (n: string | null) => hi(n, 'Goed gedaan'),
  'res-knap': (n: string | null) => hi(n, 'Knap geoefend'),
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

/** Ids waarvan ook een versie met naam bestaat. */
export const NAMED_IDS = Object.keys(LINES).filter((id) => typeof LINES[id] === 'function');

/** Tekst van een zin, eventueel met naam. */
export function phraseText(id: string, name: string | null = null): string {
  const line = LINES[id];
  if (line === undefined) return '';
  return typeof line === 'function' ? line(name) : line;
}

/** Alle zinnen zonder naam (de basisset). */
export const PHRASES: Record<string, string> = Object.fromEntries(Object.keys(LINES).map((id) => [id, phraseText(id)]));

/** Alles wat het script moet inspreken: de basisset plus `<id>.n` met de naam. */
export function phrasesToRecord(childName: string | null): Record<string, string> {
  const out = { ...PHRASES };
  if (childName) for (const id of NAMED_IDS) out[`${id}.n`] = phraseText(id, childName);
  return out;
}
