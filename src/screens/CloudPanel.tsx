import { CloudLogin } from '../components/CloudLogin';
import { useCloud } from '../cloud/CloudProvider';
import { statusText } from '../cloud/statusText';

export function CloudPanel() {
  const cloud = useCloud();
  return (
    <section className="panel">
      <h2>Cloud-opslag</h2>
      <p className="muted">
        Bewaart de voortgang ook buiten dit apparaat, zodat een gewist of vervangen apparaat geen voortgang kost.
      </p>
      <p className="note">{statusText(cloud.status)}</p>
      {!cloud.configured ? (
        <p className="muted">Instellen? Zie docs/firebase-setup.md.</p>
      ) : cloud.signedIn ? (
        <button className="btn btn-white btn-small" onClick={() => void cloud.signOut()}>
          Uitloggen
        </button>
      ) : (
        <CloudLogin />
      )}
    </section>
  );
}
