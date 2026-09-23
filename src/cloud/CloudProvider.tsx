import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { keepReplaced } from '../logic/storage';
import { useStore } from '../state/store';
import * as auth from './auth';
import { cloudConfigured } from './client';
import { firestoreStore } from './store';
import { SyncEngine, type StartOutcome, type SyncStatus } from './sync';

interface Cloud {
  configured: boolean;
  signedIn: boolean;
  status: SyncStatus;
  /** Logt in en synchroniseert meteen; geeft terug wat er met de voortgang gebeurde. */
  signIn(email: string, password: string): Promise<StartOutcome>;
  signOut(): Promise<void>;
  /** Verwijdert de cloudkopie (bij "Alles wissen"). Doet niets als er niet is ingelogd; gooit bij een fout. */
  removeRemote(): Promise<void>;
}

const CloudContext = createContext<Cloud | null>(null);

export function CloudProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useStore();
  const [signedIn, setSignedIn] = useState(false);
  const [status, setStatus] = useState<SyncStatus>(cloudConfigured ? { kind: 'signedOut' } : { kind: 'off' });

  const saveRef = useRef(state.save);
  saveRef.current = state.save;

  const engine = useMemo(
    () =>
      new SyncEngine({
        store: firestoreStore,
        getLocal: () => saveRef.current,
        restore: (data) => dispatch({ type: 'restore', data }),
        keepReplaced: (save) => keepReplaced(save),
        onStatus: setStatus,
        isOnline: () => navigator.onLine,
      }),
    [dispatch],
  );

  useEffect(() => {
    if (!cloudConfigured) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    auth
      .onAuthChange(setSignedIn)
      .then((stop) => {
        if (cancelled) stop();
        else unsubscribe = stop;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!cloudConfigured) return;
    if (signedIn) void engine.start();
    else {
      engine.stop();
      setStatus({ kind: 'signedOut' });
    }
  }, [signedIn, engine]);

  useEffect(() => () => engine.stop(), [engine]);

  useEffect(() => {
    if (signedIn) engine.notifyChanged();
  }, [state.save, signedIn, engine]);

  useEffect(() => {
    if (!signedIn) return;
    const flush = () => void engine.flush();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('online', flush);
    };
  }, [signedIn, engine]);

  const value = useMemo<Cloud>(
    () => ({
      configured: cloudConfigured,
      signedIn,
      status,
      async signIn(email, password) {
        await auth.signIn(email, password);
        return engine.start();
      },
      async signOut() {
        engine.stop();
        await auth.signOut();
      },
      async removeRemote() {
        if (signedIn) await engine.removeRemote();
      },
    }),
    [signedIn, status, engine],
  );

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud(): Cloud {
  const c = useContext(CloudContext);
  if (!c) throw new Error('useCloud buiten CloudProvider');
  return c;
}
