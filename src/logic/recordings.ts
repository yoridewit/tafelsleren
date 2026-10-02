import type { ChildProfile } from '../data/profiles';
import { nameLineIds } from '../data/phrases';

export interface AudioManifest {
  voice: string | null;
  /** Gedeelde opnames in public/audio/. */
  ids: string[];
  /** Per kind (profiel-id) de opnames van zinnen met de naam, in public/audio/<audioDir>/. */
  children?: Record<string, string[]>;
}

/**
 * Welk geluidsbestand (zonder .mp3) bij deze zin hoort, of null als er geen opname is
 * (dan leest de stem van het apparaat de zin voor).
 */
export function recordingFile(id: string, profile: ChildProfile, manifest: AudioManifest): string | null {
  if (profile.audioDir && nameLineIds().includes(id))
    return manifest.children?.[profile.id]?.includes(id) ? `${profile.audioDir}/${id}` : null;
  return manifest.ids.includes(id) ? id : null;
}
