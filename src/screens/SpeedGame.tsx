import { useEffect, useRef, useState } from 'react';
import { NumPad } from '../components/NumPad';
import { TopBar } from '../components/TopBar';
import { Elf } from '../components/Elf';
import { Icon } from '../components/Icon';
import { Celebration } from '../components/Celebration';
import { orientFact, type FactKey } from '../logic/facts';
import { strongFacts } from '../logic/progress';
import { speedReward } from '../state/reducer';
import { useSave } from '../state/store';
import { say, sound } from '../audio';
import { celebrationPhrases } from '../components/Celebration';
import type { Go } from '../nav';

const DURATION = 60;

function pick(pool: FactKey[], last: FactKey | null) {
  const options = pool.length > 1 ? pool.filter((k) => k !== last) : pool;
  const key = options[Math.floor(Math.random() * options.length)];
  return { key, ...orientFact(key, []) };
}

/** Snelspel: 60 seconden, alleen sommen die ze al (bijna) kent. Geen invloed op het leerschema. */
export function SpeedGame({ go }: { go: Go }) {
  const { save, dispatch, today, state } = useSave();
  const pool = useRef(strongFacts(save.facts)).current;
  const [phase, setPhase] = useState<'start' | 'play' | 'end'>('start');
  const [left, setLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState(() => pick(pool, null));
  const [input, setInput] = useState('');
  const [flash, setFlash] = useState<'' | 'right' | 'wrong'>('');
  const [oldRecord, setOldRecord] = useState(save.speedRecord);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (phase === 'start') say('snel-start');
    if (phase === 'play') say('snel-go');
  }, [phase]);

  // Einde: tijd op of nieuw record, plus eventuele stickers.
  useEffect(() => {
    if (phase === 'end') say([scoreRef.current > oldRecord ? 'record' : 'snel-klaar', ...celebrationPhrases(state)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'play') return;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'play' && left <= 0) {
      setPhase('end');
      sound.fanfare();
      dispatch({ type: 'speedDone', score: scoreRef.current, today });
    }
  }, [left, phase, dispatch, today]);

  const submit = (value: string) => {
    if (Number(value) === q.a * q.b) {
      sound.correct();
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('right');
      setQ(pick(pool, q.key));
      setInput('');
    } else {
      sound.oops();
      setFlash('wrong');
      setInput('');
      setTimeout(() => setQ(pick(pool, q.key)), 900);
    }
    setTimeout(() => setFlash(''), 900);
  };

  return (
    <div className="screen speed">
      <TopBar onBack={() => go({ name: 'home' })} title="Snelspel" stars={save.stars} />
      {phase === 'start' && (
        <div className="card center-card">
          <div className="elf-stage">
            <Elf wearing={save.wearing} size={160} />
          </div>
          <h1>Hoeveel sommen in 1 minuut?</h1>
          <p className="big">Alleen sommen die je al kent. Probeer je record te verbreken!</p>
          <div className="score-row">
            <div className="score-tile">
              <strong>{save.speedRecord}</strong>
              <span>jouw record</span>
            </div>
          </div>
          <button className="btn btn-primary btn-huge" onClick={() => setPhase('play')}>
            <Icon name="bolt" size={28} />
            Start
          </button>
        </div>
      )}
      {phase === 'play' && (
        <div className="round-body">
          <div className="round-left">
            <div className="timer">
              <div className="timer-fill" style={{ width: `${(left / DURATION) * 100}%` }} />
            </div>
            <div className="speed-score">
              <Icon name="check" />
              {score}
            </div>
            <div className={`question ${flash === 'wrong' ? 'shake' : ''}`}>
              {q.a}
              <span className="op">×</span>
              {q.b}
              <span className="op">=</span>
              <span className={`answer-box ${flash === 'right' ? 'answer-right' : ''} ${!input && !flash ? 'answer-empty' : ''}`}>
                {flash === 'wrong' ? q.a * q.b : input || '?'}
              </span>
            </div>
          </div>
          <div className="round-right">
            <NumPad value={input} onChange={setInput} onSubmit={submit} disabled={flash === 'wrong'} />
          </div>
        </div>
      )}
      {phase === 'end' && (
        <div className="card center-card">
          <div className="elf-stage">
            <Elf wearing={save.wearing} mood="juichen" size={160} className="bounce" />
          </div>
          <h1>{score > oldRecord ? 'Nieuw record!' : 'De tijd is op!'}</h1>
          <div className="score-row">
            <div className="score-tile">
              <strong>{score}</strong>
              <span>{score > oldRecord ? `vorig record: ${oldRecord}` : `record: ${oldRecord}`}</span>
            </div>
            <div className="score-tile gold">
              <strong>
                <Icon name="star" size={28} />+{speedReward(score)}
              </strong>
              <span>sterren verdiend</span>
            </div>
          </div>
          <div className="row">
            <button className="btn btn-white btn-big" onClick={() => go({ name: 'home' })}>
              <Icon name="map" />
              Naar de kaart
            </button>
            <button
              className="btn btn-primary btn-big"
              onClick={() => {
                setOldRecord(save.speedRecord);
                scoreRef.current = 0;
                setScore(0);
                setLeft(DURATION);
                setInput('');
                setPhase('play');
              }}
            >
              <Icon name="replay" />
              Nog een keer
            </button>
          </div>
          <Celebration />
        </div>
      )}
    </div>
  );
}
