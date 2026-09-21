import { useEffect, useRef, useState } from 'react';
import { NumPad } from '../components/NumPad';
import { TopBar } from '../components/TopBar';
import { Elf } from '../components/Elf';
import { Celebration } from '../components/Celebration';
import { orientFact, type FactKey } from '../logic/facts';
import { strongFacts } from '../logic/progress';
import { speedReward } from '../state/reducer';
import { useSave } from '../state/store';
import { sound } from '../audio';
import type { Go } from '../nav';

const DURATION = 60;

function pick(pool: FactKey[], last: FactKey | null) {
  const options = pool.length > 1 ? pool.filter((k) => k !== last) : pool;
  const key = options[Math.floor(Math.random() * options.length)];
  return { key, ...orientFact(key, []) };
}

/** Snelspel: 60 seconden, alleen sommen die ze al (bijna) kent. Geen invloed op het leerschema. */
export function SpeedGame({ go }: { go: Go }) {
  const { save, dispatch, today } = useSave();
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
      <TopBar onBack={() => go({ name: 'home' })} title="⚡ Snelspel" stars={save.stars} />
      {phase === 'start' && (
        <div className="card center-card">
          <Elf wearing={save.wearing} size={160} />
          <p className="big">
            Hoeveel sommen kun jij goed doen in 1 minuut? Alleen sommen die je al kent!
          </p>
          <p className="big">Jouw record: {save.speedRecord}</p>
          <button className="btn btn-primary btn-huge" onClick={() => setPhase('play')}>
            Start! ⚡
          </button>
        </div>
      )}
      {phase === 'play' && (
        <div className="round-body">
          <div className="round-left">
            <div className="timer">
              <div className="timer-fill" style={{ width: `${(left / DURATION) * 100}%` }} />
            </div>
            <div className="speed-score">✅ {score}</div>
            <div className={`question ${flash === 'wrong' ? 'shake' : ''}`}>
              {q.a} × {q.b} ={' '}
              <span className={`answer-box ${flash === 'right' ? 'answer-right' : ''}`}>
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
          <Elf wearing={save.wearing} mood="juichen" size={160} className="bounce" />
          <h1>{score} sommen goed!</h1>
          {score > oldRecord ? <p className="big">🏆 Nieuw record!</p> : <p className="big">Je record is {oldRecord}.</p>}
          <div className="stars-earned">+{speedReward(score)} ⭐</div>
          <div className="row">
            <button className="btn btn-white btn-big" onClick={() => go({ name: 'home' })}>
              🗺️ Naar de kaart
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
              Nog een keer
            </button>
          </div>
          <Celebration />
        </div>
      )}
    </div>
  );
}
