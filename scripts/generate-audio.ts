/**
 * Spreekt alle zinnetjes uit src/data/phrases.ts in via ElevenLabs en zet ze in public/audio/.
 * Zet je sleutel in .env.local (staat in .gitignore):  ELEVENLABS_API_KEY=sk_...
 *
 *   npm run audio                          # alleen ontbrekende zinnen
 *   npm run audio -- --only=test,q-7-6     # een paar om de stem te proberen
 *   npm run audio -- --force               # alles opnieuw (bijv. na een andere stem)
 *   npm run audio -- --voices              # toon de stemmen in je account
 *
 * Optioneel in .env.local: ELEVENLABS_VOICE_ID (standaard: Sarah), ELEVENLABS_MODEL
 * (standaard: eleven_multilingual_v2) en CHILD_NAME (dan komen er ook zinnen met die naam bij).
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { phrasesToRecord } from '../src/data/phrases';

const API = 'https://api.elevenlabs.io/v1';
const OUT_DIR = join(import.meta.dirname, '..', 'public', 'audio');
const MANIFEST = join(import.meta.dirname, '..', 'src', 'data', 'audio-manifest.json');

try {
  process.loadEnvFile(join(import.meta.dirname, '..', '.env.local'));
} catch {
  // geen .env.local: dan uit de omgeving
}

const key = process.env.ELEVENLABS_API_KEY;
const childName = process.env.CHILD_NAME?.trim() || null;
const PHRASES = phrasesToRecord(childName);
const voiceId = process.env.ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL';
const model = process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2';
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',');

if (!key) {
  console.error('Zet eerst je sleutel in .env.local:  ELEVENLABS_API_KEY=sk_...');
  process.exit(1);
}

async function listVoices() {
  const res = await fetch(`${API}/voices`, { headers: { 'xi-api-key': key! } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const { voices } = (await res.json()) as { voices: { voice_id: string; name: string; labels?: Record<string, string> }[] };
  for (const v of voices) console.log(`${v.voice_id}  ${v.name}  ${Object.values(v.labels ?? {}).join(', ')}`);
}

async function tts(text: string): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': key!, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true },
      }),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if ((res.status === 409 || res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise((r) => setTimeout(r, attempt * 2000));
      continue;
    }
    throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  }
}

function writeManifest() {
  const ids = readdirSync(OUT_DIR)
    .filter((f) => f.endsWith('.mp3'))
    .map((f) => f.slice(0, -4))
    .filter((id) => id in PHRASES)
    .sort();
  writeFileSync(MANIFEST, JSON.stringify({ voice: voiceId, childName, ids }, null, 2) + '\n');
  return ids.length;
}

let done = 0;

async function main() {
  if (args.includes('--voices')) return listVoices();
  mkdirSync(OUT_DIR, { recursive: true });
  const todo = Object.entries(PHRASES).filter(
    ([id]) => (!only || only.includes(id)) && (force || !existsSync(join(OUT_DIR, `${id}.mp3`))),
  );
  const chars = todo.reduce((n, [, t]) => n + t.length, 0);
  console.log(`${todo.length} zinnen (${chars} tekens) met stem ${voiceId}, model ${model}`);
  // Twee tegelijk: snel genoeg, en binnen de limiet van het gratis plan.
  const queue = [...todo];
  await Promise.all(
    [0, 1].map(async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const [id, text] = item;
        writeFileSync(join(OUT_DIR, `${id}.mp3`), await tts(text));
        done++;
        process.stdout.write(`\r${done}/${todo.length} ${id.padEnd(10)}`);
      }
    }),
  );
  console.log(`\nKlaar. ${writeManifest()} opnames in de app.`);
}

main().catch((e) => {
  try {
    writeManifest();
  } catch {
    // map bestaat nog niet
  }
  console.error(`\n${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
