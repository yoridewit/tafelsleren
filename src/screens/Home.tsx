import { Elf } from '../components/Elf';
import { ISLANDS } from '../logic/facts';
import { islandProgress, strongFacts } from '../logic/progress';
import { currentStreak } from '../logic/streak';
import { useSave } from '../state/store';
import { useEffect } from 'react';
import { say, sayOnce, sound } from '../audio';
import { phraseText } from '../data/phrases';
import type { Go } from '../nav';

export function Home({ go }: { go: Go }) {
  const { save, today, dispatch } = useSave();
  const rounds = save.roundsByDay[today] ?? 0;
  const streak = currentStreak(save.practiceDays, today);
  const speedReady = strongFacts(save.facts).length >= 10;
  const current = Math.max(...save.unlocked);

  const messageId = `home-${Math.min(rounds, 2)}`;
  const message = phraseText(messageId, save.childName);

  // Allereerste keer: eerst "Joepie! Laten we beginnen!", dan de begroeting.
  const firstVisit = save.roundsDone === 0 && save.discovered.length === 0;
  useEffect(
    () => sayOnce(`${messageId}-${today}`, firstVisit ? ['welkom-3', messageId] : messageId),
    [messageId, today, firstVisit],
  );

  return (
    <div className="screen home">
      <header className="topbar">
        <span className="pill pill-streak" title="dagen achter elkaar">🔥 {streak}</span>
        <h1 className="topbar-title">Het Toverbos</h1>
        <div className="topbar-right">
          <span className="pill pill-stars">⭐ {save.stars}</span>
          <button
            className="btn btn-round btn-white btn-small"
            onClick={() => dispatch({ type: 'settings', patch: { music: !save.settings.music } })}
            aria-label={save.settings.music ? 'muziek uit' : 'muziek aan'}
          >
            {save.settings.music ? '🎵' : '🔇'}
          </button>
          <button className="btn btn-round btn-white btn-small" onClick={() => go({ name: 'gate' })} aria-label="ouders">
            🔒
          </button>
        </div>
      </header>

      <div className="home-body">
        <aside className="home-elf">
          <button className="bubble bubble-btn" onClick={() => say(messageId)}>
            {message}
          </button>
          <Elf wearing={save.wearing} size="100%" className="float" />
          <div className="elf-name">{save.elfName}</div>
          <div className="home-actions">
            <button className="btn btn-pink" onClick={() => go({ name: 'shop' })}>
              👗 Winkel
            </button>
            <button className="btn btn-yellow" onClick={() => go({ name: 'album' })}>
              📖 Stickers
            </button>
            <button
              className="btn btn-blue"
              onClick={() => go({ name: 'speed' })}
              disabled={!speedReady}
              title={speedReady ? '' : 'Leer eerst 10 sommen'}
            >
              ⚡ Snelspel {!speedReady && '🔒'}
            </button>
          </div>
        </aside>

        <main className="map">
          {ISLANDS.map((isl, i) => {
            const open = save.unlocked.includes(i);
            const p = islandProgress(i, save.facts);
            const pct = Math.round(((p.known + p.almost * 0.5) / p.total) * 100);
            return (
              <button
                key={i}
                className={`island ${open ? '' : 'island-locked'} ${p.mastered ? 'island-done' : ''} ${i === current ? 'island-current' : ''}`}
                style={{ ['--c' as string]: isl.color, ['--pct' as string]: `${pct}%` }}
                disabled={!open}
                onClick={() => {
                  sound.tap();
                  go({ name: 'island', island: i });
                }}
              >
                <span className="island-ring">
                  <span className="island-emoji">{open ? isl.emoji : '🔒'}</span>
                </span>
                <span className="island-name">{isl.tables.join(' en ')}</span>
                {p.mastered && <span className="island-badge">⭐</span>}
              </button>
            );
          })}
        </main>
      </div>
    </div>
  );
}
