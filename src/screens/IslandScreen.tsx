import { Elf } from '../components/Elf';
import { TopBar } from '../components/TopBar';
import { ISLANDS, factKey } from '../logic/facts';
import { factStatus } from '../logic/leitner';
import { islandProgress, sharedWithEarlier } from '../logic/progress';
import { learningCapForIsland } from '../logic/round';
import { timeUpToday } from '../logic/timeLimit';
import { useSave } from '../state/store';
import { useEffect } from 'react';
import { Icon } from '../components/Icon';
import { say, sayOnce } from '../audio';
import { phraseText, sharedId } from '../data/phrases';
import type { Go } from '../nav';

const STATUS_LABEL = { nieuw: 'nieuw', oefenen: 'aan het oefenen', bijna: 'bijna', gekend: 'kan ik' };

export function IslandScreen({ island, go }: { island: number; go: Go }) {
  const { save, today } = useSave();
  const isl = ISLANDS[island];
  const p = islandProgress(island, save.facts);
  const shared = sharedWithEarlier(island).length;
  const discovered = save.discovered.includes(island);
  const capReached = p.fresh > 0 && p.practicing >= learningCapForIsland(island);
  const timeUp = timeUpToday(save, today);

  const messageId = p.mastered
    ? 'eiland-klaar'
    : shared > 0 && p.fresh + p.practicing > 0
      ? sharedId(shared)
      : discovered
        ? 'eiland-oefen'
        : 'eiland-ontdek';
  const message = phraseText(messageId);

  useEffect(() => sayOnce(`${messageId}-${island}`, messageId), [messageId, island]);

  return (
    <div className="screen island-screen" style={{ ['--c' as string]: isl.color }}>
      <TopBar
        onBack={() => go({ name: 'home' })}
        title={
          <>
            <span aria-hidden>{isl.emoji}</span> {isl.name}
          </>
        }
        stars={save.stars}
      />
      <div className="island-body">
        <div className="island-side">
          <button className="bubble" onClick={() => say(messageId)}>
            {message}
            <Icon name="speaker" />
          </button>
          <div className="elf-stage">
            <Elf wearing={save.wearing} size="100%" mood={p.mastered ? 'juichen' : 'blij'} />
          </div>
        </div>
        <div className="island-main">
          <div className="panel-card">
            <div className="progress-head">
              <strong>Uit je hoofd</strong>
              <span>
                {p.known} van de {p.total}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-known" style={{ width: `${(p.known / p.total) * 100}%` }} />
              <div className="progress-almost" style={{ width: `${(p.almost / p.total) * 100}%` }} />
            </div>
            {isl.tables.map((t) => (
              <div className="fact-chips" key={t}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((a) => {
                  const st = factStatus(save.facts[factKey(a, t)]);
                  return (
                    <span key={a} className={`fact-chip st-${st}`} title={STATUS_LABEL[st]}>
                      {a} × {t}
                      {st === 'gekend' && <Icon name="check" />}
                    </span>
                  );
                })}
              </div>
            ))}
            <div className="legend">
              {(['nieuw', 'oefenen', 'bijna', 'gekend'] as const).map((st) => (
                <span key={st}>
                  <i className={`st-${st}`} />
                  {STATUS_LABEL[st]}
                </span>
              ))}
            </div>
            {timeUp ? (
              <p className="cap-note">
                <Icon name="lock" size={16} />
                {phraseText('eiland-tijd-op')}
              </p>
            ) : (
              capReached && (
                <p className="cap-note">
                  <Icon name="book" size={16} />
                  Deze sommen moet je eerst goed onthouden. Zodra dat lukt, komen er weer nieuwe bij &mdash; morgen is
                  er vast weer ruimte!
                </p>
              )
            )}
          </div>
          <div className="island-buttons">
            <button
              className={`btn ${discovered ? 'btn-white' : 'btn-soft'} btn-big`}
              onClick={() => go({ name: 'discover', island })}
            >
              <Icon name="search" />
              Ontdekken
            </button>
            <button
              className="btn btn-primary btn-huge"
              disabled={discovered && timeUp}
              onClick={() => go(discovered ? { name: 'round', island } : { name: 'discover', island })}
            >
              <Icon name={discovered && timeUp ? 'lock' : 'play'} size={28} />
              Oefenen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
