import { ISLANDS } from '../logic/facts';

export interface StickerSnapshot {
  roundsDone: number;
  practiceDays: number;
  streak: number;
  known: number;
  masteredIslands: number[];
  speedRecord: number;
}

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  earned: (s: StickerSnapshot) => boolean;
}

export const STICKERS: Sticker[] = [
  { id: 'eerste-ronde', emoji: '🌱', name: 'Begonnen!', desc: 'Speel je eerste ronde', earned: (s) => s.roundsDone >= 1 },
  ...ISLANDS.map(
    (isl, i): Sticker => ({
      id: `eiland-${i}`,
      emoji: isl.emoji,
      name: isl.name,
      desc: `Leer de ${isl.name.toLowerCase()} helemaal`,
      earned: (s) => s.masteredIslands.includes(i),
    }),
  ),
  { id: 'rondes-10', emoji: '🎈', name: '10 rondes', desc: 'Speel 10 rondes', earned: (s) => s.roundsDone >= 10 },
  { id: 'rondes-50', emoji: '🎉', name: '50 rondes', desc: 'Speel 50 rondes', earned: (s) => s.roundsDone >= 50 },
  { id: 'rondes-150', emoji: '🏆', name: '150 rondes', desc: 'Speel 150 rondes', earned: (s) => s.roundsDone >= 150 },
  { id: 'dagen-3', emoji: '🔥', name: '3 dagen', desc: 'Oefen op 3 dagen', earned: (s) => s.practiceDays >= 3 },
  { id: 'dagen-10', emoji: '🌟', name: '10 dagen', desc: 'Oefen op 10 dagen', earned: (s) => s.practiceDays >= 10 },
  { id: 'dagen-25', emoji: '💎', name: '25 dagen', desc: 'Oefen op 25 dagen', earned: (s) => s.practiceDays >= 25 },
  { id: 'dagen-50', emoji: '🌈', name: '50 dagen', desc: 'Oefen op 50 dagen', earned: (s) => s.practiceDays >= 50 },
  { id: 'dagen-100', emoji: '🚀', name: '100 dagen', desc: 'Oefen op 100 dagen', earned: (s) => s.practiceDays >= 100 },
  { id: 'reeks-5', emoji: '☀️', name: 'Reeks van 5', desc: 'Oefen 5 dagen achter elkaar', earned: (s) => s.streak >= 5 },
  { id: 'reeks-15', emoji: '🌙', name: 'Reeks van 15', desc: 'Oefen 15 dagen achter elkaar', earned: (s) => s.streak >= 15 },
  { id: 'gekend-10', emoji: '🧠', name: '10 sommen', desc: 'Ken 10 sommen uit je hoofd', earned: (s) => s.known >= 10 },
  { id: 'gekend-30', emoji: '📚', name: '30 sommen', desc: 'Ken 30 sommen uit je hoofd', earned: (s) => s.known >= 30 },
  { id: 'gekend-55', emoji: '👑', name: 'Tafelkoningin', desc: 'Ken alle sommen uit je hoofd', earned: (s) => s.known >= 55 },
  { id: 'snel-10', emoji: '⚡', name: 'Bliksem', desc: '10 sommen in het snelspel', earned: (s) => s.speedRecord >= 10 },
  { id: 'snel-20', emoji: '🐆', name: 'Cheeta', desc: '20 sommen in het snelspel', earned: (s) => s.speedRecord >= 20 },
  { id: 'snel-30', emoji: '🌪️', name: 'Wervelwind', desc: '30 sommen in het snelspel', earned: (s) => s.speedRecord >= 30 },
];

export function earnedStickerIds(s: StickerSnapshot): string[] {
  return STICKERS.filter((st) => st.earned(s)).map((st) => st.id);
}
