import { useEffect, useRef, useState } from 'react';
import { NumPad } from '../components/NumPad';
import { HintCard } from '../components/HintCard';
import { Elf } from '../components/Elf';
import { ISLANDS } from '../logic/facts';
import { FAST_MS } from '../logic/leitner';
import { buildRound, type Question } from '../logic/round';
import { roundReward } from '../state/reducer';
import { useSave } from '../state/store';
import { say, sayHint, sayPraise, sayQuestion, sound } from '../audio';
import { factId } from '../data/phrases';
import { PRAISE } from '../data/phrases';
import type { Go } from '../nav';

type Phase = 'intro' | 'ask' | 'right' | 'wrong';


export function RoundScreen({ island, go }: { island: number; go: Go }) {
  const { save, dispatch, today } = useSave();
  const [queue, setQueue] = useState<Question[]>(() =>
    buildRound({ island, facts: save.facts, unlocked: save.unlocked, today }),
  );
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('ask');
  const [input, setInput] = useState('');
  const correctRef = useRef(0);
  const [praise, setPraise] = useState(PRAISE[0]);
  const [quit, setQuit] = useState(false);
  const [shake, setShake] = useState(false);
  const introduced = useRef(new Set<string>());
  const requeued = useRef(new Set<string>());
  const wasIntro = useRef(false);
  const started = useRef(0);
  const answered = useRef(-1); // voorkomt dubbel antwoorden bij snel twee keer tikken

  const q = queue[idx];
  const answer = q.a * q.b;

  // Nieuwe vraag: eerst uitleg als het een nieuwe som is.
  useEffect(() => {
    setInput('');
    if (q.isNew && !introduced.current.has(q.key)) {
      setPhase('intro');
      wasIntro.current = true;
      say(['nieuw', factId(q.a, q.b)]);
    } else {
      setPhase('ask');
      wasIntro.current = false;
    }
  }, [idx, q]);

  useEffect(() => {
    if (phase === 'ask') {
      started.current = performance.now();
      sayQuestion(q.a, q.b);
    }
  }, [phase, q]);

  const advance = () => {
    if (idx + 1 < queue.length) {
      setIdx(idx + 1);
      return;
    }
    const firstToday = !save.roundsByDay[today];
    const correct = correctRef.current;
    dispatch({ type: 'finishRound', correct, today });
    go({ name: 'result', island, correct, total: queue.length, stars: roundReward(correct, firstToday) });
  };

  const submit = (value: string) => {
    const given = Number(value);
    if (phase === 'wrong') {
      // natypen van het goede antwoord
      if (given === answer) {
        sound.correct();
        advance();
      } else {
        sound.oops();
        setShake(true);
        setTimeout(() => setShake(false), 400);
        setInput('');
      }
      return;
    }
    if (answered.current === idx) return;
    answered.current = idx;
    const ms = wasIntro.current ? FAST_MS + 1 : performance.now() - started.current;
    const ok = given === answer;
    dispatch({ type: 'answer', key: q.key, correct: ok, ms, today });
    if (ok) {
      sound.correct();
      correctRef.current += 1;
      const p = Math.floor(Math.random() * PRAISE.length);
      setPraise(PRAISE[p]);
      setTimeout(() => sayPraise(p), 250);
      setPhase('right');
      setTimeout(advance, 1000);
    } else {
      sound.oops();
      setTimeout(() => sayHint(q.a, q.b), 300);
      setPhase('wrong');
      setInput('');
      if (!requeued.current.has(q.key)) {
        requeued.current.add(q.key);
        let pos = Math.min(idx + 3, queue.length);
        while (pos < queue.length && (queue[pos - 1]?.key === q.key || queue[pos]?.key === q.key)) pos++;
        const copy = { ...q, isNew: false };
        setQueue((qs) => [...qs.slice(0, pos), copy, ...qs.slice(pos)]);
      }
    }
  };

  return (
    <div className="screen round" style={{ ['--c' as string]: ISLANDS[island].color }}>
      <header className="topbar">
        <button className="btn btn-round btn-white" onClick={() => {
            setQuit(true);
            say('stoppen');
          }} aria-label="stoppen">
          ✕
        </button>
        <div className="dots">
          {queue.map((_, i) => (
            <span key={i} className={`pdot ${i < idx ? 'pdot-done' : i === idx ? 'pdot-now' : ''}`} />
          ))}
        </div>
        <span className="pill pill-stars">⭐ {save.stars}</span>
      </header>

      {phase === 'intro' ? (
        <div className="round-intro">
          <div className="new-badge">✨ Nieuwe som! ✨</div>
          <div className="question">
            {q.a} × {q.b} = <span className="answer-show">{answer}</span>
          </div>
          <HintCard a={q.a} b={q.b} />
          <button
            className="btn btn-primary btn-big"
            onClick={() => {
              introduced.current.add(q.key);
              setPhase('ask');
            }}
          >
            Ik snap het! Nu ik 👉
          </button>
        </div>
      ) : (
        <div className="round-body">
          <div className="round-left">
            <div className={`question ${shake ? 'shake' : ''}`}>
              {q.a} × {q.b} ={' '}
              <span className={`answer-box ${phase === 'right' ? 'answer-right' : ''}`}>
                {phase === 'right' ? answer : input || '?'}
              </span>
            </div>
            <button className="btn btn-white btn-small speak-btn" onClick={() => sayQuestion(q.a, q.b)} aria-label="voorlezen">
              🔊
            </button>
            {phase === 'right' && (
              <div className="feedback feedback-right">
                <Elf wearing={save.wearing} mood="juichen" size={120} />
                <span>{praise} +1 ⭐</span>
              </div>
            )}
            {phase === 'wrong' && (
              <div className="feedback feedback-wrong">
                <p className="big">
                  Bijna! {q.a} × {q.b} = <b>{answer}</b>. Kijk maar:
                </p>
                <HintCard a={q.a} b={q.b} />
                <p className="big">
                  Typ nu zelf <b>{answer}</b>. Deze som komt straks nog een keer terug!
                </p>
              </div>
            )}
            {phase === 'ask' && <Elf wearing={save.wearing} mood="denken" size={130} className="round-elf" />}
          </div>
          <div className="round-right">
            <NumPad value={input} onChange={setInput} onSubmit={submit} disabled={phase === 'right'} />
          </div>
        </div>
      )}

      {quit && (
        <div className="modal-bg">
          <div className="modal">
            <p className="big">Wil je stoppen met deze ronde?</p>
            <div className="row">
              <button className="btn btn-white btn-big" onClick={() => go({ name: 'island', island })}>
                Stoppen
              </button>
              <button className="btn btn-primary btn-big" onClick={() => setQuit(false)}>
                Doorgaan!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
