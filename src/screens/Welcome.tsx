import { useEffect, useState } from 'react';
import { Elf } from '../components/Elf';
import { Icon } from '../components/Icon';
import { useStore } from '../state/store';
import { say, sound } from '../audio';
import { CHILD_NAME } from '../data/phrases';

const ELF_NAMES = ['Pip', 'Fleur', 'Lila', 'Sprankel', 'Juul', 'Tinka'];

export function Welcome() {
  const { dispatch } = useStore();
  const [elf, setElf] = useState('');

  useEffect(() => say('welkom-1'), []);

  return (
    <div className="screen welcome">
      <div className="elf-stage">
        <Elf size={160} mood="juichen" className="float" />
      </div>
      <div className="card welcome-card">
        <h1>Hoi {CHILD_NAME}!</h1>
        <p className="big">
          Ik ben een elfje, en samen gaan we de tafels leren. Maar eerst: ik heb nog geen naam. Wil jij er een voor mij
          kiezen?
        </p>
        <div className="chips">
          {ELF_NAMES.map((n) => (
            <button key={n} className={`chip ${elf === n ? 'chip-on' : ''}`} onClick={() => setElf(n)}>
              {n}
            </button>
          ))}
        </div>
        <input
          className="text-input"
          value={elf}
          onChange={(e) => setElf(e.target.value)}
          placeholder="Of verzin er zelf een"
          maxLength={20}
        />
        <button
          className="btn btn-primary btn-big"
          disabled={!elf.trim()}
          onClick={() => {
            sound.fanfare();
            dispatch({ type: 'setup', elfName: elf.trim() });
          }}
        >
          Beginnen
          <Icon name="play" />
        </button>
      </div>
    </div>
  );
}
