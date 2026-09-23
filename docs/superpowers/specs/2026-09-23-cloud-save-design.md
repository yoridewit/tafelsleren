# Cloud-opslag met Supabase: ontwerp

Datum: 2026-09-23

## Aanleiding

De voortgang van Floor staat alleen in `localStorage` (`tafels-elfje-v1`). Op 2026-09-22 kon de opgeslagen data niet goed geladen worden en moest ze opnieuw beginnen. Twee oorzaken zijn bekend uit de code:

1. Er is geen kopie buiten het apparaat. Wissen of corrupt raken van de browserdata betekent alle voortgang kwijt.
2. `loadSave` geeft `null` bij elke mislukte parse, en het effect in `state/store.tsx` roept dan meteen `writeSave(null)` aan, waardoor de mogelijk nog herstelbare tekst definitief wordt verwijderd.

## Doel

- Voortgang overleeft het wissen van de browserdata, een nieuw apparaat en een corrupte lokale opslag.
- De app blijft offline bruikbaar en Floor merkt niets van de cloud.
- Zonder Supabase-configuratie werkt de app precies zoals nu.

## Buiten scope

- Gelijktijdig gebruik op meerdere apparaten en het samenvoegen van data per som of per dag. Uitgangspunt is één apparaat; bij een conflict wint de nieuwste, met een lokale back-up van de verliezer.
- Een scherm om snapshots terug te zetten. Dat gaat handmatig via het Supabase-dashboard.
- Meerdere kinderen of profielen.
- Andere inlogmethodes dan de e-mailcode.

## Gekozen aanpak

Eén JSON-snapshot per gebruiker in één tabel. Lokaal blijft leidend en werkt offline; de cloud is een vangnet dat op de achtergrond synchroniseert. Verworpen: genormaliseerde tabellen (te veel werk voor één apparaat) en de cloud als bron van waarheid (breekt offline gebruik).

## Database (`supabase/schema.sql`)

- `saves`: `user_id uuid primary key references auth.users on delete cascade`, `data jsonb not null`, `updated_at timestamptz not null`.
- `save_snapshots`: `user_id uuid references auth.users on delete cascade`, `day date`, `data jsonb not null`, primary key `(user_id, day)`.
- Row Level Security aan op beide tabellen. Op `saves` mag een gebruiker alleen de eigen rij selecteren, invoegen, bijwerken en verwijderen. Op `save_snapshots` alleen selecteren.
- Een `security definer`-trigger op `saves` (before update) bewaart de oude `data` als snapshot voor de huidige dag met `on conflict do nothing`. Zo bevat de snapshot van een dag de toestand vóór de eerste wijziging van die dag. De trigger verwijdert snapshots ouder dan 14 dagen.
- De anon key staat in de client en is bedoeld om openbaar te zijn. RLS is de beveiliging.

## Inloggen

- E-mailcode van 6 cijfers via `signInWithOtp` en `verifyOtp({ type: 'email' })`. Geen magic link, want op iOS opent een link in Safari en niet in de geïnstalleerde app (aparte opslag).
- Supabase-instellingen: Email-provider aan, e-mailsjabloon "Magic Link" aangepast zodat het `{{ .Token }}` toont, en na het aanmaken van het eigen account "Allow new users to sign up" uit. De client gebruikt dan `shouldCreateUser: false`, zodat vreemden geen accounts kunnen aanmaken.
- Inloggen gebeurt in het Ouderoverzicht (achter de rekensom) en in het herstelpad op het Welcome-scherm.
- De sessie wordt door `supabase-js` in `localStorage` bewaard. Na een wis van de browserdata is dus opnieuw één code nodig; dat is het herstelpad.

## Datamodel in de client

- `SaveData` krijgt `updatedAt: string` (ISO). `parseSave` vult een ontbrekende waarde met `createdAt`.
- Een reducer-wrapper in `store.tsx` zet `updatedAt` op de huidige tijd bij elke actie die `save` verandert, behalve bij de nieuwe actie `restore`. `restore` zet de meegegeven `SaveData` ongewijzigd, met de `updatedAt` uit de cloud, zodat een herstelde save niet meteen als "nieuwer" terug wordt geüpload. De bestaande `reducer` blijft puur en zijn tests ongewijzigd.
- `isPristine(save)`: `roundsDone === 0`, geen enkele som met `seen > 0`, `stars === 0` en `owned` leeg. Dit beschermt tegen een per ongeluk nieuw aangemaakt profiel op een gewist apparaat.

## Synchronisatie (`src/cloud/sync.ts`)

Pure beslisfunctie `decide(local, remote)`, in deze volgorde:

1. Remote ontbreekt en local ontbreekt: `none`.
2. Remote ontbreekt: `push`.
3. Local ontbreekt of local is pristine terwijl remote dat niet is: `restore` (remote overnemen).
4. Remote is pristine terwijl local dat niet is: `push`.
5. Beide hebben voortgang: de nieuwste `updatedAt` wint. Gelijk: `none`. Remote nieuwer: `restore` en de lokale versie wordt eerst bewaard onder `tafels-elfje-v1-replaced-<iso>` (maximaal de laatste 2 blijven bestaan).

Remote data gaat altijd eerst door `parseSave`. Geeft dat `null`, dan wordt remote genegeerd en lokaal niet overschreven; de status toont een fout.

Orkestratie tegen een klein interface `CloudStore { pull(): Promise<{ data: unknown; updatedAt: string } | null>; push(data: SaveData): Promise<void>; remove(): Promise<void> }`:

- Bij opstarten met een sessie of direct na inloggen: eerst `pull` en `decide`, en pas daarna wordt pushen ingeschakeld. Dat voorkomt dat een vers lokaal profiel de cloudkopie overschrijft voordat is gekeken.
- Daarna: push met een throttle van maximaal één keer per 30 seconden zolang er niet-gepushte wijzigingen zijn. Een throttle en geen debounce, want de tijdteller verandert de save elke 20 seconden en een debounce zou nooit afgaan.
- Extra push direct bij `visibilitychange` naar hidden en bij `pagehide`.
- Bij een fout of offline: `dirty` blijft staan en er wordt opnieuw geprobeerd bij het `online`-event en bij de volgende throttle-tik. Fouten worden nooit aan Floor getoond.
- "Alles wissen": verwijdert lokaal en, als er is ingelogd, ook de cloudrij via `remove()`. Snapshots blijven 14 dagen.
- Terugzetten van een back-upbestand telt als een gewone wijziging (nieuwe `updatedAt`) en wordt dus gepusht.

## Lokaal vangnet (los van Supabase)

- `loadSave`: bij aanwezige maar onbruikbare data wordt de ruwe tekst bewaard onder `tafels-elfje-v1-corrupt` (niet overschreven als daar al iets staat) en wordt `null` teruggegeven.
- `StoreProvider` verwijdert `tafels-elfje-v1` alleen bij een overgang van een bestaande save naar `null` (expliciete reset), nooit bij een initiële `null`.

## UI

- Ouderoverzicht, nieuw paneel "Cloud-opslag" met een statusregel: "Niet ingesteld" (geen env-variabelen), "Niet ingelogd", "Laatst opgeslagen 14:32", "Offline, wordt later opgeslagen" of "Opslaan mislukt, wordt opnieuw geprobeerd". Verder een e-mailveld en codeveld om in te loggen en een knop om uit te loggen.
- Welcome-scherm: een klein "Ouder? Voortgang herstellen". Dat opent de rekensom, daarna e-mail en code. Bij succes en een gevonden remote save volgt `restore` en gaat de app naar de kaart. Is er geen remote save, dan staat er "Geen opgeslagen voortgang gevonden" en blijft het profiel-aanmaken beschikbaar.
- Floor ziet in het kinderdeel niets van dit alles.

## Bestanden

- Nieuw: `src/cloud/client.ts` (lazy `import('@supabase/supabase-js')`, leest `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY`, geeft `null` als die ontbreken), `src/cloud/sync.ts`, `src/cloud/store.ts` (echte `CloudStore` op Supabase), `supabase/schema.sql`, `docs/supabase-setup.md`.
- Gewijzigd: `logic/storage.ts` (`updatedAt`, corrupt-vangnet), `state/reducer.ts` (actie `restore`), `state/store.tsx` (wrapper, verwijderregel, sync starten), `screens/Parent.tsx`, `screens/Welcome.tsx`, `data/phrases.ts` alleen als er gesproken tekst bij komt (niet gepland).
- Nieuwe dependency: `@supabase/supabase-js`, lazy geladen zodat de eerste load van de app niet zwaarder wordt.

## Tests

- Unit tests op `decide` voor alle vijf regels, inclusief pristine-gevallen en gelijke tijdstempels.
- Orkestratie met een fake `CloudStore`: eerst pull en dan pas push, throttle, opnieuw proberen na een fout, `restore` zonder terug-push, en verwijderen bij reset.
- `parseSave` voor `updatedAt` en `loadSave` voor het corrupt-vangnet met een fake storage.
- Reducer-wrapper: stempelt bij wijziging, niet bij `restore`, niet bij een ongewijzigde save.
- Geen tests tegen een echt Supabase-project. Handmatige controle met jouw project staat in `docs/supabase-setup.md`.

## Opzet door de gebruiker

1. Supabase-project maken.
2. `supabase/schema.sql` uitvoeren in de SQL-editor.
3. Email-auth aan, sjabloon met `{{ .Token }}`, eigen account aanmaken en daarna nieuwe aanmeldingen uitzetten.
4. `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` in `.env.local` en in de Vercel-projectinstellingen.
5. In het Ouderoverzicht inloggen op het apparaat van Floor.
