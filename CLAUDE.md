# Commande QR - Hotels et Residences

## Projet

Logiciel multi-etablissements de commande par QR code pour petits hotels et residences en Cote d'Ivoire. Un client scanne le QR de sa chambre, commande depuis son telephone, la reception recoit la commande avec sonnerie. Le systeme doit rester fiable quand le reseau est mauvais.

Promesse produit : « Vos clients commandent sans appeler, vous ne perdez plus aucune commande, meme quand le reseau est mauvais. »

## Utilisateurs

- **Client** : aucune inscription, acces par QR de chambre (connexion anonyme Firebase).
- **Receptionniste** : tableau de bord, compte technique par etablissement.
- **Gerant** : modifie menu, prix, chambres, numeros ; ne sait pas coder.
- **Super admin** (proprietaire du logiciel) : gere tous les etablissements.

## Stack

- TypeScript, Vite, PWA (`vite-plugin-pwa`).
- Firebase : Firestore, Authentication, Hosting. **Plan Spark** (gratuit, sans Cloud Functions).
- Developpement local avec la **Firebase Emulator Suite** : on ne consomme jamais le quota gratuit en developpant.
- Tests des regles de securite avec `@firebase/rules-unit-testing`.
- **Toute la donnee passe par `src/api.ts`**, une interface unique avec trois adaptateurs : `DemoAdapter` (donnees fictives), `FirebaseAdapter` (pilotes), `PostgresAdapter` (plus tard). Aucun ecran n'importe Firebase directement.
- Scripts d'administration en Node avec le SDK Admin, executes en local uniquement. La cle de service n'est jamais dans Git.

## Regles non negociables

1. **Isolation des donnees** : chaque document porte `establishment_id` ou vit dans une sous-collection d'etablissement. Les regles Firestore filtrent dessus. L'identifiant d'etablissement vient toujours du custom claim ou du slug valide, jamais d'un champ fourni librement par le client.
2. **Idempotence des commandes** : l'identifiant du document de commande est le `client_order_id` (UUID genere sur le telephone). Un renvoi apres coupure ecrase le meme document : pas de doublon.
3. **Aucune commande perdue en silence** : tout echec d'envoi est visible cote client et propose le bouton SMS/WhatsApp de secours.
4. **Simplicite d'interface** : reception = une seule page ; gerant = actions en 2 taps. Textes en francais simple, phrases courtes, verbes d'action.
5. **Legerete** : premiere page client sous 500 Ko, utilisable en 3G, sur Android d'entree de gamme et iPhone Safari.
6. **Securite** : roles et etablissement dans les custom claims, regles Firestore strictes, aucune donnee personnelle client collectee.
7. Aucun secret dans le code ni dans Git.

## Conventions

- Montants en entiers FCFA (jamais de decimales).
- Dates en UTC en base, affichage en heure locale d'Abidjan.
- Noms de code en anglais, textes visibles en francais.
- Un commit par fonctionnalite, message clair. Tests obligatoires pour les regles de securite et pour l'isolation.
- Commandes : `npm run dev`, `npm test`, `npm run emulators`, `npm run seed`, `npm run build`.

## Statuts de commande

`new` (nouvelle, sonnerie active) -> `seen` (recue par la reception, sonnerie arretee) -> `preparing` -> `delivered`.

## Phases

- **Phase 1** : pilotes, configuration faite par le super admin, variante Firebase gratuite.
- **Phase 2** : inscription autonome, Cloud Functions ou migration PostgreSQL.
