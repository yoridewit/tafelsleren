import { getCtx } from './audio';

/**
 * Achtergrondmuziek voor de menu's. Loopt via Web Audio (GainNode), omdat iPad/Safari het volume van een
 * <audio>-element negeert; zo kunnen we zacht spelen, in- en uitfaden en zachter gaan als het elfje praat.
 */
const TRACKS = ['menu_music', 'menu_music_2', 'menu_music_3', 'menu_music_4', 'menu_music_5'].map(
  (t) => `/audio/${t}.mp3`,
);
const VOLUME = 0.3;
const DUCKED = 0.08;
const FADE_S = 0.8;

let el: HTMLAudioElement | null = null;
let gain: GainNode | null = null;
let track = Math.floor(Math.random() * TRACKS.length);
let enabled = true;
let wanted = false;
let ducked = false;
let unlocked = false;
let pauseTimer: ReturnType<typeof setTimeout> | undefined;

function setup(): boolean {
  if (el && gain) return true;
  try {
    const ctx = getCtx();
    el = new Audio(TRACKS[track]);
    el.preload = 'auto';
    el.addEventListener('ended', () => {
      track = (track + 1) % TRACKS.length;
      el!.src = TRACKS[track];
      void el!.play().catch(() => {});
    });
    gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
    return true;
  } catch {
    return false;
  }
}

function rampTo(target: number) {
  if (!gain) return;
  const now = getCtx().currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(target, now + FADE_S);
}

function apply() {
  const shouldPlay = enabled && wanted && unlocked && !document.hidden;
  if (shouldPlay) {
    if (!setup() || !el) return;
    clearTimeout(pauseTimer);
    if (el.paused) void el.play().catch(() => {});
    rampTo(ducked ? DUCKED : VOLUME);
  } else if (el && !el.paused) {
    rampTo(0);
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => el?.pause(), FADE_S * 1000 + 50);
  }
}

/** Aan/uit (instelling). */
export function setMusicEnabled(on: boolean) {
  if (enabled === on) return;
  enabled = on;
  apply();
}

/** Of het huidige scherm muziek wil (menu's wel, oefenen niet). */
export function setMusicWanted(on: boolean) {
  if (wanted === on) return;
  wanted = on;
  apply();
}

/** Zachter terwijl het elfje praat. */
export function duckMusic(on: boolean) {
  ducked = on;
  if (el && !el.paused) rampTo(on ? DUCKED : VOLUME);
}

if (typeof window !== 'undefined') {
  // Browsers (zeker iPad) laten pas geluid toe na een aanraking.
  const unlock = () => {
    unlocked = true;
    apply();
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  document.addEventListener('visibilitychange', apply);
}
