import { useEffect, useState } from 'react';
import { Elf } from '../components/Elf';
import { Icon } from '../components/Icon';
import { useStore } from '../state/store';
import { say, sound } from '../audio';
import { FLOOR, activeProfile, profileForEmail, setActiveProfile, type ChildProfile } from '../data/profiles';
import { CloudLogin } from '../components/CloudLogin';
import { useCloud } from '../cloud/CloudProvider';

const ELF_NAMES = ['Pip', 'Fleur', 'Lila', 'Sprankel', 'Juul', 'Tinka'];

/** Eerste scherm op een apparaat zonder save: inloggen (of zonder account beginnen) en dan het elfje een naam geven. */
export function Welcome() {
  const { dispatch } = useStore();
  const cloud = useCloud();
  const [elf, setElf] = useState('');
  const [mode, setMode] = useState<'login' | 'setup'>(cloud.configured ? 'login' : 'setup');
  const [profile, setProfile] = useState<ChildProfile>(activeProfile());

  // Het elfje praat pas zodra duidelijk is bij welk kind hij hoort.
  useEffect(() => {
    if (mode === 'setup') say('welkom-1');
  }, [mode]);

  const choose = (p: ChildProfile) => {
    setActiveProfile(p);
    setProfile(p);
    setMode('setup');
  };

  if (mode === 'login') {
    return (
      <div className="screen welcome">
        <div className="elf-stage">
          <Elf size={160} mood="juichen" className="float" />
        </div>
        <div className="card welcome-card">
          <h1>Welkom!</h1>
          <p className="big">Log in om verder te spelen.</p>
          <CloudLogin
            emailPlaceholder="E-mailadres"
            validate={(email) => (profileForEmail(email) ? null : 'Dit account hoort bij geen kind.')}
            onDone={(outcome, email) => {
              // Bestaat er al voortgang, dan zet de sync die terug en verdwijnt dit scherm vanzelf.
              if (outcome === 'none') {
                const p = profileForEmail(email);
                if (p) choose(p);
              }
            }}
          />
          <button className="btn btn-white btn-small" onClick={() => choose(FLOOR)}>
            Zonder account beginnen
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
        <h1>Hoi {profile.name}!</h1>
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
            dispatch({ type: 'setup', elfName: elf.trim(), profileId: profile.id });
          }}
        >
          Beginnen
          <Icon name="play" />
        </button>
      </div>
    </div>
  );
}
