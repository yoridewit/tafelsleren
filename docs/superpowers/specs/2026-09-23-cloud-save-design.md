# Cloud-opslag met Firebase: ontwerp

Datum: 2026-09-23 (bijgewerkt: Firebase in plaats van Supabase, want het gratis Supabase-projectlimiet is bereikt en gratis projecten worden na een week zonder gebruik gepauzeerd)

## Aanleiding

De voortgang van Floor staat alleen in `localStorage` (`tafels-elfje-v1`). Op 2026-09-22 kon de opgeslagen data niet goed geladen worden en moest ze opnieuw beginnen. Twee oorzaken zijn bekend uit de code:

1. Er is geen kopie buiten het apparaat. Wissen of corrupt raken van de browserdata betekent alle voortgang kwijt.
2. `loadSave` geeft `null` bij elke mislukte parse, en het effect in `state/store.tsx` roept dan meteen `writeSave(null)` aan, waardoor de mogelijk nog herstelbare tekst definitief wordt verwijderd.

## Doel

- Voortgang overleeft het wissen van de browserdata, een nieuw apparaat en een corrupte lokale opslag.
- De app blijft offline bruikbaar en Floor merkt niets van de cloud.
- Zonder Firebase-configuratie werkt de app precies zoals nu.

## Buiten scope

- Gelijktijdig gebruik op meerdere apparaten en het samenvoegen van data per som of per dag. Uitgangspunt is één apparaat; bij een conflict wint de nieuwste, met een lokale back-up van de verliezer.
- Een scherm om snapshots terug te zetten. Dat gaat handmatig via de Firebase-console.
- Meerdere kinderen of profielen.
- Andere inlogmethodes dan e-mail en wachtwoord.
- Opruimen van oude snapshots (één document van enkele tientallen KB per dag, ruim binnen de gratis limiet).

## Gekozen aanpak

Eén document per gebruiker in Firestore met de hele save als JSON-tekst. Lokaal blijft leidend en werkt offline; de cloud is een vangnet dat op de achtergrond synchroniseert. Verworpen: genormaliseerde documenten (te veel werk voor één apparaat), de cloud als bron van waarheid (breekt offline gebruik), GitHub als opslag (token in de browser, lastig herstelpad) en Supabase (projectlimiet en pauzeren).

## Firestore (`firestore.rules`)

- Document `saves/{uid}` met twee velden: `json` (de save als JSON-tekst) en `updatedAt` (ISO-tekst, alleen zodat het in de console leesbaar is; de bron van waarheid is `updatedAt` in de JSON). Een tekstveld voorkomt gedoe met Firestore-typebeperkingen (geen `undefined`, geen geneste arrays, veldnaamregels) en blijft ver onder de 1 MiB-grens.
- Subcollectie `saves/{uid}/snapshots/{YYYY-MM-DD}` met dezelfde twee velden. Elke push schrijft in dezelfde batch het hoofddocument en het snapshot van de huidige (lokale) dag, dus per dag blijft de laatste stand bewaard. Er zijn geen server-triggers (Cloud Functions vragen het betaalde plan).
- Beveiligingsregels: alleen een ingelogde gebruiker mag `saves/{uid}` en `saves/{uid}/snapshots/*` lezen en schrijven, en alleen als `request.auth.uid == uid`.
- De web-config van Firebase staat in de client en is bedoeld om openbaar te zijn. De regels zijn de beveiliging.

## Inloggen

- E-mail en wachtwoord via `signInWithEmailAndPassword`. Het account wordt door de ouder in de Firebase-console aangemaakt (Authentication → Users → Add user). De client roept nooit `createUserWithEmailAndPassword` aan; wie op een andere manier toch een account zou maken, krijgt door de regels alleen toegang tot een eigen leeg document.
- Geen e-maillink en geen e-mailcode: een link opent op iOS in Safari en niet in de geïnstalleerde app (aparte opslag), en Firebase Auth kent geen ingebouwde code.
- Inloggen gebeurt in het Ouderoverzicht (achter de rekensom) en in het herstelpad op het Welcome-scherm.
- De sessie wordt door Firebase Auth in de browseropslag bewaard. Na een wis van de browserdata moet het wachtwoord dus opnieuw ingevoerd worden; dat is het herstelpad.

## Datamodel in de client

- `SaveData` krijgt `updatedAt: string` (ISO). `parseSave` vult een ontbrekende of ongeldige waarde met `createdAt`.
- Een reducer-wrapper (`stampedReducer`, in `state/reducer.ts` en gebruikt door `store.tsx`) zet `updatedAt` op de huidige tijd bij elke actie die `save` verandert, behalve bij de nieuwe actie `restore`. `restore` zet de meegegeven `SaveData` ongewijzigd, met de `updatedAt` uit de cloud, zodat een herstelde save niet meteen als "nieuwer" terug wordt geüpload. De bestaande `reducer` blijft puur en zijn tests ongewijzigd.
- `isPristine(save)`: `roundsDone === 0`, geen enkele som met `seen > 0`, `stars === 0` en `owned` leeg. Dit beschermt tegen een per ongeluk nieuw aangemaakt profiel op een gewist apparaat.

## Synchronisatie (`src/cloud/decide.ts`, `src/cloud/sync.ts`)

Pure beslisfunctie `decide(local, remote)`, in deze volgorde:

1. Remote ontbreekt en local ontbreekt: `none`.
2. Remote ontbreekt: `push`.
3. Local ontbreekt of local is pristine terwijl remote dat niet is: `restore` (remote overnemen).
4. Remote is pristine terwijl local dat niet is: `push`.
5. Beide zijn pristine: `none`.
6. Beide hebben voortgang: de nieuwste `updatedAt` wint. Gelijk: `none`. Remote nieuwer: `restore` en de lokale versie wordt eerst bewaard onder `tafels-elfje-v1-replaced-<iso>` (maximaal de laatste 2 blijven bestaan).

Remote data gaat altijd eerst door `parseSave`. Geeft dat `null`, dan wordt remote genegeerd en lokaal niet overschreven; de status toont een fout.

Orkestratie tegen een klein interface `CloudStore { pull(): Promise<unknown | null>; push(data: SaveData): Promise<void>; remove(): Promise<void> }`. `pull` geeft alleen de ruwe, uit de JSON-tekst geparste save; het tijdstip zit erin als `updatedAt`, zodat er één bron van waarheid is:

- Bij opstarten met een sessie of direct na inloggen: eerst `pull` en `decide`, en pas daarna wordt pushen ingeschakeld. Dat voorkomt dat een vers lokaal profiel de cloudkopie overschrijft voordat is gekeken.
- Daarna: push met een throttle van maximaal één keer per 30 seconden zolang er niet-gepushte wijzigingen zijn. Een throttle en geen debounce, want de tijdteller verandert de save elke 20 seconden en een debounce zou nooit afgaan.
- Extra push direct bij `visibilitychange` naar hidden en bij `pagehide`.
- Bij een fout of offline: de engine blijft "vuil" en probeert opnieuw bij het `online`-event en bij de volgende throttle-tik. Fouten worden nooit aan Floor getoond.
- "Alles wissen": verwijdert lokaal en, als er is ingelogd, ook `saves/{uid}` via `remove()`. Lukt dat niet, dan wordt er niet gewist en toont het Ouderoverzicht een melding. De snapshots blijven bewaard.
- Terugzetten van een back-upbestand telt als een gewone wijziging (nieuwe `updatedAt`) en wordt dus gepusht.

### Offline-gedrag van de Firestore-adapter

Firestore zet schrijfacties offline in een wachtrij en laat de belofte openstaan tot er verbinding is. De adapter (`src/cloud/store.ts`) moet daarom een mislukte offline schrijfactie zichtbaar maken: hij gooit meteen als `navigator.onLine` onwaar is (er wordt dan niets in de wachtrij gezet) en breekt een schrijfactie af met een time-out van 15 seconden. Een dan toch in de wachtrij achtergebleven schrijfactie is onschadelijk, want Firestore past ze in volgorde toe, dus de laatste push wint.

## Lokaal vangnet (los van Firebase)

- `loadSave`: bij aanwezige maar onbruikbare data wordt de ruwe tekst bewaard onder `tafels-elfje-v1-corrupt` (niet overschreven als daar al iets staat) en wordt `null` teruggegeven.
- `StoreProvider` verwijdert `tafels-elfje-v1` alleen bij een overgang van een bestaande save naar `null` (expliciete reset), nooit bij een initiële `null`.

## UI

- Ouderoverzicht, nieuw paneel "Cloud-opslag" met een statusregel: "Niet ingesteld" (geen env-variabelen), "Niet ingelogd", "Laatst opgeslagen 14:32", "Offline, wordt later opgeslagen" of "Opslaan mislukt, wordt opnieuw geprobeerd". Verder een e-mail- en wachtwoordveld om in te loggen en een knop om uit te loggen.
- Welcome-scherm: een klein "Ouder? Voortgang herstellen". Dat opent de rekensom, daarna e-mail en wachtwoord. Bij succes en een gevonden remote save volgt `restore` en gaat de app naar de kaart. Is er geen remote save, dan staat er "Geen opgeslagen voortgang gevonden" en blijft het profiel-aanmaken beschikbaar.
- Floor ziet in het kinderdeel niets van dit alles.

## Bestanden

- Nieuw: `src/cloud/decide.ts`, `src/cloud/sync.ts`, `src/cloud/client.ts` (lazy `import('firebase/app')`, `firebase/auth` en `firebase/firestore`; leest `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` en `VITE_FIREBASE_APP_ID`; staat uit als er een ontbreekt), `src/cloud/auth.ts`, `src/cloud/store.ts` (echte `CloudStore` op Firestore), `src/cloud/statusText.ts`, `src/cloud/CloudProvider.tsx`, `src/components/CloudLogin.tsx`, `src/components/MathGate.tsx`, `src/screens/CloudPanel.tsx`, `firestore.rules`, `docs/firebase-setup.md`.
- Gewijzigd: `logic/storage.ts` (`updatedAt`, corrupt-vangnet, replaced-back-ups), `state/reducer.ts` (actie `restore`, `stampedReducer`), `state/store.tsx`, `screens/Parent.tsx`, `screens/ParentGate.tsx`, `screens/Welcome.tsx`, `main.tsx`, `README.md`.
- Nieuwe dependency: `firebase`, alleen lazy geladen zodat de eerste load van de app niet zwaarder wordt.

## Tests

- Unit tests op `decide` voor alle zes regels, inclusief pristine-gevallen en gelijke tijdstempels.
- Orkestratie met een fake `CloudStore`: eerst pull en dan pas push, throttle, opnieuw proberen na een fout, `restore` zonder terug-push, en verwijderen bij reset.
- `parseSave` voor `updatedAt` en `loadSave` voor het corrupt-vangnet met een fake storage.
- Reducer-wrapper: stempelt bij wijziging, niet bij `restore`, niet bij een ongewijzigde save.
- De Firestore-adapter krijgt zijn offline- en time-outgedrag in een kleine hulpfunctie die zonder Firebase te testen is; verder geen tests tegen een echt Firebase-project. Handmatige controle met jouw project staat in `docs/firebase-setup.md`.

## Opzet door de gebruiker

1. Firebase-project maken (gratis Spark-plan) en een web-app toevoegen.
2. Firestore Database aanmaken (productiemodus) en de inhoud van `firestore.rules` bij Rules plakken en publiceren.
3. Authentication: "E-mail/wachtwoord" aanzetten en je eigen account toevoegen (Authentication → Users → Add user).
4. De vier `VITE_FIREBASE_*`-waarden uit de web-app-config in `.env.local` en in de Vercel-projectinstellingen zetten.
5. In het Ouderoverzicht inloggen op het apparaat van Floor.
