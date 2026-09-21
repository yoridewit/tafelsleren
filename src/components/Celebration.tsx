import { useEffect } from 'react';
import { STICKERS } from '../data/stickers';
import { ISLANDS } from '../logic/facts';
import { useStore } from '../state/store';
import { sound } from '../audio';
import { islandOpenId, stickerId } from '../data/phrases';
import type { AppState } from '../state/reducer';

/** Wat het elfje zegt bij nieuwe eilanden en stickers (max. 3 zinnen, anders wordt het te lang). */
export function celebrationPhrases(state: AppState): string[] {
  return [...state.newUnlocks.map(islandOpenId), ...state.newStickers.map(stickerId)].slice(0, 3);
}

const CONFETTI = ['#f472b6', '#facc15', '#4ade80', '#38bdf8', '#c084fc', '#fb923c'];

/** Feestscherm voor nieuwe stickers en nieuwe eilanden. */
export function Celebration() {
  const { state, dispatch } = useStore();
  const stickers = STICKERS.filter((s) => state.newStickers.includes(s.id));
  const unlocks = state.newUnlocks;
  const show = stickers.length > 0 || unlocks.length > 0;

  useEffect(() => {
    if (show) sound.fanfare();
  }, [show]);

  if (!show) return null;
  return (
    <div className="modal-bg">
      <div className="confetti" aria-hidden>
        {Array.from({ length: 40 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI[i % CONFETTI.length],
              animationDelay: `${(i % 10) * 0.12}s`,
            }}
          />
        ))}
      </div>
      <div className="modal celebrate">
        <h2>Hoera! 🎉</h2>
        {unlocks.map((i) => (
          <div key={i} className="celebrate-item">
            <span className="celebrate-emoji">{ISLANDS[i].emoji}</span>
            <span>
              Nieuw eiland open: <b>{ISLANDS[i].name}</b>!
            </span>
          </div>
        ))}
        {stickers.map((s) => (
          <div key={s.id} className="celebrate-item">
            <span className="celebrate-emoji sticker-pop">{s.emoji}</span>
            <span>
              Nieuwe sticker: <b>{s.name}</b>
            </span>
          </div>
        ))}
        <button className="btn btn-primary btn-big" onClick={() => dispatch({ type: 'clearCelebrations' })}>
          Joepie!
        </button>
      </div>
    </div>
  );
}
