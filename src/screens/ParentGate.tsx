import { useState } from 'react';
import { NumPad } from '../components/NumPad';
import { TopBar } from '../components/TopBar';
import type { Go } from '../nav';

const rnd = () => 12 + Math.floor(Math.random() * 8);

/** Een som die een kind van 8 nog niet uit het hoofd kan. */
export function ParentGate({ go }: { go: Go }) {
  const [q, setQ] = useState(() => ({ a: rnd(), b: rnd() }));
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);

  return (
    <div className="screen gate">
      <TopBar onBack={() => go({ name: 'home' })} title="🔒 Voor ouders" />
      <div className="round-body">
        <div className="round-left">
          <p className="big">Dit deel is voor papa of mama. Los deze som op:</p>
          <div className="question">
            {q.a} × {q.b} = <span className="answer-box">{input || '?'}</span>
          </div>
          {wrong && <p className="big">Dat klopt niet. Probeer deze:</p>}
        </div>
        <div className="round-right">
          <NumPad
            value={input}
            onChange={setInput}
            onSubmit={() => {
              if (Number(input) === q.a * q.b) go({ name: 'parent' });
              else {
                setWrong(true);
                setInput('');
                setQ({ a: rnd(), b: rnd() });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
