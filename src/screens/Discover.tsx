import { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Groups } from '../components/Groups';
import { NumberLine } from '../components/NumberLine';
import { Elf } from '../components/Elf';
import { ISLANDS } from '../logic/facts';
import { useSave } from '../state/store';
import { say, sayFact, sound } from '../audio';
import { discoverDoneId, discoverTip } from '../data/phrases';
import type { Go } from '../nav';

const ANCHORS = [1, 2, 5, 10];

/** Uitleg van een tafel: groepjes erbij, sprongen op de getallenlijn, en de handige ankers. */
export function Discover({ island, go }: { island: number; go: Go }) {
  const { save, dispatch } = useSave();
  const tables = ISLANDS[island].tables;
  const [ti, setTi] = useState(0);
  const [k, setK] = useState(1);
  const [summary, setSummary] = useState(false);
  const n = tables[ti];

  useEffect(() => {
    if (summary) say(discoverDoneId(n));
    else sayFact(k, n);
  }, [k, n, summary]);

  const next = () => {
    sound.tap();
    if (k < 10) setK(k + 1);
    else setSummary(true);
  };

  const finish = () => {
    if (ti + 1 < tables.length) {
      setTi(ti + 1);
      setK(1);
      setSummary(false);
      return;
    }
    sound.fanfare();
    dispatch({ type: 'discovered', island });
    go({ name: 'round', island });
  };

  return (
    <div className="screen discover">
      <TopBar onBack={() => go({ name: 'island', island })} title={`🔍 De tafel van ${n}`} stars={save.stars} />
      {!summary ? (
        <div className="discover-body">
          <p className="big center">
            {k === 1 ? `Eén groepje van ${n}.` : `${k} groepjes van ${n}.`} Hoeveel zijn dat samen?
          </p>
          <div className="discover-sum">
            {k} × {n} = <b>{k * n}</b>
          </div>
          <Groups a={k} b={n} />
          <NumberLine n={n} jumps={k} />
          <button className="btn btn-primary btn-big" onClick={next}>
            {k < 10 ? 'Nog een groepje erbij ➕' : 'Klaar! 🎉'}
          </button>
        </div>
      ) : (
        <div className="discover-body">
          <div className="discover-summary">
            <Elf wearing={save.wearing} mood="juichen" size={160} />
            <div>
              <p className="big">Deze sommen zijn extra handig. Daarmee kun je de andere uitrekenen!</p>
              <div className="anchors">
                {ANCHORS.map((a) => (
                  <div className="anchor" key={a}>
                    {a} × {n} = <b>{a * n}</b>
                  </div>
                ))}
              </div>
              <p className="big">{discoverTip(n)}</p>
            </div>
          </div>
          <button className="btn btn-primary btn-big" onClick={finish}>
            {ti + 1 < tables.length ? `Nu de tafel van ${tables[ti + 1]} →` : 'Aan de slag! ▶'}
          </button>
        </div>
      )}
    </div>
  );
}
