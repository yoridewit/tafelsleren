import { useEffect, useState } from 'react';
import { Elf } from '../components/Elf';
import { Icon } from '../components/Icon';
import { useStore } from '../state/store';
import { say, sound } from '../audio';
import { CHILD_NAME } from '../data/phrases';
import { CloudLogin } from '../components/CloudLogin';
import { MathGate } from '../components/MathGate';
import { TopBar } from '../components/TopBar';
import { useCloud } from '../cloud/CloudProvider';

const ELF_NAMES = ['Pip', 'Fleur', 'Lila', 'Sprankel', 'Juul', 'Tinka'];

export function Welcome() {
  const { dispatch } = useStore();
  const cloud = useCloud();
  const [elf, setElf] = useState('');
  const [mode, setMode] = useState<'setup' | 'gate' | 'restore'>('setup');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => say('welkom-1'), []);

  if (mode === 'gate') {
    return (
      <div className="screen gate">
        <TopBar onBack={() => setMode('setup')} title="Voor ouders" />
        <MathGate onPass={() => setMode('restore')} />
      </div>
    );
  }

  if (mode === 'restore') {
    return (
      <div className="screen welcome">
        <div className="card welcome-card">
          <h1>Voortgang herstellen</h1>
          <p className="big">Log in met het e-mailadres van de ouder om de opgeslagen voortgang terug te halen.</p>
          <CloudLogin onDone={(outcome) => setNotFound(outcome === 'none')} />
          {notFound && <p className="note">Geen opgeslagen voortgang gevonden voor dit account.</p>}
          <button className="btn btn-white btn-small" onClick={() => setMode('setup')}>
            Terug
          </button>
        </div>
      </div>
    );
  }

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
        {cloud.configured && !cloud.signedIn && (
          <button className="btn btn-white btn-small" onClick={() => setMode('gate')}>
            Ouder? Voortgang herstellen
          </button>
        )}
      </div>
    </div>
  );
}
