import manifestJson from './data/audio-manifest.json';
import { factId, hintId, phraseText, praiseId, questionId } from './data/phrases';

let ctx: AudioContext | null = null;
let soundOn = true;
let speechOn = true;

export function setAudioPrefs(sound: boolean, speech: boolean) {
  if (soundOn === sound && speechOn === speech) return;
  soundOn = sound;
  speechOn = speech;
  if (!speech && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function getCtx(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// iPad/Safari laat pas geluid toe na een aanraking: bij de eerste tik de audio "ontgrendelen".
if (typeof window !== 'undefined')
  window.addEventListener(
    'pointerdown',
    () => {
      try {
        getCtx();
      } catch {
        // geen Web Audio
      }
    },
    { once: true },
  );

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  if (!soundOn) return;
  try {
    const ctx = getCtx();
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch {
    // geen audio beschikbaar
  }
}

export const sound = {
  tap: () => tone(620, 0, 0.06, 'triangle', 0.05),
  correct: () => {
    tone(784, 0, 0.14, 'triangle');
    tone(1047, 0.1, 0.22, 'triangle');
  },
  oops: () => {
    tone(392, 0, 0.16, 'sine', 0.08);
    tone(330, 0.14, 0.22, 'sine', 0.08);
  },
  coin: () => {
    tone(988, 0, 0.08, 'square', 0.04);
    tone(1319, 0.08, 0.2, 'square', 0.04);
  },
  fanfare: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.1));
    tone(1047, 0.5, 0.5, 'triangle', 0.1);
  },
};

const synth = (): SpeechSynthesis | null => ('speechSynthesis' in window ? window.speechSynthesis : null);
let preferredVoice: string | null = null;

const isDutch = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase().startsWith('nl');

/** Hoe natuurlijk een stem waarschijnlijk klinkt: neurale/online/premium stemmen eerst, Vlaams als laatste. */
function voiceScore(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let score = 0;
  if (/natural|neural|online/.test(n)) score += 50; // Edge / Windows: "Microsoft Fenna Online (Natural)"
  if (/premium|enhanced|verbeterd|siri/.test(n)) score += 40; // iPad/Mac met gedownloade stem
  if (/google/.test(n)) score += 30; // Chrome / Android
  if (/xander|claire|fenna|colette|maarten|ellen/.test(n)) score += 10;
  if (v.lang.replace('_', '-').toLowerCase() === 'nl-nl') score += 5;
  if (/compact|espeak/.test(n)) score -= 40;
  return score;
}

/** Nederlandse stemmen op dit apparaat, beste eerst. */
export function dutchVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  return s
    .getVoices()
    .filter(isDutch)
    .sort((a, b) => voiceScore(b) - voiceScore(a));
}

/** Stemmen worden in veel browsers pas na een tijdje geladen; roep `cb` aan zodra ze er zijn. */
export function onVoicesChanged(cb: () => void): () => void {
  const s = synth();
  if (!s) return () => {};
  s.addEventListener('voiceschanged', cb);
  return () => s.removeEventListener('voiceschanged', cb);
}

// Stemmen alvast laten laden (Chrome levert ze pas na de eerste aanvraag).
synth()?.getVoices();

export function setPreferredVoice(uri: string | null) {
  preferredVoice = uri;
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = dutchVoices();
  return voices.find((v) => v.voiceURI === preferredVoice) ?? voices[0] ?? null;
}

export function speak(text: string, force = false) {
  const s = synth();
  if ((!speechOn && !force) || !s) return;
  const voice = pickVoice();
  // Zonder Nederlandse stem zou de browser een Engelse pakken: dan liever stil.
  if (!voice) return;
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.95;
  u.pitch = 1;
  s.speak(u);
}

/* ---------- ingesproken zinnen (ElevenLabs, zie scripts/generate-audio.ts) ---------- */

const manifest = manifestJson as { voice: string | null; childName: string | null; ids: string[] };
const recorded = new Set<string>(manifest.ids);
const recordedName = manifest.childName?.toLowerCase() ?? null;
const buffers = new Map<string, Promise<AudioBuffer>>();
let current: AudioBufferSourceNode | null = null;
let playToken = 0;
let childName: string | null = null;
let talkListener: (talking: boolean) => void = () => {};

export function hasRecordedVoice(): boolean {
  return recorded.size > 0;
}

export function setChildName(name: string | null) {
  childName = name;
}

/** Laat bijv. de muziek weten wanneer het elfje praat (om zachter te gaan). */
export function onTalking(cb: (talking: boolean) => void) {
  talkListener = cb;
}

function loadBuffer(file: string): Promise<AudioBuffer> {
  let p = buffers.get(file);
  if (!p) {
    p = fetch(`/audio/${file}.mp3`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.arrayBuffer();
      })
      .then((data) => getCtx().decodeAudioData(data));
    p.catch(() => buffers.delete(file));
    buffers.set(file, p);
  }
  return p;
}

function stopTalking() {
  playToken++;
  try {
    current?.stop();
  } catch {
    // al gestopt
  }
  current = null;
  synth()?.cancel();
  talkListener(false);
}

/** Welk bestand hoort bij deze zin: de versie met naam als die voor dit kind is ingesproken. */
function recordingFor(id: string): string | null {
  if (childName && recordedName === childName.toLowerCase() && recorded.has(`${id}.n`)) return `${id}.n`;
  return recorded.has(id) ? id : null;
}

function speakAndWait(text: string): Promise<void> {
  const s = synth();
  const voice = pickVoice();
  if (!s || !voice || !text) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.95;
    u.onend = u.onerror = () => resolve();
    s.speak(u);
  });
}

async function playOne(id: string, token: number) {
  const file = recordingFor(id);
  if (file) {
    try {
      const buffer = await loadBuffer(file);
      if (token !== playToken) return;
      await new Promise<void>((resolve) => {
        const c = getCtx();
        const src = c.createBufferSource();
        src.buffer = buffer;
        src.connect(c.destination);
        src.onended = () => resolve();
        current = src;
        src.start();
      });
      return;
    } catch {
      // geen opname beschikbaar: dan de stem van het apparaat
    }
  }
  if (token === playToken) await speakAndWait(phraseText(id, childName));
}

/**
 * Zegt één of meer zinnen na elkaar: de ingesproken opname als die er is, anders de stem van het apparaat.
 * Een nieuwe `say` onderbreekt wat er nog gezegd werd.
 */
export function say(ids: string | string[], force = false) {
  if (!speechOn && !force) return;
  stopTalking();
  const token = playToken;
  const list = Array.isArray(ids) ? ids : [ids];
  // Alles alvast laden, zodat er geen stilte valt tussen de zinnen.
  for (const id of list) {
    const file = recordingFor(id);
    if (file) loadBuffer(file).catch(() => {});
  }
  talkListener(true);
  void (async () => {
    for (const id of list) {
      if (token !== playToken) return;
      await playOne(id, token);
    }
    if (token === playToken) talkListener(false);
  })();
}

const saidThisSession = new Set<string>();

/** Zegt iets maar één keer per keer dat de app open is (bijv. het welkomstpraatje op de kaart). */
export function sayOnce(key: string, ids: string | string[]) {
  if (saidThisSession.has(key)) return;
  saidThisSession.add(key);
  say(ids);
}

/** "7 × 6" hardop: "7 keer 6". */
export function sayQuestion(a: number, b: number) {
  say(questionId(a, b));
}

/** "3 keer 7 is 21." */
export function sayFact(a: number, b: number) {
  say(factId(a, b));
}

export function sayPraise(index: number) {
  say(praiseId(index));
}

/** Na een fout: "Bijna! Kijk maar." en dan de uitleg van de strategie. */
export function sayHint(a: number, b: number) {
  say(['bijna', hintId(a, b)]);
}
