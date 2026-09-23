import { dayKey } from '../logic/dates';
import type { SaveData } from '../logic/storage';
import { getFirebase } from './client';
import { guardWrite } from './guard';
import type { CloudStore } from './sync';

async function uid(): Promise<string> {
  const { auth } = await getFirebase();
  if (!auth.currentUser) throw new Error('Niet ingelogd');
  return auth.currentUser.uid;
}

const online = () => navigator.onLine;

/**
 * Dunne adapter op Firestore (zie firestore.rules): `saves/{uid}` met de save als JSON-tekst, en per push een
 * snapshot `saves/{uid}/snapshots/{dag}` in dezelfde batch.
 */
export const firestoreStore: CloudStore = {
  async pull() {
    const { db } = await getFirebase();
    const { doc, getDocFromServer } = await import('firebase/firestore');
    const snap = await getDocFromServer(doc(db, 'saves', await uid()));
    if (!snap.exists()) return null;
    return JSON.parse(String(snap.data().json));
  },
  async push(save: SaveData) {
    const { db } = await getFirebase();
    const { doc, writeBatch } = await import('firebase/firestore');
    const id = await uid();
    const fields = { json: JSON.stringify(save), updatedAt: save.updatedAt };
    await guardWrite(
      () => {
        const batch = writeBatch(db);
        batch.set(doc(db, 'saves', id), fields);
        batch.set(doc(db, 'saves', id, 'snapshots', dayKey()), fields);
        return batch.commit();
      },
      { online },
    );
  },
  async remove() {
    const { db } = await getFirebase();
    const { doc, deleteDoc } = await import('firebase/firestore');
    const id = await uid();
    await guardWrite(() => deleteDoc(doc(db, 'saves', id)), { online });
  },
};
