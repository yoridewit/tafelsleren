import { useEffect, useState } from 'react';
import { say } from '../audio';
import { NumPad } from './NumPad';

const rnd = () => 12 + Math.floor(Math.random() * 8);

/** Een som die een kind van 8 nog niet uit het hoofd kan. */
export function MathGate({ onPass }: { onPass: () => void }) {
  const [q, setQ] = useState(() => ({ a: rnd(), b: rnd() }));
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  useEffect(() => say('ouders'), []);

  return (
    <div className="round-body">
      <div className="round-left">
        <p className="big">Dit deel is voor papa of mama. Los deze som op:</p>
        <div className="question">
          {q.a}
          <span className="op">×</span>
          {q.b}
          <span className="op">=</span>
          <span className={`answer-box ${input ? '' : 'answer-empty'}`}>{input || '?'}</span>
        </div>
        {wrong && <p className="big">Dat klopt niet. Probeer deze:</p>}
      </div>
      <div className="round-right">
        <NumPad
          value={input}
          onChange={setInput}
          onSubmit={(value) => {
            if (Number(value) === q.a * q.b) onPass();
            else {
              setWrong(true);
              setInput('');
              setQ({ a: rnd(), b: rnd() });
            }
          }}
        />
      </div>
    </div>
  );
}
