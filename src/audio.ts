let ctx: AudioContext | null = null;
let soundOn = true;
let speechOn = true;

export function setAudioPrefs(sound: boolean, speech: boolean) {
  soundOn = sound;
  speechOn = speech;
  if (!speech && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  if (!soundOn) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
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

/** "7 × 6" hardop: "7 keer 6". */
export function sayQuestion(a: number, b: number) {
  speak(`${a} keer ${b}`);
}
