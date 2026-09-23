import { useState } from 'react';
import { useCloud } from '../cloud/CloudProvider';
import type { StartOutcome } from '../cloud/sync';

/** E-mail en wachtwoord van het ouderaccount (aangemaakt in de Firebase-console). */
export function CloudLogin({ onDone }: { onDone?: (outcome: StartOutcome) => void }) {
  const cloud = useCloud();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const outcome = await cloud.signIn(email.trim(), password);
      if (outcome === 'failed') {
        setError('Ingelogd, maar de voortgang ophalen lukte niet. Het wordt zo nog eens geprobeerd.');
        return;
      }
      onDone?.(outcome);
    } catch {
      setError('Inloggen mislukt. Klopt het e-mailadres en wachtwoord, en is er internet?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="cloud-login"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <input
        className="text-input small"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mailadres van de ouder"
        aria-label="e-mailadres"
        disabled={busy}
      />
      <input
        className="text-input small"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Wachtwoord"
        aria-label="wachtwoord"
        disabled={busy}
      />
      <button className="btn btn-primary btn-small" type="submit" disabled={!email.includes('@') || !password || busy}>
        Inloggen
      </button>
      {error && <p className="note">{error}</p>}
    </form>
  );
}
