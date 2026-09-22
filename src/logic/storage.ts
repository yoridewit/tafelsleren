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
}

export function emptySave(elfName = ''): SaveData {
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
    settings: { sound: true, speech: true, music: true, musicVolume: 1, voice: null, dailyLimitMinutes: null },
    createdAt: new Date().toISOString(),
  };
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);
const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const numArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : []);

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
  };
}

/** Controleert opgeslagen/geïmporteerde data en vult ontbrekende velden aan. Null = onbruikbaar. */
export function parseSave(raw: unknown): SaveData | null {
  if (!isObj(raw) || raw.version !== 1) return null;
  const base = emptySave();
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
    createdAt: str(raw.createdAt, base.createdAt),
  };
}

export function loadSave(storage: Pick<Storage, 'getItem'> = localStorage): SaveData | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? parseSave(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData | null, storage: Pick<Storage, 'setItem' | 'removeItem'> = localStorage) {
  try {
    if (data) storage.setItem(STORAGE_KEY, JSON.stringify(data));
    else storage.removeItem(STORAGE_KEY);
  } catch {
    // opslag vol of geblokkeerd: de app blijft werken in het geheugen
  }
}
