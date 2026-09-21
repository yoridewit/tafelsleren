import { Elf } from '../components/Elf';
import { ISLANDS } from '../logic/facts';
import { islandProgress, strongFacts } from '../logic/progress';
import { currentStreak } from '../logic/streak';
import { useSave } from '../state/store';
import { sound } from '../audio';
import type { Go } from '../nav';

/** Slingerpad: rij 1 van links naar rechts, rij 2 terug, rij 3 weer heen. */
const SNAKE = [0, 1, 2, 5, 4, 3, 6, 7, 8];

export function Home({ go }: { go: Go }) {
  const { save, today } = useSave();
  const rounds = save.roundsByDay[today] ?? 0;
  const streak = currentStreak(save.practiceDays, today);
  const speedReady = strongFacts(save.facts).length >= 10;
  const current = Math.max(...save.unlocked);

  const message =
    rounds === 0
      ? `Hoi ${save.childName}! Zullen we samen oefenen? ✨`
      : rounds === 1
        ? `Goed bezig, ${save.childName}! Nog één rondje?`
        : `Super! Genoeg geoefend vandaag. Morgen weer? 🌙`;

  return (
    <div className="screen home">
      <header className="topbar">
        <span className="pill pill-streak" title="dagen achter elkaar">🔥 {streak}</span>
        <h1 className="topbar-title">Het Toverbos</h1>
        <div className="topbar-right">
          <span className="pill pill-stars">⭐ {save.stars}</span>
          <button className="btn btn-round btn-white btn-small" onClick={() => go({ name: 'gate' })} aria-label="ouders">
            🔒
          </button>
        </div>
      </header>

      <div className="home-body">
        <aside className="home-elf">
          <div className="bubble">{message}</div>
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
              ⚡ Snelspel
            </button>
          </div>
        </aside>

        <main className="map">
          {SNAKE.map((i) => {
            const isl = ISLANDS[i];
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
