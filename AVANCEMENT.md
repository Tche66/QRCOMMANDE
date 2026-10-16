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

## Prochaine etape : F-J4 (Tableau de bord reception)

### Objectif
Construire le tableau de bord que la reception utilise pour recevoir et traiter les commandes.

### Ce qu'il faut faire (du plan technique F-J4)
1. Connexion par compte reception (email/password)
2. Liste commandes du jour en temps reel (onSnapshot, limit 100)
3. Sonnerie forte repetee toutes les 3s tant qu'une commande est "new"
4. Bouton "Activer le son" (geste utilisateur requis par les navigateurs)
5. 3 boutons de statut : Recu, En preparation, Livre
6. Indicateur "Connecte / Hors ligne"
7. Wake Lock API (ecran toujours allume)
8. Recalcul du total avec les prix actuels du menu (alerte si ecart)

### Criteres d'acceptation F-J4
- Commande apparait en < 3 secondes
- Sonnerie ne s'arrete qu'au passage a "seen"
- Si onSnapshot tombe, l'interrogation prend le relais
- Un receptionniste d'un autre etablissement ne voit pas ces commandes

## Etapes futures (apres F-J4)

### F-J5 : Espace gerant + super admin
- Modifier prix, disponibilite, articles, categories
- Numeros de reception/alerte
- Liste etablissements pour super admin
- Tests de droits gerant

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
