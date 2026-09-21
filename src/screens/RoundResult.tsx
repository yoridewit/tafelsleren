import { useEffect } from 'react';
import { Elf } from '../components/Elf';
import { Celebration } from '../components/Celebration';
import { useSave } from '../state/store';
import { sound } from '../audio';
import type { Go } from '../nav';

interface Props {
  island: number;
  correct: number;
  total: number;
  stars: number;
  go: Go;
}

export function RoundResult({ island, correct, total, stars, go }: Props) {
  const { save, today } = useSave();
  const roundsToday = save.roundsByDay[today] ?? 0;
  const ratio = correct / total;

  useEffect(() => {
    sound.coin();
  }, []);

  const title = ratio >= 0.9 ? 'Fantastisch' : ratio >= 0.6 ? 'Goed gedaan' : 'Knap geoefend';

  return (
    <div className="screen result">
      <div className="result-card card">
        <Elf wearing={save.wearing} mood="juichen" size={180} className="bounce" />
        <h1>
          {title}, {save.childName}!
        </h1>
        <p className="big">
          {correct} van de {total} sommen in één keer goed
        </p>
        <div className="stars-earned">+{stars} ⭐</div>
        {roundsToday >= 3 ? (
          <p className="big">
            Je hebt vandaag al {roundsToday} rondes gedaan. Wat knap! Je hersenen onthouden het beste als je morgen weer
            even oefent. 🌙
          </p>
        ) : ratio < 0.6 ? (
          <p className="big">Moeilijke sommen komen vaker terug. Zo leer je ze vanzelf!</p>
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
