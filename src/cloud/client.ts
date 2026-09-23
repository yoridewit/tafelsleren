import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** Zonder alle vier de variabelen doet de app niets met de cloud en werkt hij precies als voorheen. */
export const cloudConfigured = Object.values(config).every(Boolean);

export interface Firebase {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let firebase: Promise<Firebase> | null = null;

/** Laadt de Firebase-SDK pas als het nodig is, zodat de eerste load van de app niet zwaarder wordt. */
export function getFirebase(): Promise<Firebase> {
  if (!cloudConfigured) return Promise.reject(new Error('Cloud-opslag is niet ingesteld'));
  firebase ??= Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]).then(
    ([{ initializeApp }, { getAuth }, { getFirestore }]) => {
      const app = initializeApp(config as { apiKey: string; authDomain: string; projectId: string; appId: string });
      return { app, auth: getAuth(app), db: getFirestore(app) };
    },
  ).catch((e) => {
    // Een mislukte load (bijv. een chunk die niet binnenkomt) mag niet blijven hangen: de volgende aanroep probeert het opnieuw.
    firebase = null;
    throw e;
  });
  return firebase;
}
