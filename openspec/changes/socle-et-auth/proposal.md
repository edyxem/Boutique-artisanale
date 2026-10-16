# Proposition : socle et authentification de Flowering

## Why

Toutes les fonctionnalités de la boutique (catalogue, panier, commande, espaces vendeur et admin) ont besoin du même socle : une fausse API avec des données d'exemple, des modèles typés, une navigation commune et une authentification par rôle. Ce changement pose ce socle, dans le design déjà intégré par `design-template`, pour que les deux changements suivants (`parcours-achat`, `vendeur-et-admin`) n'aient plus qu'à ajouter des écrans.

## What Changes

- Fausse API json-server + json-server-auth lancée par un petit serveur qui ajoute les règles des comptes : inscription limitée au rôle client, refus des comptes désactivés, mot de passe jamais renvoyé.
- `db.json` : 10 produits, 4 catégories, 2 vendeurs validés, 4 utilisateurs (1 admin, 1 client, 2 vendeurs), aucune commande ; produits, univers et ateliers repris du template avec ses photos.
- Modèles TypeScript : `Utilisateur`, `Vendeur`, `Categorie`, `Produit`, `Commande` (avec `LigneCommande` et `AdresseLivraison`).
- Script `npm run dev` qui lance l'API et Angular ensemble.
- Navigation : liens de l'en-tête du template selon le rôle (« Boutique », « Nos artisans », « Espace vendeur », « Admin »), bouton de compte (« Connexion » ou prénom), accueil `/` et une route chargée à la demande par section, page introuvable.
- Authentification : page du template à onglets « Connexion » / « Créer un compte », inscription client, connexion, espace client avec « Se déconnecter », `AuthService` à base de signals, session gardée dans le navigateur, intercepteur de jeton, guards `authGuard` / `vendeurGuard` / `adminGuard`, retour à la page demandée après connexion, page « Accès refusé ».

## Rôles concernés

- **Visiteur** : navigation, inscription, connexion, redirection vers la connexion depuis une page protégée.
- **Client** : connexion, espace client, déconnexion, accès à `/compte` et `/commande`, accès refusé à `/vendeur` et `/admin`.
- **Vendeur** : connexion, déconnexion, accès à `/vendeur`, accès refusé à `/admin`.
- **Administrateur** : connexion, déconnexion, accès à `/admin`, accès refusé à `/vendeur`.
- **Développeurs** : scripts, API simulée, modèles.

## Hors périmètre

- Paiement en ligne, envoi d'e-mails, mot de passe oublié, connexion via un fournisseur externe.
- Téléversement d'images : les produits utilisent les photos de `design-template/images/`.
- Apparence et composants d'interface : fournis par `design-template`.
- Écrans métier : accueil, catalogue, panier, commandes (`parcours-achat`) ; espace vendeur, demande « Devenir vendeur » et administration (`vendeur-et-admin`). Ce changement ne livre que des pages provisoires pour ces sections.
- Permissions fines par ressource dans l'API simulée : complétées par les changements suivants.
- Rafraîchissement du jeton : à expiration (1 h), l'utilisateur se reconnecte.

## Capabilities

### New Capabilities

- `donnees` : API simulée (ressources, lancement, protection des mots de passe), jeu de données d'exemple issu du template et modèles des entités.
- `auth` : layout et navigation de l'application, inscription, connexion, espace client et déconnexion, session, jeton joint aux requêtes, règles d'accès aux sections par rôle.

### Modified Capabilities

Aucune.

## Impact

- **Ordre** : appliqué après `design-template`, avant `parcours-achat`.
- **Code existant** : le change `socle-projet` a déjà livré une partie du socle (`core/models`, routes, `db.json`, scripts) ; ce changement le reprend et l'étend.
- **Dépendances** : en développement `json-server@0.17.4`, `json-server-auth`, `bcryptjs`, `concurrently`. Aucune bibliothèque de composants.
- **Fichiers** : `api/server.cjs`, `db.json`, `package.json`, `src/app/core/**`, `src/app/features/auth/**`, `src/app/features/accueil/**`, `src/app/features/compte/**`, `src/app/shared/pages/**`, `app.config.ts`, `app.routes.ts`, `README.md`.
- **Ports** : API 3000, Angular 4200.
