# Design : socle et authentification

## Context

- Angular 22.2, Tailwind 4, Vitest + jsdom (`ng test`), TypeScript `strict`.
- **Prérequis** : `design-template` est appliqué. Il fournit le thème Tailwind du template, les photos dans `public/images/`, les composants `shared/ui` (`uiBouton`, `ui-champ`, `ui-onglets`, `ui-modale`, `ui-tableau`, `NotificationService`…), les animations, l'en-tête en trois zones, le menu mobile et le pied de page. Aucun PrimeNG.
- Le code de `socle-projet` existe : modèles dans `core/models`, `db.json` (produits fictifs avec images picsum, un vendeur `en_attente`), scripts `api` (`json-server-auth db.json`) et `dev`, `API_URL`, `TitreStrategy`, routes `loadChildren` par section avec pages provisoires, page introuvable.
- json-server-auth 2.1 : `/register` enregistre **tous** les champs reçus (donc un `role: "admin"`), `/login` ignore `actif`, jeton JWT d'1 h (`sub` = id). json-server renvoie le champ `password` sur `GET /users`.

Voir `proposal.md` pour la motivation, `specs/` pour les exigences, `design-template/DESIGN.md` pour l'apparence.

## Goals / Non-Goals

**Goals :**

- Un état d'authentification unique en signals, lu par l'en-tête, les guards et l'intercepteur.
- Les règles des comptes appliquées par l'API simulée, pas seulement par l'interface.
- Des pages d'authentification et un espace client fidèles au template (`captures/05`, `06`, `07`).

**Non-Goals :**

- Aucun service métier (produits, commandes…) : ils arrivent avec `parcours-achat` et `vendeur-et-admin`.
- Aucun composant visuel nouveau : tout passe par `shared/ui`.

## Decisions

### 1. API simulée : `api/server.cjs`

`npm run api` devient `node api/server.cjs` :

```text
jsonServer.create()
  → jsonServer.defaults()        CORS, logs
  → jsonServer.bodyParser
  → reglesComptes                middleware maison
  → auth (json-server-auth)      app.db = router.db
  → router('db.json')            router.render retire `password` des réponses
écoute sur le port 3000
```

- `reglesComptes` : `POST /register|/signup|/users` force `role: 'client'` et `actif: true` ; `POST /login` répond 403 `"Compte désactivé"` si l'utilisateur existe, que `bcrypt.compareSync` est vrai et que `actif === false`, sinon laisse json-server-auth répondre.
- `router.render` supprime `password` de tout objet de la ressource `users`.
- Alternatives écartées : contrôler `actif` dans `AuthService` (contournable avec `curl`) ; l'option `--middlewares` de la CLI (nos middlewares passeraient après `/login`).
- `bcryptjs` devient une dépendance de développement directe.

### 2. Données d'exemple reprises du template

`db.json` est réécrit avec des objets de `template.html` et ses photos (`/images/…`) ; les comptes de démonstration restent ceux du socle.

| id | Produit | Catégorie | Boutique | Prix | Stock | Photo |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Tasses empilables Nuage | Céramique | Atelier Grès & Sel | 34 | 18 | `produit-tasses-empilables.jpg` |
| 2 | Set de bols Sable | Céramique | Atelier Grès & Sel | 58 | 9 | `produit-set-bols-sable.jpg` |
| 3 | Mugs mouchetés | Céramique | Atelier Grès & Sel | 29 | **0** | `produit-mugs-mouchetes.jpg` |
| 4 | Bougie ambre Forêt | Maison | Atelier Grès & Sel | 32 | 24 | `produit-bougie-ambre.jpg` |
| 5 | Bougies parfumées | Maison | Atelier Grès & Sel | 18 | 40 | `produit-bougies-parfumees.jpg` |
| 6 | Tabouret de comptoir en frêne | Mobilier | Menuiserie Lebrun | 140 | 7 | `produit-tabouret-frene.jpg` |
| 7 | Tabouret haut Lin | Mobilier | Menuiserie Lebrun | 165 | 2 | `produit-tabouret-haut.jpg` |
| 8 | Couverts de service Prairie | Cuisine | Menuiserie Lebrun | 38 | 15 | `produit-couverts-service.jpg` |
| 9 | Ustensiles en olivier | Cuisine | Menuiserie Lebrun | 45 | 11 | `produit-ustensiles-olivier.jpg` |
| 10 | Bols en bois tourné | Cuisine | Menuiserie Lebrun | 52 | 5 | `produit-bols-bois-tourne.jpg` (**inactif**) |

- Catégories (id, slug) : 1 Céramique `ceramique`, 2 Mobilier `mobilier`, 3 Cuisine `cuisine`, 4 Maison `maison` — quatre des six univers du template, dans son ordre, avec les photos `categorie-*.jpg` correspondantes.
- Boutiques, toutes deux `valide` : 1 « Atelier Grès & Sel » (Dieulefit, titulaire Claire Fontaine, `vendeur1@boutique.fr`) ; 2 « Menuiserie Lebrun » (Jura, titulaire Yao Kouassi, `vendeur2@boutique.fr`). Le cas `en_attente` sera créé par la demande « Devenir vendeur ».
- Les descriptions sont celles du template. Les photos non utilisées (chaise, fauteuil, lin, paniers, plats) restent dans la bibliothèque pour les produits créés plus tard.
- Modèles : `AdresseLivraison { nomComplet, adresse, codePostal, ville, telephone }` remplace la chaîne `adresseLivraison` ; `UtilisateurConnecte = Omit<Utilisateur, 'motDePasse'>`.

### 3. En-tête, menu et bouton de compte

- `design-template` livre la structure (trois zones, logo, menu mobile). Ce changement remplit la zone droite :
  - `<nav aria-label="Navigation principale">` : liens calculés par `computed()` depuis `auth.role()` — « Boutique » (`/catalogue`), « Nos artisans » (`/` + fragment `comment-ca-marche`), « Espace vendeur » (vendeur), « Admin » (admin) ; `routerLinkActive` + `ariaCurrentWhenActive="page"` ;
  - bouton du panier (icône sac, nom accessible « Panier ») ; le compteur viendra de `parcours-achat` ;
  - bouton de compte : `a[uiBouton]` « Connexion » (`queryParams: { retour: router.url }`) pour un visiteur, ou prénom (premier mot de `nom`) vers `/compte`.
- Les mêmes liens alimentent le menu mobile.

### 4. Routes et guards

| Chemin | Garde (`canMatch`) | Chargement | Titre |
| --- | --- | --- | --- |
| `''` (`pathMatch: 'full'`) | — | `loadComponent` → `features/accueil/accueil-page` (provisoire, remplie par `parcours-achat`) | Accueil |
| `catalogue` | — | `loadChildren` → `features/catalogue/catalogue.routes` | Boutique |
| `panier` | — | `loadChildren` → `features/panier/panier.routes` | Panier |
| `commande` | `authGuard` | `loadChildren` → `features/commande/commande.routes` | Commande |
| `compte` | `authGuard` | `loadChildren` → `features/compte/compte.routes` | Mon compte |
| `vendeur` | `vendeurGuard` | `loadChildren` → `features/vendeur/vendeur.routes` | Espace vendeur |
| `admin` | `adminGuard` | `loadChildren` → `features/admin/admin.routes` | Administration |
| `connexion` | — | `loadComponent` → `features/auth/auth-page` (onglet `connexion`) | Connexion |
| `inscription` | — | `loadComponent` → `features/auth/auth-page` (onglet `inscription`) | Créer un compte |
| `acces-refuse` | — | `loadComponent` → `shared/pages/acces-refuse` | Accès refusé |
| `**` | — | `loadComponent` → `shared/pages/page-introuvable` | Page introuvable |

- `canMatch` (et non `canActivate`) : le code d'une section n'est pas téléchargé pour un utilisateur non autorisé.
- `core/auth/auth.guards.ts` : fabrique `exigerRole(role?: Role): CanMatchFn` ; `authGuard`, `vendeurGuard`, `adminGuard`. Non connecté → `/connexion?retour=<url>` (reconstruite depuis `router.getCurrentNavigation()?.extractedUrl`) ; mauvais rôle → `/acces-refuse`.
- `core/auth/retour.ts` : `retourSur(valeur)` accepte un chemin commençant par un seul `/` (ni `//`, ni `/\`), sinon `/catalogue`.

### 5. `AuthService` (`core/auth/auth.service.ts`)

Déclaré avec `@Service()` (Angular 22).

- État : `#session = signal<Session | null>(lireSession())` ; lecture publique `utilisateurConnecte`, `estConnecte`, `role`, `prenom`, `jeton` (`computed`).
- `connexion(email, motDePasse)`, `inscription({ nom, email, motDePasse })` → `Observable<UtilisateurConnecte>` (mot de passe envoyé sous le nom `password`).
- `deconnexion()` : vide la session et le stockage, navigue vers `/catalogue`.
- `expirerSession(url)` : vide la session, navigue vers `/connexion?retour=<url>&expire=1`.
- Erreurs traduites en `ErreurAuth = 'identifiants' | 'compte-desactive' | 'email-existant' | 'serveur'`.
- Stockage : `localStorage`, clé `flowering.session`, accès dans un `try/catch`, session ignorée et effacée si le JSON est invalide ou si l'`exp` du jeton est passé.

### 6. Intercepteur (`core/auth/jeton.interceptor.ts`)

Fonctionnel, enregistré par `provideHttpClient(withInterceptors([jetonInterceptor]))`. Ajoute le jeton si la session existe et que `req.url` commence par `API_URL` ; sur 401 (hors `/login`, `/register`), appelle `expirerSession(router.url)`.

### 7. Page d'authentification (template `#view-auth`)

- Un seul composant `AuthPage` sert `/connexion` et `/inscription` (donnée de route `onglet`) : à gauche la photo `etape-1-atelier.jpg` avec dégradé et texte du template (« Espace client », « Suivez vos commandes, de l'atelier à votre porte. »), à droite un panneau arrondi à 28 px avec « Bon retour » et `ui-onglets` « Connexion » / « Créer un compte ».
- Changer d'onglet remplace l'URL (`/connexion` ↔ `/inscription`, `replaceUrl`, paramètres `retour` conservés) avec un fondu croisé des panneaux.
- Formulaires réactifs (`NonNullableFormBuilder`), conformément à la configuration du projet ; champs via `ui-champ`, bouton `uiBouton` avec état de chargement, tremblement à la soumission invalide et focus sur le premier champ invalide (`design-template`).
- Erreur serveur : message `role="alert"` sous le formulaire (`.err` du template).
- Encadré « Comptes de démonstration » du template : affiché seulement en développement (`isDevMode()`), avec les comptes du README.
- Notification de bienvenue par `NotificationService` (toast du template).

### 8. Espace client provisoire (`/compte`)

`ComptePage` reprend l'en-tête de l'espace client du template : « Bonjour {prénom} », e-mail, bouton contour « Se déconnecter ». `parcours-achat` y ajoutera la liste des commandes.

### 9. Services créés ou modifiés

- Créés : `AuthService`, `jetonInterceptor`, `authGuard`, `vendeurGuard`, `adminGuard`.
- Utilisés sans modification : `NotificationService`, `TitreStrategy` (suffixe « | Flowering »), composants `shared/ui`.

## Risks / Trade-offs

- [Jeton en `localStorage`, lisible en cas de XSS] → acceptable pour une API simulée ; aucune liaison `innerHTML`. Avec une vraie API : cookie `HttpOnly`.
- [Clé JWT publique et fixe de json-server-auth] → développement uniquement, documenté dans le README.
- [Les ressources métier restent modifiables sans contrôle de propriétaire côté API] → complété par `parcours-achat` et `vendeur-et-admin`.
- [Comptes de démonstration visibles sur la page de connexion] → limités au mode développement.
- [Deux onglets : une déconnexion n'est pas propagée] → l'autre onglet est déconnecté au prochain 401 ou rechargement.

## Migration Plan

1. Appliquer après `design-template`.
2. `db.json` est remplacé (produits du template) ; `git checkout db.json` restaure ensuite l'état de référence une fois le fichier commité.
3. Le passage du script `api` à `node api/server.cjs` est transparent pour `npm run api` / `npm run dev`.
