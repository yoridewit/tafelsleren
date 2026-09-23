import { getFirebase } from './client';

export async function signIn(email: string, password: string): Promise<void> {
  const { auth } = await getFirebase();
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut(): Promise<void> {
  const { auth } = await getFirebase();
  const { signOut: firebaseSignOut } = await import('firebase/auth');
  await firebaseSignOut(auth);
}

/** Meldt de huidige stand zodra die bekend is en daarna elke wijziging. Geeft een stopfunctie terug. */
export async function onAuthChange(cb: (signedIn: boolean) => void): Promise<() => void> {
  const { auth } = await getFirebase();
  const { onAuthStateChanged } = await import('firebase/auth');
  return onAuthStateChanged(auth, (user) => cb(user !== null));
}
