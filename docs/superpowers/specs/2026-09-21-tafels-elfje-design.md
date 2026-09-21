# Tafels leren met het elfje — ontwerp

Datum: 2026-09-21

## Doel

Een web-app waarmee een meisje van 8 (groep 4) op een leuke, wetenschappelijk onderbouwde manier de tafels 1 t/m 10 uit haar hoofd leert vóór het einde van het schooljaar (~9 maanden).

## Randvoorwaarden

- Primair apparaat: tablet (touch, landscape en portrait). Groot on-screen cijfertoetsenbord.
- Voortgang alleen lokaal (localStorage). Geen accounts, geen server, geen kinddata online.
- Back-up export/import (JSON-bestand) in het ouderdeel.
- Taal: Nederlands.
- Hosting: GitHub `yoridewit/tafelsleren` → Vercel (auto-deploy bij push).
- Deelsommen: niet in v1; datamodel zo opzetten dat een deel-modus later per tafel aan kan.

## Techniek

- Vite + React + TypeScript, als PWA (installeerbaar, offline) via `vite-plugin-pwa`.
- Leerlogica (pure TS-modules, unit-getest met Vitest) gescheiden van UI.
- Mascotte en items als inline SVG (eigen tekeningen, gelaagd).
- Geluid: Web Audio-piepjes (geen bestanden). Voorlezen: `speechSynthesis` met `nl-NL`, uitschakelbaar.

## Didactiek

### Volgorde tafels (eilanden)
1 & 10 → 2 → 5 → 3 → 4 → 6 → 7 → 8 → 9.

### Feiten en omdraaien
- Een feit is een ongeordend paar {a,b} met a,b ∈ 1..10 (55 feiten). 3×7 en 7×3 delen één feit-status.
- De vraag wordt in beide richtingen gesteld; de "tafel van n" toont n als tweede factor (Nederlandse conventie: 3 × 7 = "3 keer 7" in de tafel van 7).
- Bij het openen van een tafel wordt getoond hoeveel feiten al gekend zijn via andere tafels.

### Status per feit (Leitner, dozen 0–5)
- `box 0` = nieuw (nog niet geïntroduceerd), 1–5 = geoefend.
- Goed en snel (≤ 4 s) → box +1. Goed maar traag → box blijft (min 1). Fout → box 1.
- Herhaal-interval per box (dagen): 1:0, 2:1, 3:2, 4:4, 5:7.
- **Gekend** = box ≥ 4 én snel goed beantwoord op ≥ 2 verschillende dagen.
- Weergave-status: nieuw (box 0), oefenen (1–2), bijna (3 of ≥4 zonder 2 dagen), gekend.

### Tafel-beheersing
Een tafel is beheerst wanneer alle 10 feiten van die tafel "bijna" of "gekend" zijn en ≥ 8 "gekend". Dan gaat het volgende eiland open. De ouder kan eilanden handmatig vrijgeven.

### Fases per tafel
1. **Ontdekken** (eenmalig per tafel, ~1 min): groepjes-visualisatie (n bloemen per pot) en sprongen op de getallenlijn; de ankers 1×, 2×, 5×, 10× van die tafel.
2. **Oefenronde** (~10 sommen): mix van nieuwe feiten (max 3 per ronde, in schoolvolgorde: 1×, 2×, 10×, 5×, dan rondom 5 (4×, 6×), rond 10 (9×), dubbel (3×→ via 2×+1×, 8× via dubbel 4×), 7×), plus herhaling van eerder geoefende feiten die "due" zijn, aangevuld met willekeurige bekende. Verhouding ≈ 1 nieuw : 2–3 bekend.
3. Fout → strategie-hint + visuele groepjes, correct antwoord laten intypen, en het feit komt later in dezelfde ronde terug.

### Strategie-hints (voor a × n)
- a=1: "1 keer n is gewoon n."
- a=2: "Dubbel n."
- a=10: "n met een nul erachter."
- a=5: "Half van 10 × n."
- a=4: "Dubbel van 2 × n", of "5 × n min n".
- a=6: "5 × n plus n."
- a=9: "10 × n min n."
- a=3: "2 × n plus n."
- a=8: "Dubbel van 4 × n", of "10 × n min 2 × n".
- a=7: "5 × n plus 2 × n."
Hint kiest de variant met de ankers die al gekend zijn waar mogelijk.

### Geen stress
- Geen zichtbare aftelklok in oefenrondes; reactietijd wordt stil gemeten.
- **Snelspel** (vrij te spelen zodra ≥ 10 feiten gekend): 60 seconden, alleen gekende feiten, record verbeteren.
- Positieve, korte feedback; bij fout nooit rood kruis-scherm, wel "Bijna! Kijk maar…".

## Gamificatie

- **Kaart**: toverbos met 9 eilanden (1&10, 2, 5, 3, 4, 6, 7, 8, 9) + voortgangsbalk per eiland.
- **Sterren**: +1 per goed antwoord, +3 bonus per voltooide ronde, +5 voor de eerste ronde van de dag.
- **Winkel**: items voor het elfje in categorieën hoed, sjaal, vleugels, toverstaf, huisdier, achtergrond. Prijzen 10–80 sterren. Aantrekken/uitdoen in de kledingkast.
- **Stickers**: album; sticker per beheerste tafel + mijlpalen (eerste ronde, 3/5/10/25/50 oefendagen, 10/25/55 feiten gekend, snelspel-records).
- **Dagreeks**: telt oefendagen; 1 gemiste dag breekt de reeks niet (2 wel).
- Dagelijkse suggestie: "2 rondes per dag is genoeg". Na 3 rondes op één dag: vriendelijke "Goed gedaan! Morgen verder?" (wel doorgaan mogelijk, geen extra dag-bonus).
- Bij eerste start: naam van het kind en naam voor het elfje kiezen.

## Ouderdeel

- Poort: een vermenigvuldiging van twee getallen tussen 12 en 19.
- 10×10 raster met status-kleuren per feit; oefendagen-overzicht (laatste 8 weken); totalen.
- Instellingen: eiland vrijgeven, geluid aan/uit, voorlezen aan/uit, naam wijzigen.
- Back-up exporteren/importeren (JSON), alles resetten (met bevestiging).
- Tips voor oefenen buiten de app en de aanbevolen planning (5 min/dag, 5 dagen/week, ~3–4 weken per tafel).

## Opslag

Eén localStorage-key `tafels-elfje-v1` met een geversioneerd JSON-object: profiel, feit-statussen, sterren, items (bezit + aan), stickers, oefendagen, instellingen, records. Laden valideert en valt terug op leeg profiel bij corrupte data.

## Testen

- Vitest voor: feiten/omdraaien, Leitner-updates, "gekend"-regel, rondesamenstelling, hints, tafel-beheersing, dagreeks, sterren, opslag-migratie/validatie.
- Handmatige doorloop in de browser in tabletformaat vóór oplevering.
