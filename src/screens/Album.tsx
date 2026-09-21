import { TopBar } from '../components/TopBar';
import { STICKERS } from '../data/stickers';
import { useSave } from '../state/store';
import { useEffect } from 'react';
import { say } from '../audio';
import type { Go } from '../nav';

export function Album({ go }: { go: Go }) {
  const { save } = useSave();
  const count = STICKERS.filter((s) => save.stickers.includes(s.id)).length;
  useEffect(() => say('album'), []);
  return (
    <div className="screen album">
      <TopBar onBack={() => go({ name: 'home' })} title={`📖 Stickers (${count}/${STICKERS.length})`} stars={save.stars} />
      <div className="sticker-grid">
        {STICKERS.map((s) => {
          const has = save.stickers.includes(s.id);
          return (
            <div key={s.id} className={`sticker ${has ? 'sticker-has' : ''}`}>
              <span className="sticker-emoji">{has ? s.emoji : '?'}</span>
              <span className="sticker-name">{has ? s.name : '???'}</span>
              <span className="sticker-desc">{s.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
