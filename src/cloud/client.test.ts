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
});
