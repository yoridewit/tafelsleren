import { useEffect } from 'react';
import { Elf } from '../components/Elf';
import { Icon } from '../components/Icon';
import { StarChip } from '../components/TopBar';
import { ISLANDS } from '../logic/facts';
import { islandProgress, strongFacts } from '../logic/progress';
import { currentStreak } from '../logic/streak';
import { useSave } from '../state/store';
import { say, sayOnce, sound } from '../audio';
import { phraseText } from '../data/phrases';
import type { Go } from '../nav';

/** Plek op de kaart: een slingerpad door een raster van 3×3 (rij 2 loopt terug). */
function cell(i: number) {
  const row = Math.floor(i / 3);
  const col = row % 2 === 1 ? 2 - (i % 3) : i % 3;
  return { gridRow: row + 1, gridColumn: col + 1 };
}

export function Home({ go }: { go: Go }) {
  const { save, today, dispatch } = useSave();
  const rounds = save.roundsByDay[today] ?? 0;
  const streak = currentStreak(save.practiceDays, today);
  const speedReady = strongFacts(save.facts).length >= 10;
  const current = Math.max(...save.unlocked);

  const messageId = `home-${Math.min(rounds, 2)}`;
  const message = phraseText(messageId);

  // Allereerste keer: eerst "Joepie! Laten we beginnen!", dan de begroeting.
  const firstVisit = save.roundsDone === 0 && save.discovered.length === 0;
  useEffect(
    () => sayOnce(`${messageId}-${today}`, firstVisit ? ['welkom-3', messageId] : messageId),
    [messageId, today, firstVisit],
  );

  return (
    <div className="screen home">
      <header className="topbar">
        <div className="topbar-left">
          <span className="chip-stat chip-streak" title="dagen achter elkaar geoefend">
            <Icon name="flame" />
            {streak}
          </span>
        </div>
        <h1 className="topbar-title">Het Toverbos</h1>
        <div className="topbar-right">
          <StarChip stars={save.stars} />
          <button
            className="btn btn-white btn-icon btn-small"
            onClick={() => dispatch({ type: 'settings', patch: { music: !save.settings.music } })}
            aria-label={save.settings.music ? 'muziek uit' : 'muziek aan'}
          >
            <Icon name={save.settings.music ? 'music' : 'musicOff'} size={22} />
          </button>
          <button className="btn btn-white btn-icon btn-small" onClick={() => go({ name: 'gate' })} aria-label="ouders">
            <Icon name="lock" size={22} />
          </button>
        </div>
      </header>

      <div className="home-body">
        <aside className="home-side">
          <button className="bubble" onClick={() => say(messageId)}>
            {message}
            <Icon name="speaker" />
          </button>
          <div className="elf-stage">
            <Elf wearing={save.wearing} size="100%" className="float" />
          </div>
          <div className="elf-name">{save.elfName}</div>
          <div className="home-actions">
            <button className="action" onClick={() => go({ name: 'shop' })}>
              <span className="action-ic pink">
                <Icon name="bag" />
              </span>
              Winkel
            </button>
            <button className="action" onClick={() => go({ name: 'album' })}>
              <span className="action-ic gold">
                <Icon name="book" />
              </span>
              Stickers
            </button>
            <button className="action wide" onClick={() => go({ name: 'speed' })} disabled={!speedReady}>
              <span className="action-ic violet">
                <Icon name={speedReady ? 'bolt' : 'lock'} />
              </span>
              <span>
                Snelspel
                <small>{speedReady ? 'Hoeveel sommen in 1 minuut?' : 'Kan als je 10 sommen goed kent'}</small>
              </span>
            </button>
          </div>
        </aside>

        <main className="map">
          <svg className="map-path" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden>
            <path
              d="M50 50 H250 C300 50 300 150 250 150 H50 C0 150 0 250 50 250 H250"
              fill="none"
              stroke="white"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="0.1 20"
              vectorEffect="non-scaling-stroke"
              opacity="0.95"
            />
          </svg>
          <div className="map-grid">
            {ISLANDS.map((isl, i) => {
              const open = save.unlocked.includes(i);
              const p = islandProgress(i, save.facts);
              const pct = Math.round(((p.known + p.almost * 0.5) / p.total) * 100);
              return (
                <button
                  key={i}
                  className={`island ${open ? '' : 'island-locked'} ${p.mastered ? 'island-done' : ''} ${i === current ? 'island-current' : ''}`}
                  style={{ ...cell(i), ['--c' as string]: isl.color, ['--pct' as string]: `${pct}%` }}
                  disabled={!open}
                  aria-label={open ? isl.name : `${isl.name} (nog op slot)`}
                  onClick={() => {
                    sound.tap();
                    go({ name: 'island', island: i });
                  }}
                >
                  <span className="island-ring">
                    <span className="island-face">{open ? isl.emoji : <Icon name="lock" size="38%" />}</span>
                    <span className="island-label">{isl.tables.join(' en ')}</span>
                    {p.mastered && (
                      <span className="island-badge">
                        <Icon name="star" size={20} />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
