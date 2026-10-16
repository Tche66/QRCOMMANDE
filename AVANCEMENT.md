# Commande QR - Avancement du developpement

> Ce document est lu automatiquement par Claude Code a chaque nouvelle session.
> Il permet de reprendre le travail exactement la ou on s'est arrete.

## Projet

Logiciel de commande par QR code pour hotels/residences en Cote d'Ivoire.
Porteur : Doukoua TSA.
Repo : https://github.com/Tche66/QRCOMMANDE.git
Dossier : `C:\Users\hp\Documents\HOTEL QR\commande-qr\`
Cahier des charges : `C:\Users\hp\Documents\HOTEL QR\Cahier_des_charges_Commande_QR_Hotel.pdf`
Plan technique : `C:\Users\hp\Documents\HOTEL QR\PLAN_CLAUDE_CODE_Commande_QR (1).md`

## Stack

- TypeScript + Vite + PWA
- Firebase : Firestore, Auth, Hosting (plan Spark gratuit, pas de Cloud Functions)
- Couche `src/api.ts` avec adaptateurs (DemoAdapter, FirebaseAdapter)
- firebase-tools v13 (Java 17 sur cette machine, v15 exige Java 21)
- Tests : Vitest + @firebase/rules-unit-testing
- Scripts admin : Firebase Admin SDK + qrcode + pdfkit

## Environnement

- Node v24.21.0 / npm 11.19.0
- Java 17 (firebase-tools downgrade a v13 pour compatibilite)
- Windows 10, shell bash
- Les tests se lancent avec : `npm test` (utilise `firebase emulators:exec`)
- Les scripts admin se lancent avec : `npm run admin:create`, `admin:list`, `admin:suspend`

## Etapes completees

### F-J1 : Socle projet (FAIT - commit 59ed44a)
- [x] Projet Vite + TypeScript + Firebase
- [x] Couche api.ts avec DemoAdapter et FirebaseAdapter
- [x] Types TypeScript (Establishment, Room, Order, etc.)
- [x] Regles de securite Firestore (F.5 du plan) + regle idempotence client
- [x] 55 tests de regles (isolation, roles, idempotence) - TOUS PASSENT
- [x] Script de seed pour emulateurs
- [x] CLAUDE.md a la racine
- [x] Build Vite OK

### F-J2 : Scripts admin (FAIT - commit a850c3b)
- [x] `scripts/admin-config.ts` : init Firebase Admin SDK (emulateur/production)
- [x] `scripts/template-menu.ts` : menu type CI reutilisable (3 categories, 8 articles)
- [x] `scripts/create-establishment.ts` : creation complete (Firestore + Auth + claims + menu + chambres + audit + PDF QR)
- [x] `scripts/generate-qr-pdf.ts` : PDF A4, 4 QR par page, numero chambre en gros
- [x] `scripts/list-establishments.ts` : liste des etablissements
- [x] `scripts/suspend-establishment.ts` : suspension/reactivation + audit log
- [x] Teste : 20 chambres creees en ~20s, PDF genere, list OK, suspend OK
- [x] 55 tests toujours verts

### F-J3 : PWA Client (FAIT)
- [x] Preact + vite-plugin-pwa installes
- [x] vite.config.ts avec Preact preset + PWA (service worker, manifest)
- [x] firebase.ts avec persistentLocalCache (menu offline)
- [x] Router minimaliste (/:slug/r/:token)
- [x] ClientApp.tsx : orchestration (resolve token, load menu, auth anonyme, commande)
- [x] MenuPage.tsx : categories, articles, panier flottant, note libre, total FCFA
- [x] OrderStatus.tsx : suivi temps reel (hasPendingWrites), etats new/seen/preparing/delivered
- [x] SmsButton.tsx : bouton secours SMS + WhatsApp (iOS/Android)
- [x] Header.tsx : nom etablissement + chambre + couleur theme
- [x] styles.css : mobile-first, touch-friendly, police systeme
- [x] auth.ts : connexion anonyme Firebase
- [x] order-helpers.ts : generateOrderId, formatFcfa, buildSmsUrl, buildWhatsAppUrl
- [x] Build : 174 Ko gzip (largement sous 500 Ko)
- [x] 55 tests F-J1 toujours verts

### F-J4 : Tableau de bord reception (FAIT)
- [x] Route /:slug/reception avec login par PIN
- [x] Dashboard.tsx : liste commandes temps reel, separation actives/livrees
- [x] OrderCard.tsx : chambre, articles, total, note, boutons statut (Recu/En prep/Livre)
- [x] SoundManager.tsx : sonnerie Web Audio 800Hz toutes les 3s, bouton Activer le son
- [x] ConnectionStatus.tsx : indicateur Connecte/Hors ligne
- [x] WakeLock.tsx : ecran toujours allume (Wake Lock API)
- [x] Recalcul total avec prix actuels du menu, alerte si ecart
- [x] ReceptionApp.tsx : orchestration login → resolve slug → dashboard
- [x] DemoAdapter : commandes simulees toutes les 15s pour tester sans emulateur
- [x] Build : ~178 Ko gzip (dashboard charge en lazy import)
- [x] 55 tests F-J1 toujours verts

### F-J5 : Espace gerant + super admin (FAIT)
- [x] Route /:slug/admin avec login gerant
- [x] MenuEditor : categories editables, articles avec toggle dispo, prix inline, ajout/suppression
- [x] ItemRow : nom/prix editables au tap, toggle dispo/masque en 2 taps
- [x] CategorySection : nom editable, ajout article, suppression avec confirmation
- [x] SettingsPage : numeros reception/gerant editables
- [x] DayHistory : stats du jour (commandes, livrees, total FCFA), liste commandes
- [x] Route /super-admin avec login super admin
- [x] EstablishmentList : liste, statut, bouton suspendre/reactiver
- [x] api.ts : ajout updateEstablishment, listEstablishments, getDayOrders
- [x] Build OK, tous modules en lazy import
- [x] 55 tests toujours verts

## Prochaine etape : F-J6 (Deploiement pilote)

### F-J6 : Deploiement pilote
- Firebase Hosting
- Procedure creation etablissement
- Mini-guides (gerant + receptionniste)
- Checklist installation sur place
- Suivi hebdomadaire quotas

## Notes techniques importantes

- `firebase-tools` v13 car Java 17 (penser a upgrader Java 21 pour v15)
- Les regles Firestore autorisent le client a re-ecrire sa commande (idempotence) tant que status='new' et meme clientUid
- Les prix ne sont PAS valides cote regles (pas de Cloud Functions en gratuit) → la reception recalcule et affiche un avertissement si ecart
- Aucun composant n'importe Firebase directement, tout passe par api.ts
- Montants toujours en entiers FCFA, jamais de decimales
- `emulators:exec` repart d'une base vide a chaque fois (pas de persistance)
