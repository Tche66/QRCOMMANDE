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

## Prochaine etape : F-J3 (PWA client)

### Objectif
Construire la PWA client : le QR ouvre le menu, le client commande depuis son telephone, meme hors ligne.

### Ce qu'il faut faire (du plan technique F-J3)
1. Route `/:slug/r/:token` : le QR ouvre directement le menu avec la chambre identifiee
2. Connexion anonyme Firebase automatique au chargement
3. Menu par categories avec prix FCFA, mention "indisponible"
4. Panier : quantites, note libre, total
5. Envoi de commande : l'ID du document = UUID genere sur le telephone (idempotence)
6. Cache persistant Firestore (`persistentLocalCache`)
7. Etat selon `hasPendingWrites` : "non envoyee" / "recue" / "en preparation" / "livree"
8. Bouton de secours SMS avec numero reception (tester `?body=` et `&body=` pour iOS)
9. Identite visuelle (nom, couleur) lue depuis l'etablissement
10. Premiere page < 500 Ko
11. Service worker via vite-plugin-pwa

### Criteres d'acceptation F-J3
- Commande en mode avion puis reseau retabli : arrive une seule fois
- La meme commande envoyee deux fois ne cree qu'un document
- Le statut change en direct
- Page < 500 Ko au premier chargement

### Dependances a installer pour F-J3
- `preact` (UI legere)
- `@preact/preset-vite`
- `vite-plugin-pwa` + `workbox-*`
- `idb-keyval` (optionnel, le cache Firestore suffit peut-etre)

## Etapes futures (apres F-J3)

### F-J4 : Tableau de bord reception
- Connexion compte reception
- Liste commandes en temps reel (onSnapshot)
- Sonnerie repetee tant que commande est "new"
- 3 boutons de statut
- Indicateur connecte/hors ligne
- Wake Lock
- Recalcul total avec prix actuels (alerte ecart)

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
