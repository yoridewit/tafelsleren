# Tafels met het elfje

Een web-app (PWA) voor de tablet waarmee een kind uit groep 4 de tafels 1 t/m 10 uit het hoofd leert, samen met een elfje dat ze kan aankleden.

## Hoe het leert

- **Volgorde:** tafel 1 en 10 → 2 → 5 → 3 → 4 → 6 → 7 → 8 → 9, als eilanden in een toverbos.
- **Strategieën eerst:** ankers 1×, 2×, 5× en 10×, daarna "rondom de 5" (6× = 5× + 1×), "rond de 10" (9× = 10× − 1×) en verdubbelen.
- **Omdraaien:** 3×7 en 7×3 zijn één som. Latere tafels hebben daardoor weinig nieuwe sommen.
- **Herhaling met tussenpozen:** een Leitner-systeem per som (hooguit één doos omhoog per dag). Een som geldt als "gekend" als hij op minstens 2 verschillende dagen binnen 4 seconden goed was.
- **Door elkaar oefenen:** nieuwe sommen worden gemengd met herhaling. Een fout antwoord laat een hint zien en de som komt later in de ronde terug.
- **Geen zichtbare tijdsdruk** in de oefenrondes; alleen het vrijwillige snelspel heeft een klok.

## Ontwikkelen

```bash
npm install
npm run dev      # lokale server
npm test         # unit-tests van de leerlogica
npm run build    # productie-build naar dist/
```

De leerlogica staat in `src/logic/` (zonder UI, met tests), de state in `src/state/`, de schermen in `src/screens/`.

## Natuurlijke stem (ElevenLabs)

De app leest sommen, uitleg en complimentjes voor met ingesproken mp3's uit `public/audio/`. Zonder opname valt hij terug op de Nederlandse stem van het apparaat.

1. Maak een API-sleutel op elevenlabs.io (Profile → API Keys).
2. Zet hem in een bestand `.env.local` in de projectmap (dat bestand gaat niet naar GitHub):
   ```
   ELEVENLABS_API_KEY=sk_...
   # optioneel een andere stem, zie: npm run audio -- --voices
   # ELEVENLABS_VOICE_ID=...
   ```
3. Probeer eerst een paar zinnen: `npm run audio -- --only=test,q-7-6,d-6-7`, en luister naar `public/audio/`.
4. Tevreden? Maak de rest: `npm run audio` (ongeveer 210 zinnen, samen minder dan 5.000 tekens: past in het gratis plan).
5. Commit en push `public/audio/` en `src/data/audio-manifest.json`.

Andere stem gekozen? Draai `npm run audio -- --force` om alles opnieuw in te spreken.

## Deploy

Vercel herkent het project als Vite: build `npm run build`, output `dist`. Elke push naar `main` wordt automatisch gedeployed.

## Privacy

Alle voortgang staat alleen in de browser van het apparaat (localStorage). Via het ouderdeel kun je een back-up downloaden en terugzetten.
