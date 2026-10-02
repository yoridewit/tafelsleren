import { describe, it, expect } from 'vitest';
import { FLOOR, LUCY, PROFILES, accountMismatch, limitsFor, activeProfile, profileById, profileForEmail, setActiveProfile } from './profiles';

describe('profiles', () => {
  it('maps e-mail addresses to children, ignoring case and spaces', () => {
    expect(profileForEmail('yoridewit@pm.me')?.id).toBe('floor');
    expect(profileForEmail('  Lucy@Tafels.nl ')?.id).toBe('lucy');
  });

  it('rejects an unknown e-mail address', () => {
    expect(profileForEmail('iemand@anders.nl')).toBeNull();
    expect(profileForEmail('')).toBeNull();
  });

  it('falls back to Floor for a missing or unknown id', () => {
    expect(profileById(undefined)).toBe(FLOOR);
    expect(profileById('xyz')).toBe(FLOOR);
    expect(profileById('lucy').name).toBe('Lucy');
  });

  it('Lucy is spoken as Lusie and has her own audio folder', () => {
    const lucy = profileById('lucy');
    expect(lucy.spokenName).toBe('Lusie');
    expect(lucy.audioDir).toBe('lucy');
    expect(FLOOR.audioDir).toBeNull();
  });

  it('keeps one profile per id and per e-mail', () => {
    expect(new Set(PROFILES.map((p) => p.id)).size).toBe(PROFILES.length);
    expect(new Set(PROFILES.map((p) => p.email)).size).toBe(PROFILES.length);
  });

  it('tracks the active profile', () => {
    expect(activeProfile()).toBe(FLOOR);
    setActiveProfile(profileById('lucy'));
    expect(activeProfile().id).toBe('lucy');
    setActiveProfile(FLOOR);
  });

  it('limitsFor uses the profile override or the default', () => {
    expect(limitsFor(LUCY, 1)).toEqual({ perRound: 2, perDay: 5 });
    expect(limitsFor(LUCY, 2)).toEqual({ perRound: 1, perDay: 2 });
    expect(limitsFor(FLOOR, 1)).toEqual({ perRound: 3, perDay: null });
    expect(limitsFor(FLOOR, 3)).toEqual({ perRound: 1, perDay: 2 });
  });

  it('accountMismatch accepts the address of the own child of the save, ignoring case and spaces', () => {
    expect(accountMismatch('yoridewit@pm.me', 'floor')).toBeNull();
    expect(accountMismatch('  Lucy@Tafels.nl ', 'lucy')).toBeNull();
  });

  it('accountMismatch refuses the address of the other child', () => {
    expect(accountMismatch('lucy@tafels.nl', 'floor')).toContain('ander kind');
    expect(accountMismatch('yoridewit@pm.me', 'lucy')).toContain('ander kind');
  });

  it('accountMismatch refuses an unknown address', () => {
    expect(accountMismatch('iemand@anders.nl', 'floor')).toContain('geen kind');
    expect(accountMismatch('', 'lucy')).toContain('geen kind');
  });
});
