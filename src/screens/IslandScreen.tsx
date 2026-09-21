import { Elf } from '../components/Elf';
import { TopBar } from '../components/TopBar';
import { ISLANDS, factKey } from '../logic/facts';
import { factStatus } from '../logic/leitner';
import { islandProgress, sharedWithEarlier } from '../logic/progress';
import { useSave } from '../state/store';
import type { Go } from '../nav';

const STATUS_LABEL = { nieuw: 'nieuw', oefenen: 'oefenen', bijna: 'bijna!', gekend: 'kan ik!' };

export function IslandScreen({ island, go }: { island: number; go: Go }) {
  const { save } = useSave();
  const isl = ISLANDS[island];
  const p = islandProgress(island, save.facts);
  const shared = sharedWithEarlier(island).length;
  const discovered = save.discovered.includes(island);

  const message = p.mastered
    ? `Deze tafel ken je! Blijf af en toe oefenen, dan vergeet je hem niet. 🌟`
    : shared > 0 && p.fresh + p.practicing > 0
      ? `Weet je wat? ${shared} van deze sommen ken je al van andere tafels. Je draait ze gewoon om! Er zijn maar ${p.total - shared} echt nieuw.`
      : discovered
        ? `Elke dag een beetje oefenen, dan zit het zo in je hoofd!`
        : `Laten we eerst samen ontdekken hoe deze tafel werkt!`;

  return (
    <div className="screen island-screen" style={{ ['--c' as string]: isl.color }}>
      <TopBar onBack={() => go({ name: 'home' })} title={`${isl.emoji} ${isl.name}`} stars={save.stars} />
      <div className="island-body">
        <div className="island-left">
          <div className="bubble">{message}</div>
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
