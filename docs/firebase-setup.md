# Cloud-opslag instellen (Firebase)

Zonder deze stappen werkt de app gewoon, alleen zonder cloud-back-up (het paneel "Cloud-opslag" in het Ouderoverzicht meldt dan "Niet ingesteld"). Het gratis Spark-plan is genoeg.

## Eenmalig instellen

1. Ga naar console.firebase.google.com en maak een project (Google Analytics is niet nodig).
2. Projectoverzicht → web-icoon `</>` → registreer een web-app (Firebase Hosting hoef je niet aan te zetten). Kopieer de vier waarden `apiKey`, `authDomain`, `projectId` en `appId` uit de getoonde config.
3. Build → Firestore Database → "Create database", kies productiemodus en een regio in Europa. Ga daarna naar het tabblad Rules, plak de inhoud van `firestore.rules` en publiceer.
4. Build → Authentication → Get started → Sign-in method → "Email/Password" aanzetten (laat "Email link (passwordless sign-in)" uit).
5. Authentication → Users → "Add user": vul je e-mailadres en een wachtwoord in. Dit is het account waarmee je in de app inlogt. Biedt de console onder Settings → User actions de optie "Enable create (sign-up)", zet die dan uit; de app maakt nooit zelf accounts aan.
6. Zet de vier waarden in `.env.local` (staat in `.gitignore`) en in Vercel (Project Settings → Environment Variables, daarna opnieuw deployen):

   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=jouw-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=jouw-project
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

   Deze web-config is bedoeld om openbaar te zijn; de regels in `firestore.rules` beschermen de data.
7. Open de app op het apparaat van Floor → Ouderoverzicht (rekensom) → Cloud-opslag → e-mailadres en wachtwoord.

## Handmatig controleren

1. Log in via het Ouderoverzicht: de status wordt "Laatst opgeslagen hh:mm". In de Firestore-console staat onder `saves` een document met jouw uid, met de velden `json` en `updatedAt`, en daaronder `snapshots` met het document van vandaag.
2. Speel een ronde en wacht 30 seconden (of zet de app op de achtergrond): `updatedAt` in dat document wordt bijgewerkt.
3. Wis de sitegegevens van de app (of test in een privévenster) en open de app: Welcome-scherm → "Ouder? Voortgang herstellen" → rekensom → e-mail en wachtwoord. De voortgang is terug.
4. Zet het netwerk uit (devtools → Network → Offline) en speel een ronde: status "Offline, wordt later opgeslagen". Zet het netwerk weer aan: binnen een halve minuut staat het er weer in.
5. Ouderoverzicht → "Alles wissen" terwijl je bent ingelogd: het document `saves/{uid}` verdwijnt; de snapshots blijven bestaan.
6. Zet in devtools (Application → Local Storage) de waarde van `tafels-elfje-v1` op `{` en herlaad: de app start leeg, maar `tafels-elfje-v1-corrupt` bevat de oorspronkelijke tekst en `tafels-elfje-v1` is niet gewist.

## Een snapshot terugzetten

Elke dag heeft een document `saves/{uid}/snapshots/{YYYY-MM-DD}` met de laatste stand van die dag. Terugzetten:

1. Open het snapshot in de Firestore-console en kopieer de waarde van het veld `json`.
2. Plak die in een bestand `herstel.json` op het apparaat.
3. Ouderoverzicht → "Back-up terugzetten" → kies `herstel.json`. De app neemt de voortgang over en uploadt hem daarna als nieuwste stand.


## Op één apparaat inloggen

Log alleen in op het apparaat dat Floor gebruikt. Een tweede apparaat dat open blijft staan, zou "nieuwer" lijken, omdat de tijdteller de save steeds bijwerkt.

De app bewaart lokale veiligheidskopieën in localStorage:

- `tafels-elfje-v1-replaced-<tijd>` (de laatste 2): gemaakt als de cloudkopie een lokale versie met voortgang vervangt, of als de lokale versie een cloudkopie van een ander profiel vervangt (bijvoorbeeld een opnieuw aangemaakt profiel).
- `tafels-elfje-v1-corrupt`: de ruwe tekst van een onbruikbare save.

Je leest ze in de devtools van de browser (Application → Local Storage). Sla de waarde op als `.json`-bestand en zet het terug via Ouderoverzicht → "Back-up terugzetten".
