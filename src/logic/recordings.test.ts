import { describe, it, expect } from 'vitest';
import { recordingFile, type AudioManifest } from './recordings';
import { FLOOR, LUCY } from '../data/profiles';

const manifest: AudioManifest = {
  voice: 'v',
  ids: ['bijna', 'home-0', 'd-2-3'],
  children: { lucy: ['home-0'] },
};

describe('recordingFile', () => {
  it('uses the shared recording for lines without a name', () => {
    expect(recordingFile('bijna', FLOOR, manifest)).toBe('bijna');
    expect(recordingFile('bijna', LUCY, manifest)).toBe('bijna');
  });

  it('uses the shared recording of a name line for Floor', () => {
    expect(recordingFile('home-0', FLOOR, manifest)).toBe('home-0');
  });

  it('uses the child’s own recording of a name line when it exists', () => {
    expect(recordingFile('home-0', LUCY, manifest)).toBe('lucy/home-0');
  });

  it('has no recording of a name line for a child that has none yet (device voice speaks it)', () => {
    expect(recordingFile('home-1', LUCY, manifest)).toBeNull();
    expect(recordingFile('home-0', LUCY, { voice: null, ids: ['home-0'] })).toBeNull();
  });

  it('has no recording for unknown ids', () => {
    expect(recordingFile('nope', FLOOR, manifest)).toBeNull();
  });
});
