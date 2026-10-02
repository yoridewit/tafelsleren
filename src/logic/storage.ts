import type { FactKey } from './facts';
import { ALL_FACTS } from './facts';
import type { FactState } from './leitner';
import type { ItemSlot } from '../data/shop';

export const STORAGE_KEY = 'tafels-elfje-v1';

export interface Settings {
  sound: boolean;
  speech: boolean;
  music: boolean;
  /** Volume van de achtergrondmuziek, van 0 (stil) tot 1 (volle sterkte). */
  musicVolume: number;
  /** voiceURI van de gekozen voorleesstem; null = automatisch de natuurlijkste Nederlandse stem. */
  voice: string | null;
  /** Maximaal aantal minuten per dag dat de app open mag zijn; null = geen limiet. */
  dailyLimitMinutes: number | null;
}

export interface SaveData {
  version: 1;
  elfName: string;
  facts: Record<FactKey, FactState>;
  stars: number;
  owned: string[];
  wearing: Partial<Record<ItemSlot, string>>;
  stickers: string[];
  practiceDays: string[];
  roundsByDay: Record<string, number>;
  /** Milliseconden dat de app open en zichtbaar was, per dag (voor de ouderlijke tijdslimiet). */
  timeByDay: Record<string, number>;
  roundsDone: number;
  discovered: number[];
  unlocked: number[];
  speedRecord: number;
  settings: Settings;
  createdAt: string;
  /** Tijdstip (ISO) van de laatste wijziging; bepaalt bij synchroniseren welke kant nieuwer is. */
  updatedAt: string;
}

export function emptySave(elfName = ''): SaveData {
  const now = new Date().toISOString();
  return {
    version: 1,
    elfName,
    facts: {},
    stars: 0,
    owned: [],
    wearing: {},
    stickers: [],
    practiceDays: [],
    roundsByDay: {},
    timeByDay: {},
    roundsDone: 0,
    discovered: [],
    unlocked: [0],
    speedRecord: 0,
    settings: { sound: true, speech: true, music: true, musicVolume: 1, voice: null, dailyLimitMinutes: 10 },
    createdAt: now,
    updatedAt: now,
  };
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);
const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const numArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : []);

const iso = (v: unknown, d: string) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : d);

function parseFact(v: unknown): FactState | null {
  if (!isObj(v)) return null;
  const box = num(v.box, -1);
  if (!Number.isInteger(box) || box < 0 || box > 5) return null;
  return {
    box,
    due: typeof v.due === 'string' ? v.due : null,
    fastDays: strArr(v.fastDays),
    seen: num(v.seen, 0),
    wrong: num(v.wrong, 0),
    ...(typeof v.promoted === 'string' ? { promoted: v.promoted } : {}),
    ...(typeof v.introduced === 'string' ? { introduced: v.introduced } : {}),
  };
}

/** Controleert opgeslagen/geïmporteerde data en vult ontbrekende velden aan. Null = onbruikbaar. */
export function parseSave(raw: unknown): SaveData | null {
  if (!isObj(raw) || raw.version !== 1) return null;
  const base = emptySave();
  const createdAt = str(raw.createdAt, base.createdAt);
  const facts: Record<FactKey, FactState> = {};
  if (isObj(raw.facts))
    for (const k of ALL_FACTS) {
      const f = parseFact(raw.facts[k]);
      if (f) facts[k] = f;
    }
  const wearing: SaveData['wearing'] = {};
  if (isObj(raw.wearing))
    for (const [slot, id] of Object.entries(raw.wearing)) if (typeof id === 'string') wearing[slot as ItemSlot] = id;
  const roundsByDay: Record<string, number> = {};
  if (isObj(raw.roundsByDay))
    for (const [d, n] of Object.entries(raw.roundsByDay)) if (typeof n === 'number') roundsByDay[d] = n;
  const timeByDay: Record<string, number> = {};
  if (isObj(raw.timeByDay))
    for (const [d, n] of Object.entries(raw.timeByDay)) if (typeof n === 'number' && n >= 0) timeByDay[d] = n;
  const settings = isObj(raw.settings) ? raw.settings : {};
  const unlocked = numArr(raw.unlocked);
  return {
    version: 1,
    elfName: str(raw.elfName, ''),
    facts,
    stars: Math.max(0, num(raw.stars, 0)),
    owned: strArr(raw.owned),
    wearing,
    stickers: strArr(raw.stickers),
    practiceDays: strArr(raw.practiceDays),
    roundsByDay,
    timeByDay,
    roundsDone: num(raw.roundsDone, 0),
    discovered: numArr(raw.discovered),
    unlocked: unlocked.includes(0) ? unlocked : [0, ...unlocked],
    speedRecord: num(raw.speedRecord, 0),
    settings: {
      sound: typeof settings.sound === 'boolean' ? settings.sound : base.settings.sound,
      speech: typeof settings.speech === 'boolean' ? settings.speech : base.settings.speech,
      music: typeof settings.music === 'boolean' ? settings.music : base.settings.music,
      musicVolume:
        typeof settings.musicVolume === 'number' && settings.musicVolume >= 0 && settings.musicVolume <= 1
          ? settings.musicVolume
          : base.settings.musicVolume,
      voice: typeof settings.voice === 'string' ? settings.voice : null,
      dailyLimitMinutes:
        typeof settings.dailyLimitMinutes === 'number' && settings.dailyLimitMinutes > 0 ? settings.dailyLimitMinutes : null,
    },
    createdAt,
    updatedAt: iso(raw.updatedAt, createdAt),
  };
}

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

export const CORRUPT_KEY = `${STORAGE_KEY}-corrupt`;
const REPLACED_PREFIX = `${STORAGE_KEY}-replaced-`;
const KEEP_REPLACED = 2;

/** Bewaart onbruikbare opgeslagen tekst zodat hij nooit stilletjes verdwijnt (een eerdere kopie blijft staan). */
function stashCorrupt(raw: string, storage: Pick<Storage, 'getItem' | 'setItem'>) {
  try {
    if (storage.getItem(CORRUPT_KEY) === null) storage.setItem(CORRUPT_KEY, raw);
  } catch {
    // opslag vol of geblokkeerd
  }
}

export function loadSave(storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage): SaveData | null {
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseSave(JSON.parse(raw));
    if (parsed) return parsed;
  } catch {
    // valt door naar het vangnet hieronder
  }
  if (raw) stashCorrupt(raw, storage);
  return null;
}

export function writeSave(data: SaveData | null, storage: Pick<Storage, 'setItem' | 'removeItem'> = localStorage) {
  try {
    if (data) storage.setItem(STORAGE_KEY, JSON.stringify(data));
    else storage.removeItem(STORAGE_KEY);
  } catch {
    // opslag vol of geblokkeerd: de app blijft werken in het geheugen
  }
}

/** Schrijft een bestaande save; wist alleen bij een overgang van een save naar `null` (expliciete reset). */
export function persistTransition(
  prev: SaveData | null,
  next: SaveData | null,
  storage: Pick<Storage, 'setItem' | 'removeItem'> = localStorage,
) {
  if (next) writeSave(next, storage);
  else if (prev) writeSave(null, storage);
}

/** Bewaart een lokale save die door de cloud is vervangen; alleen de laatste 2 blijven bestaan. */
export function keepReplaced(
  save: SaveData,
  storage: KeyValueStorage = localStorage,
  now: string = new Date().toISOString(),
) {
  try {
    storage.setItem(`${REPLACED_PREFIX}${now}`, JSON.stringify(save));
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k?.startsWith(REPLACED_PREFIX)) keys.push(k);
    }
    keys.sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_REPLACED))) storage.removeItem(k);
  } catch {
    // opslag vol of geblokkeerd
  }
}
