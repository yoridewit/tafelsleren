import { Fragment, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { ISLANDS, factKey } from '../logic/facts';
import { factStatus } from '../logic/leitner';
import { islandProgress, knownCount } from '../logic/progress';
import { TIME_LIMIT_OPTIONS } from '../logic/timeLimit';
import { currentStreak } from '../logic/streak';
import { addDays } from '../logic/dates';
import { parseSave } from '../logic/storage';
import { useSave } from '../state/store';
import { dutchVoices, hasRecordedVoice, onVoicesChanged, say, setPreferredVoice } from '../audio';
import type { Go } from '../nav';

const STATUS_TEXT = { nieuw: 'Nog niet geoefend', oefenen: 'Aan het oefenen', bijna: 'Bijna', gekend: 'Kent ze uit het hoofd' };

export function Parent({ go }: { go: Go }) {
  const { save, dispatch, today } = useSave();
  const [elf, setElf] = useState(save.elfName);
  const [msg, setMsg] = useState('');
  const [detail, setDetail] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [voices, setVoices] = useState(dutchVoices);
  useEffect(() => onVoicesChanged(() => setVoices(dutchVoices())), []);

  const testVoice = (uri: string | null) => {
    setPreferredVoice(uri);
    say('test', true);
  };

  // Kalender: 8 weken, beginnend op maandag.
  const dow = (new Date().getDay() + 6) % 7;
  const start = addDays(today, -(7 * 7 + dow));
  const days = Array.from({ length: 56 }, (_, i) => addDays(start, i));

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tafels-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Back-up gedownload.');
  };

  const importBackup = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = parseSave(JSON.parse(await file.text()));
      if (!data) throw new Error();
      if (confirm('Deze back-up terugzetten? De huidige voortgang wordt vervangen.')) {
        dispatch({ type: 'import', data });
        setMsg('Back-up teruggezet.');
      }
    } catch {
      setMsg('Dit bestand is geen geldige back-up.');
    }
  };

  const reset = () => {
    if (confirm('Weet je zeker dat je ALLE voortgang wilt wissen?') && confirm('Echt zeker? Dit kan niet ongedaan worden (tenzij je een back-up hebt).')) {
      dispatch({ type: 'reset' });
    }
  };

  return (
    <div className="screen parent">
      <TopBar onBack={() => go({ name: 'home' })} title="Ouderoverzicht" />
      <div className="parent-body">
        <section className="panel">
          <h2>In het kort</h2>
          <div className="stats">
            {[
              [`${knownCount(save.facts)}/55`, 'uit het hoofd'],
              [save.practiceDays.length, 'oefendagen'],
              [currentStreak(save.practiceDays, today), 'dagen reeks'],
              [save.roundsDone, 'rondes'],
              [save.speedRecord, 'snelspel-record'],
              [save.stars, 'sterren'],
            ].map(([v, label]) => (
              <div className="stat" key={label}>
                <b>{v}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <p className="muted">
            Een som telt als "uit het hoofd" als ze hem op minstens 2 verschillende dagen binnen 4 seconden goed had en hij
            een paar keer is herhaald. 3×7 en 7×3 tellen als dezelfde som.
          </p>
        </section>

        <section className="panel">
          <h2>Alle sommen</h2>
          <div className="grid10">
            <span />
            {Array.from({ length: 10 }, (_, j) => (
              <span key={j} className="grid-head">{j + 1}</span>
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <Fragment key={i}>
                <span className="grid-head">{i + 1}×</span>
                {Array.from({ length: 10 }, (_, j) => {
                  const f = save.facts[factKey(i + 1, j + 1)];
                  const st = factStatus(f);
                  const info = `${i + 1} × ${j + 1} = ${(i + 1) * (j + 1)}: ${STATUS_TEXT[st]}${f ? ` (${f.seen}× gezien, ${f.wrong}× fout)` : ''}`;
                  return (
                    <span
                      key={`${i}-${j}`}
                      onClick={() => setDetail(info)}
                      className={`grid-cell st-${st} ${f && f.wrong >= 3 && f.wrong / f.seen > 0.3 ? 'grid-hard' : ''}`}
                      title={info}
                    >
                      {(i + 1) * (j + 1)}
                    </span>
                  );
                })}
              </Fragment>
            ))}
          </div>
          <div className="legend">
            {(['nieuw', 'oefenen', 'bijna', 'gekend'] as const).map((s) => (
              <span key={s}>
                <i className={`st-${s}`} />
                {STATUS_TEXT[s]}
              </span>
            ))}
          </div>
          <p className="note">{detail || 'Tik op een vakje voor details. Rood omrande sommen gingen vaak fout.'}</p>
        </section>

        <section className="panel">
          <h2>Oefendagen (8 weken)</h2>
          <div className="calendar">
            {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((d) => (
              <span key={d} className="cal-head">{d}</span>
            ))}
            {days.map((d) => {
              const n = save.roundsByDay[d] ?? 0;
              return (
                <span
                  key={d}
                  className={`cal-day ${d > today ? 'cal-future' : ''}`}
                  data-n={Math.min(n, 3)}
                  title={`${d}: ${n} rondes`}
                />
              );
            })}
          </div>
          <p className="muted">Advies: 5 minuten per dag, 5 dagen per week. Kort en vaak werkt beter dan lang en af en toe.</p>
        </section>

        <section className="panel">
          <h2>Eilanden (tafels)</h2>
          <p className="muted">
            Een eiland gaat vanzelf open als het vorige beheerst is. Loopt de klas voor? Geef het eiland dan hier vrij.
          </p>
          {ISLANDS.map((isl, i) => {
            const p = islandProgress(i, save.facts);
            const open = save.unlocked.includes(i);
            return (
              <div key={i} className="island-row">
                <span>
                  {isl.emoji} {isl.name}
                </span>
                <span className="muted">
                  {p.known}/{p.total} gekend{p.mastered ? ' ⭐' : ''}
                </span>
                {open ? (
                  <span className="muted">open</span>
                ) : (
                  <button className="btn btn-white btn-small" onClick={() => dispatch({ type: 'unlock', island: i })}>
                    Vrijgeven
                  </button>
                )}
              </div>
            );
          })}
        </section>

        <section className="panel">
          <h2>Instellingen</h2>
          <label className="toggle">
            <input
              type="checkbox"
              checked={save.settings.sound}
              onChange={(e) => dispatch({ type: 'settings', patch: { sound: e.target.checked } })}
            />
            Geluidjes
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={save.settings.speech}
              onChange={(e) => dispatch({ type: 'settings', patch: { speech: e.target.checked } })}
            />
            Sommen voorlezen
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={save.settings.music}
              onChange={(e) => dispatch({ type: 'settings', patch: { music: e.target.checked } })}
            />
            Muziek in de menu's (nooit tijdens het oefenen)
          </label>
          <label className="toggle">
            Tijdslimiet per dag
            <select
              className="voice-select"
              value={save.settings.dailyLimitMinutes ?? ''}
              onChange={(e) =>
                dispatch({
                  type: 'settings',
                  patch: { dailyLimitMinutes: e.target.value ? Number(e.target.value) : null },
                })
              }
              aria-label="tijdslimiet per dag"
            >
              <option value="">Geen limiet</option>
              {TIME_LIMIT_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} minuten
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            Als de tijd op is, stopt de app na de lopende ronde vriendelijk voor die dag. Winkel en stickers blijven
            gewoon te bekijken; morgen kan er weer geoefend worden.
          </p>
          {hasRecordedVoice() ? (
            <p className="muted">
              De app gebruikt ingesproken zinnen (natuurlijke AI-stem). De stem hieronder is alleen een reserve voor zinnen
              zonder opname.
            </p>
          ) : (
            <p className="muted">Voorleesstem van dit apparaat:</p>
          )}
          <div className="voice-row">
            <select
              className="voice-select"
              value={save.settings.voice ?? ''}
              onChange={(e) => {
                const voice = e.target.value || null;
                dispatch({ type: 'settings', patch: { voice } });
                testVoice(voice);
              }}
              aria-label="voorleesstem"
            >
              <option value="">Automatisch (beste stem)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}
                </option>
              ))}
            </select>
            <button className="btn btn-white btn-small" onClick={() => testVoice(save.settings.voice)}>
              <Icon name="speaker" size={20} />
              Test
            </button>
          </div>
          {voices.length === 0 && (
            <p className="note">
              Geen Nederlandse stem gevonden op dit apparaat, dus de app leest (nog) niets voor. Installeer er een zoals
              hieronder beschreven.
            </p>
          )}
          <p className="muted">
            Robotstem? Op een iPad kun je gratis een natuurlijkere stem downloaden: Instellingen → Toegankelijkheid →
            Gesproken materiaal → Stemmen → Nederlands → kies bijv. "Claire" of "Xander" (verbeterd of premium). Op Android:
            Instellingen → Tekst-naar-spraak → Google, en download "Nederlands". Herstart daarna de app en kies de stem
            hierboven.
          </p>
          <div className="row">
            <input className="text-input small" value={elf} onChange={(e) => setElf(e.target.value)} aria-label="naam elfje" />
            <button
              className="btn btn-white btn-small"
              disabled={!elf.trim()}
              onClick={() => {
                dispatch({ type: 'rename', elfName: elf.trim() });
                setMsg('Naam van het elfje opgeslagen.');
              }}
            >
              Naam elfje opslaan
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Back-up</h2>
          <p className="muted">
            De voortgang staat alleen op dit apparaat. Wis je de browsergegevens, dan is alles weg. Maak daarom af en toe een
            back-up (bijvoorbeeld naar iCloud of Google Drive).
          </p>
          <div className="row">
            <button className="btn btn-primary btn-small" onClick={exportBackup}>
              <Icon name="download" size={20} />
              Back-up downloaden
            </button>
            <button className="btn btn-white btn-small" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={20} />
              Back-up terugzetten
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
            <button className="btn btn-danger btn-small" onClick={reset}>
              <Icon name="trash" size={20} />
              Alles wissen
            </button>
          </div>
          {msg && <p className="note">{msg}</p>}
        </section>

        <section className="panel">
          <h2>Tips</h2>
          <ul className="tips">
            <li>
              <b>Installeren:</b> iPad: Safari → deel-knop → "Zet op beginscherm". Android: Chrome → ⋮ → "App installeren".
              Dan opent de app schermvullend en werkt ook zonder internet.
            </li>
            <li>
              <b>Kort en vaak:</b> 1 à 2 rondes per dag (5 minuten) werkt beter dan een lange sessie in het weekend. De app
              herhaalt sommen precies wanneer ze bijna vergeten worden.
            </li>
            <li>
              <b>Strategieën, niet stampen:</b> de app leert eerst 1×, 2×, 5× en 10× als ankers, en daarna "rondom de 5"
              (6× = 5× + 1×) en "rond de 10" (9× = 10× − 1×). Vraag bij een fout: "Hoe kun je het uitrekenen?"
            </li>
            <li>
              <b>Omdraaien:</b> 3×7 is hetzelfde als 7×3. Daardoor valt de tafel van 9 mee: alleen 9×9 is echt nieuw!
            </li>
            <li>
              <b>Buiten de app:</b> tafels opzeggen in de auto, springen of klappen bij elke stap, of in de supermarkt "hoeveel
              kost 3 pakjes van 4 euro?".
            </li>
            <li>
              <b>Geen tijdsdruk:</b> de app meet stilletjes hoe snel ze is, maar laat geen klok zien (behalve in het vrijwillige
              snelspel). Tijdsdruk vroeg in het leren kan rekenangst geven.
            </li>
            <li>
              <b>Planning:</b> met 9 eilanden in ±9 maanden is 3 à 4 weken per tafel ruim genoeg, met tijd over voor herhaling.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
