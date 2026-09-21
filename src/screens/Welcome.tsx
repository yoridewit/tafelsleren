import { useState } from 'react';
import { Elf } from '../components/Elf';
import { useStore } from '../state/store';
import { sound } from '../audio';

const ELF_NAMES = ['Pip', 'Fleur', 'Lila', 'Sprankel', 'Juul', 'Tinka'];

export function Welcome() {
  const { dispatch } = useStore();
  const [step, setStep] = useState(0);
  const [child, setChild] = useState('');
  const [elf, setElf] = useState('');

  return (
    <div className="screen welcome">
      <Elf size={200} mood={step === 1 ? 'juichen' : 'blij'} className="float" />
      {step === 0 ? (
        <div className="card welcome-card">
          <h1>Hoi! Ik ben een elfje ✨</h1>
          <p className="big">Samen gaan we de tafels leren. Hoe heet jij?</p>
          <input
            className="text-input"
            value={child}
            onChange={(e) => setChild(e.target.value)}
            placeholder="Jouw naam"
            maxLength={20}
            autoFocus
          />
          <button className="btn btn-primary btn-big" disabled={!child.trim()} onClick={() => { sound.tap(); setStep(1); }}>
            Verder →
          </button>
        </div>
      ) : (
        <div className="card welcome-card">
          <h1>Leuk je te ontmoeten, {child.trim()}!</h1>
          <p className="big">Ik heb nog geen naam. Wil jij er een voor mij kiezen?</p>
          <div className="chips">
            {ELF_NAMES.map((n) => (
              <button key={n} className={`chip ${elf === n ? 'chip-on' : ''}`} onClick={() => setElf(n)}>
                {n}
              </button>
            ))}
          </div>
          <input className="text-input" value={elf} onChange={(e) => setElf(e.target.value)} placeholder="Of verzin er zelf een" maxLength={20} />
          <button
            className="btn btn-primary btn-big"
            disabled={!elf.trim()}
            onClick={() => {
              sound.fanfare();
              dispatch({ type: 'setup', childName: child.trim(), elfName: elf.trim() });
            }}
          >
            Beginnen! 🚀
          </button>
        </div>
      )}
    </div>
  );
}
