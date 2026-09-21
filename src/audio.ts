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

let dutchVoice: SpeechSynthesisVoice | null | undefined;

export function speak(text: string) {
  if (!speechOn || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  if (dutchVoice === undefined || dutchVoice === null) {
    const voices = synth.getVoices();
    dutchVoice = voices.find((v) => v.lang === 'nl-NL') ?? voices.find((v) => v.lang.startsWith('nl')) ?? null;
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'nl-NL';
  if (dutchVoice) u.voice = dutchVoice;
  u.rate = 0.9;
  u.pitch = 1.1;
  synth.speak(u);
}

/** "7 × 6" hardop: "7 keer 6". */
export function sayQuestion(a: number, b: number) {
  speak(`${a} keer ${b}`);
}
