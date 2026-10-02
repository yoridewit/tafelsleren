import { defaultLimits, type IslandLimits } from '../logic/round';

export type { IslandLimits };

/**
 * De kinderen die de app gebruiken. Elk kind heeft een eigen apparaat en een eigen account (e-mailadres);
 * dat adres bepaalt het profiel. Een nieuw kind toevoegen = hier een profiel bijzetten.
 */
export type ProfileId = 'floor' | 'lucy';

export interface ChildProfile {
  id: ProfileId;
  email: string;
  /** Zoals het in tekst staat. */
  name: string;
  /** Zoals het hardop gezegd wordt (ElevenLabs en de stem van het apparaat). */
  spokenName: string;
  /** Submap van public/audio met de zinnen die de naam bevatten; null = de gedeelde opnames. */
  audioDir: string | null;
  /** Eilanden die bij het aanmaken van de save al volledig gekend zijn. */
  knownIslands: number[];
  /** Afwijkingen van de standaardlimieten (zie `defaultLimits` in logic/round.ts), per eiland. */
  newFacts: Partial<Record<number, IslandLimits>>;
}

export const FLOOR: ChildProfile = {
  id: 'floor',
  email: 'yoridewit@pm.me',
  name: 'Floor',
  spokenName: 'Floor',
  audioDir: null,
  knownIslands: [],
  newFacts: {},
};

export const LUCY: ChildProfile = {
  id: 'lucy',
  email: 'lucy@tafels.nl',
  name: 'Lucy',
  spokenName: 'Lusie',
  audioDir: 'lucy',
  knownIslands: [0],
  newFacts: { 1: { perRound: 2, perDay: 5 } },
};

export const PROFILES: ChildProfile[] = [FLOOR, LUCY];

export function profileById(id: unknown): ChildProfile {
  return PROFILES.find((p) => p.id === id) ?? FLOOR;
}

export function profileForEmail(email: string): ChildProfile | null {
  const e = email.trim().toLowerCase();
  return PROFILES.find((p) => p.email === e) ?? null;
}

let active: ChildProfile = FLOOR;

/** Het kind dat nu speelt; tekst (`phraseText`) en audio lezen dit. Idempotent. */
export function setActiveProfile(p: ChildProfile) {
  active = p;
}

export function activeProfile(): ChildProfile {
  return active;
}

export function limitsFor(profile: ChildProfile, island: number): IslandLimits {
  return profile.newFacts[island] ?? defaultLimits(island);
}
