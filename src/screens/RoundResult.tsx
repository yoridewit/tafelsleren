import { useEffect } from 'react';
import { Elf } from '../components/Elf';
import { Celebration } from '../components/Celebration';
import { useSave } from '../state/store';
import { say, sound } from '../audio';
import { phraseText } from '../data/phrases';
import { celebrationPhrases } from '../components/Celebration';
import type { Go } from '../nav';

interface Props {
  island: number;
  correct: number;
  total: number;
  stars: number;
  go: Go;
}

export function RoundResult({ island, correct, total, stars, go }: Props) {
  const { save, today, state } = useSave();
  const roundsToday = save.roundsByDay[today] ?? 0;
  const ratio = correct / total;

  const titleId = ratio >= 0.9 ? 'res-top' : ratio >= 0.6 ? 'res-goed' : 'res-knap';
  const extraId = roundsToday >= 3 ? 'res-genoeg' : ratio < 0.6 ? 'res-moeilijk' : null;

  useEffect(() => {
    sound.coin();
    say([titleId, ...celebrationPhrases(state), ...(extraId ? [extraId] : [])]);
    // alleen bij binnenkomst
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen result">
      <div className="result-card card">
        <Elf wearing={save.wearing} mood="juichen" size={180} className="bounce" />
        <h1>
          {phraseText(titleId, save.childName)}
        </h1>
        <p className="big">
          {correct} van de {total} sommen in één keer goed
        </p>
        <div className="stars-earned">+{stars} ⭐</div>
        {roundsToday >= 3 ? (
          <p className="big">{phraseText('res-genoeg')} 🌙</p>
        ) : ratio < 0.6 ? (
          <p className="big">{phraseText('res-moeilijk')}</p>
        ) : null}
        <div className="row">
          <button className="btn btn-white btn-big" onClick={() => go({ name: 'home' })}>
            🗺️ Naar de kaart
          </button>
          <button className={`btn ${roundsToday >= 3 ? 'btn-white' : 'btn-primary'} btn-big`} onClick={() => go({ name: 'round', island })}>
            ▶ Nog een ronde
          </button>
        </div>
      </div>
      <Celebration />
    </div>
  );
}
