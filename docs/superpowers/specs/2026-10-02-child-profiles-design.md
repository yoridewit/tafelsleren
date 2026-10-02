# Kindprofielen (Floor en Lucy), tijdtimer en sterren-fix

Datum: 2026-10-02

## Doel

Een tweede kind, Lucy (uitgesproken "Lusie"), kan op een eigen apparaat dezelfde app gebruiken, met haar eigen naam
in tekst en gesproken zinnen, een eigen startstand en eigen regels voor nieuwe sommen. Daarnaast: een kleine
tijdtimer op de schermen buiten het sommen beantwoorden, een standaard tijdslimiet van 10 minuten voor nieuwe
profielen, en een fix voor de sterren die na elke som getoond worden.

Buiten bereik: wisselen tussen kinderen op één apparaat. Elk kind heeft een eigen apparaat en een eigen
Firebase-account.

## 1. Profielen

`src/data/profiles.ts`:

```ts
interface ChildProfile {
  id: 'floor' | 'lucy';
  email: string;            // het Firebase-account dat bij dit kind hoort
  name: string;             // in tekst
  spokenName: string;       // in de audio ("Lusie")
  audioDir: string | null;  // submap voor de zinnen met de naam; null = gedeelde map
  knownIslands: number[];   // eilanden die bij het aanmaken al volledig gekend zijn
  newFacts: Record<number, { perRound: number; perDay: number | null }>; // per eiland, zie 3; ontbrekend = standaard
}
```

- Floor: `yoridewit@pm.me`. Lucy: `lucy@tafels.nl`. Een ander e-mailadres hoort bij geen profiel: de login wordt
  geweigerd met "Dit account hoort bij geen kind" en er wordt weer uitgelogd.
- `SaveData` krijgt `profileId`. Oude saves zonder dit veld gelden als Floor. `parseSave` valideert het veld.
- Een nieuwe save voor een profiel wordt gemaakt met `emptySave(elfName, profile)`; zie 2.

## 2. Inlogscherm en startstand

- Een apparaat zonder save opent op een inlogscherm (e-mail + wachtwoord). Onder de knop staat "Zonder account
  beginnen", wat het huidige welkomstscherm voor Floor opent (profiel Floor, zoals nu).
- Na een geslaagde login zoekt de bestaande sync (`SyncEngine.start`) de cloudsave. Bestaat die, dan wordt hij
  teruggezet (profielnaam volgt uit `profileId` in de save). Bestaat die niet, dan toont de app het welkomstscherm
  met de naam van het profiel ("Hoi Lucy!") en laat het kind een naam voor het elfje kiezen.
- Lucy's startstand: tafel 1 en 10 zijn gekend (box 5, `fastDays` van 2 dagen zodat `isKnown` waar is, geen
  `introduced`, zodat ze niet meetellen voor de daglimiet), `unlocked` bevat eiland 0 en 1, `discovered` bevat 0.
- Een ingelogd apparaat blijft ingelogd (Firebase-persistentie), zoals nu.

## 3. Regels voor nieuwe sommen

`round.ts` krijgt de limieten uit het profiel in plaats van vaste constanten:

| | per ronde | per dag |
|---|---|---|
| Floor, eiland 0 en 1 | 3 | geen |
| Floor, vanaf eiland 2 | 1 | 2 |
| Lucy, eiland 0 | klaar (alles gekend) | |
| Lucy, eiland 1 (tafel 2) | 2 | 5 |
| Lucy, vanaf eiland 2 | 1 | 2 |

De grens voor sommen die nog in aanleren staan (`learningCapForIsland`) blijft gelden. Daardoor krijgt Lucy alleen
meer nieuwe sommen als ze ook vooruitgang maakt. De allereerste ronde van een profiel zonder geoefende sommen
blijft 4 nieuwe sommen.

## 4. Naam in tekst en audio

- `CHILD_NAME` verdwijnt. Teksten met de naam (`phraseText`, welkomstscherm) gebruiken de naam van het profiel.
- De 6 zinnen met de naam (`welkom-1`, `home-0`, `home-1`, `res-top`, `res-goed`, `res-knap`) worden gesproken
  met `spokenName`. Voor Lucy komen ze in `public/audio/lucy/<id>.mp3`; `audio.ts` kiest de map via het profiel.
  Ontbreekt een bestand, dan gedraagt de app zich zoals nu bij een ontbrekende zin.
- `scripts/generate-audio.ts` krijgt `--child <id>`: dat maakt alleen de naamzinnen voor dat kind. De gebruiker
  voert dat uit (ElevenLabs-key nodig); de implementatie levert het script en de teksten.

## 5. Tijdtimer en standaardlimiet

- `emptySave` zet `dailyLimitMinutes` op 10. Bestaande saves behouden hun instelling.
- Een kleine timer (`TimeChip`) toont de resterende speeltijd van vandaag (`limiet − minutesToday`, naar boven afgerond in hele minuten, bijv. "7 min"; de tijd wordt maar elke 20 seconden bijgewerkt, dus een seconde-teller zou springen).
  Hij staat linksboven, in de `TopBar` naast de terugknop, en op het startscherm in de eigen kop. Geen limiet
  ingesteld: geen timer. Tijd op: toont `0 min`.
- Niet op de schermen waar sommen beantwoord worden: `RoundScreen` en `SpeedGame`.
- De tijd komt uit `timeByDay`, dat al elke seconde bijgehouden wordt; het chipje herrekent elke paar seconden.

## 6. Sterren

Sterren worden pas aan het einde van de ronde bijgeschreven, als totaal. Dat zag Floor niet: ze zag tijdens de ronde
bij elk goed antwoord "+1", en vanaf de vierde ronde van de dag kreeg ze maar een kwart van het totaal (`roundReward`),
dus het eindbedrag leek veel te laag.

- Het "+1" per som verdwijnt uit `RoundScreen`. Tijdens de ronde worden geen sterren getoond.
- Het eindscherm toont het totaal groot ("+21 sterren") met eronder een korte opbouw: "10 goed · ronde af +6 ·
  eerste ronde van de dag +5". In een ronde met de verlaagde opbrengst staat er "Extra ronde: een kwart van de
  sterren" bij.
- De afrondingsbonus gaat van 3 naar 6 (`STARS.roundDone`). De bonus voor de eerste ronde van de dag (5) en de
  kwartregel vanaf de vierde ronde van de dag blijven zoals ze zijn.

## Testen

Unit-tests: profiel uit e-mailadres, `parseSave` met en zonder `profileId`, Lucy's startstand (alle sommen van
eiland 0 gekend, eiland 1 open), de limieten per ronde en per dag per profiel, `roundReward` met 6 en de opbouw van het eindbedrag, de resterende
tijd voor de timer. Daarna de inlogstroom en de timer in de browser nagelopen.

## Bekende beperkingen

- Een nieuw profiel toevoegen vraagt een code-aanpassing (de profielenlijst).
- Er zijn geen automatische tests voor React-componenten (testomgeving `node`); schermen worden in de browser
  gecontroleerd.
