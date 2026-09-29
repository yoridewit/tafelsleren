import { afterEach, describe, expect, it, vi } from 'vitest';

const KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function load(values: Record<string, string>) {
  for (const k of KEYS) vi.stubEnv(k, values[k] ?? '');
  vi.resetModules();
  return import('./client');
}

describe('cloud client', () => {
  it('staat uit zonder omgevingsvariabelen en weigert Firebase te laden', async () => {
    const { cloudConfigured, getFirebase } = await load({});
    expect(cloudConfigured).toBe(false);
    await expect(getFirebase()).rejects.toThrow('niet ingesteld');
  });

  it('staat uit als er één variabele ontbreekt', async () => {
    const { cloudConfigured } = await load({
      VITE_FIREBASE_API_KEY: 'k',
      VITE_FIREBASE_AUTH_DOMAIN: 'd',
      VITE_FIREBASE_PROJECT_ID: 'p',
    });
    expect(cloudConfigured).toBe(false);
  });

  it('staat aan met alle vier de variabelen', async () => {
    const { cloudConfigured } = await load({
      VITE_FIREBASE_API_KEY: 'k',
      VITE_FIREBASE_AUTH_DOMAIN: 'd',
      VITE_FIREBASE_PROJECT_ID: 'p',
      VITE_FIREBASE_APP_ID: 'a',
    });
    expect(cloudConfigured).toBe(true);
  });

  it('probeert het laden opnieuw nadat een SDK-onderdeel één keer is mislukt', async () => {
    let appCalls = 0;
    vi.doMock('firebase/app', () => {
      appCalls += 1;
      if (appCalls === 1) throw new Error('chunk kon niet laden');
      return { initializeApp: () => ({}) };
    });
    vi.doMock('firebase/auth', () => ({ getAuth: () => ({}) }));
    vi.doMock('firebase/firestore', () => ({ initializeFirestore: () => ({}) }));
    try {
      const { getFirebase } = await load({
        VITE_FIREBASE_API_KEY: 'k',
        VITE_FIREBASE_AUTH_DOMAIN: 'd',
        VITE_FIREBASE_PROJECT_ID: 'p',
        VITE_FIREBASE_APP_ID: 'a',
      });
      await expect(getFirebase()).rejects.toThrow();
      await expect(getFirebase()).resolves.toMatchObject({ app: {}, auth: {}, db: {} });
    } finally {
      vi.doUnmock('firebase/app');
      vi.doUnmock('firebase/auth');
      vi.doUnmock('firebase/firestore');
    }
  });

  it('zet Firestore op long-polling, want streaming lukt niet overal (bijv. Safari op een iPad)', async () => {
    const app = { naam: 'app' };
    const initializeFirestore = vi.fn(() => ({}));
    vi.doMock('firebase/app', () => ({ initializeApp: () => app }));
    vi.doMock('firebase/auth', () => ({ getAuth: () => ({}) }));
    vi.doMock('firebase/firestore', () => ({ initializeFirestore }));
    try {
      const { getFirebase } = await load({
        VITE_FIREBASE_API_KEY: 'k',
        VITE_FIREBASE_AUTH_DOMAIN: 'd',
        VITE_FIREBASE_PROJECT_ID: 'p',
        VITE_FIREBASE_APP_ID: 'a',
      });
      await getFirebase();
      expect(initializeFirestore).toHaveBeenCalledWith(app, { experimentalForceLongPolling: true });
    } finally {
      vi.doUnmock('firebase/app');
      vi.doUnmock('firebase/auth');
      vi.doUnmock('firebase/firestore');
    }
  });
});
