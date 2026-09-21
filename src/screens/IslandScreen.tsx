import { Elf } from '../components/Elf';
import { TopBar } from '../components/TopBar';
import { ISLANDS, factKey } from '../logic/facts';
import { factStatus } from '../logic/leitner';
import { islandProgress, sharedWithEarlier } from '../logic/progress';
import { useSave } from '../state/store';
import { useEffect } from 'react';
import { say, sayOnce } from '../audio';
import { phraseText, sharedId } from '../data/phrases';
import type { Go } from '../nav';

const STATUS_LABEL = { nieuw: 'nieuw', oefenen: 'oefenen', bijna: 'bijna!', gekend: 'kan ik!' };

export function IslandScreen({ island, go }: { island: number; go: Go }) {
  const { save } = useSave();
  const isl = ISLANDS[island];
  const p = islandProgress(island, save.facts);
  const shared = sharedWithEarlier(island).length;
  const discovered = save.discovered.includes(island);

  const messageId = p.mastered
    ? 'eiland-klaar'
    : shared > 0 && p.fresh + p.practicing > 0
      ? sharedId(shared)
      : discovered
        ? 'eiland-oefen'
        : 'eiland-ontdek';
  const message = phraseText(messageId, save.childName);

  useEffect(() => sayOnce(`${messageId}-${island}`, messageId), [messageId, island]);

  return (
    <div className="screen island-screen" style={{ ['--c' as string]: isl.color }}>
      <TopBar onBack={() => go({ name: 'home' })} title={`${isl.emoji} ${isl.name}`} stars={save.stars} />
      <div className="island-body">
        <div className="island-left">
          <button className="bubble bubble-btn" onClick={() => say(messageId)}>
            {message}
          </button>
          <Elf wearing={save.wearing} size="100%" mood={p.mastered ? 'juichen' : 'blij'} />
        </div>
        <div className="island-right">
          <div className="progress-bar">
            <div className="progress-known" style={{ width: `${(p.known / p.total) * 100}%` }} />
            <div className="progress-almost" style={{ width: `${(p.almost / p.total) * 100}%` }} />
          </div>
          <div className="progress-label">
            {p.known} van de {p.total} sommen kan je al uit je hoofd
          </div>
          {isl.tables.map((t) => (
            <div className="fact-chips" key={t}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((a) => {
                const st = factStatus(save.facts[factKey(a, t)]);
                return (
                  <span key={a} className={`fact-chip st-${st}`} title={STATUS_LABEL[st]}>
                    {a} × {t}
                    {st === 'gekend' && ' ✓'}
                  </span>
                );
              })}
            </div>
          ))}
          <div className="island-buttons">
            <button className={`btn ${discovered ? 'btn-white' : 'btn-yellow'} btn-big`} onClick={() => go({ name: 'discover', island })}>
              🔍 Ontdekken
            </button>
            <button
              className="btn btn-primary btn-huge"
              onClick={() => go(discovered ? { name: 'round', island } : { name: 'discover', island })}
            >
              ▶ Oefenen!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
