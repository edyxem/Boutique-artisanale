# Design : parcours d'achat

## Context

- S'appuie sur `design-template` (thème, `shared/ui`, animations, en-tête en trois zones avec variante superposée, tiroir, menu mobile, pied de page) et sur `socle-et-auth` (`AuthService`, `authGuard`, `jetonInterceptor`, `API_URL`, `TitreStrategy`, modèles, `api/server.cjs`, `db.json` repris du template, page d'accueil et espace client provisoires).
- Référence visuelle : `design-template/captures/01*` (accueil), `02*` (catalogue), `03*` (fiche), `04*` (panier), `07*` (espace client).
- json-server 0.17 : filtres par égalité (`?actif=true`), `id=1&id=2`, tri (`_sort`, `_order`), pas de transaction.

Voir `proposal.md` et `specs/` (accueil, catalogue, panier, commande).

## Goals / Non-Goals

**Goals :**

- Une seule définition de la visibilité d'un produit, utilisée par l'accueil, la grille, la fiche, le panier et la commande.
- Des règles de stock appliquées par l'API simulée.
- Une carte produit unique (`ui-carte-produit`) partagée par l'accueil et le catalogue.

**Non-Goals :**

- Pas de pagination du catalogue (10 produits d'exemple).
- Pas de contrôle d'accès en lecture sur `/commandes` côté API (permissions fines hors périmètre).

## Decisions

### 1. Services (`src/app/core/services/`)

Tous déclarés avec `@Service()`, `inject(HttpClient)` et `inject(API_URL)` ; un service par entité.

- `CategorieService.lister()` → `GET /categories?_sort=id`.
- `VendeurService.listerPublics()` → `forkJoin(GET /vendeurs?statut=valide, GET /users?role=vendeur&actif=true)`.
- `ProduitService.listerVisibles()` / `trouverVisible(id)` → `ProduitAffiche` (produit + `categorie` + `vendeur`) ; règle isolée dans la fonction pure `estVisible()` (`core/services/visibilite.ts`).
- `CommandeService` : `creer(lignes, adresse)`, `listerMiennes()`, `trouver(id)`, `annuler(id)`.
- `PanierService` (décision 4).
- `formaterPrix(n)` (`shared/format.ts`) : format du template, `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: n % 1 ? 2 : 0 })` → « 34 € », « 39,90 € ». Exposé aussi en pipe `prix`.

### 2. Règles de stock dans l'API simulée

Middleware `reglesCommandes` ajouté à `api/server.cjs`, avant le routeur :

- `POST /commandes` : jeton requis (sinon 401) ; relit chaque produit dans `router.db`, vérifie visibilité et stock (sinon 409 avec `{ produitId, disponible }`) ; fixe `clientId` (= `sub`), `prixUnitaire`, `total`, `statut: 'en_attente'`, `dateCreation` ; diminue les stocks ; laisse json-server créer la commande.
- `PATCH /commandes/:id` vers `annulee` : refusé si déjà `annulee` ; l'auteur ne peut annuler qu'une commande `en_attente` (sinon 403) ; remet chaque quantité en stock.
- Exécution synchrone sur la base en mémoire : pas de vente au-delà du stock, même avec deux onglets. Alternative écartée : vérifier et décrémenter depuis Angular (non atomique, contournable).

### 3. Accueil (`features/accueil`)

- Route `''` : donnée `enTete: 'superpose'` (variante fournie par `design-template`) ; un `IntersectionObserver` sur le bas du hero bascule l'en-tête en apparence normale quand le hero sort de l'écran.
- Sections en composants : `HeroAccueil`, `BlocEngagement`, `SelectionProduits`, `BlocPrixJuste` (+ `SimulateurPrix`), `EtapesFlowering` (`id="comment-ca-marche"`, `tabindex="-1"`), `UniversAccueil`. Textes repris du template.
- `SimulateurPrix` : `<input type="range" min="20" max="600" step="10">` avec libellé « Votre achat », `aria-valuetext` « {montant} € » ; `montant = signal(120)` ; parts en `computed()` (72 / 14 / 14 %, arrondies à l'euro) ; barre de répartition en trois segments (`#173a29`, `#f6a9c5`, `#ffffff` comme le template).
- `UniversAccueil` : photo `/images/categorie-{slug}.jpg` si le slug fait partie des six univers du template, sinon photo du premier produit ; compte des produits visibles par catégorie.
- Lien « Nos artisans » : `routerLink="/"` + `fragment="comment-ca-marche"` ; `anchorScrolling` (activé par `design-template`) puis focus sur la section.

### 4. Panier

- `PanierService` (`core/services/panier.service.ts`) : `#lignes = signal<LignePanier[]>`, `#produits = signal<Map<number, ProduitAffiche>>`, `nombreArticles`, `lignesAffichees`, `total`, `partArtisans` (`Math.round(total * 0.72)`) en `computed()` ; `ajouter`, `changerQuantite`, `retirer`, `vider`, `synchroniser()` ; quantités bornées à `[1, stock]`, résultat `'ajoute' | 'plafonne'`.
- Persistance : `effect()` → `localStorage` `flowering.panier` (`try/catch`), seuls identifiants et quantités.
- Panier indépendant du compte : `AuthService` n'y touche pas.
- `ContenuPanier` (lignes, − / +, total, mention, bouton de commande) est partagé par `TiroirPanier` (dans `ui-tiroir`, ouvert par le bouton de l'en-tête via un signal `PanierService.tiroirOuvert`) et `PanierPage` (`/panier`). Le tiroir se ferme sur `NavigationEnd`.
- Le bouton − d'une ligne en quantité 1 retire la ligne (comme le template) ; son nom accessible change en conséquence.

### 5. Catalogue

- `CataloguePage` : `categorie = input<string>()`, `q = input<string>()` (paramètres de requête, `withComponentInputBinding()`) ; `produitsFiltres = computed(...)` ; normalisation sans accents ni majuscules (`normalize('NFD')`) ; recherche sur `nom`, `description` et `vendeur.nomBoutique` ; URL mise à jour après 150 ms (`replaceUrl`).
- Puces `uiPuce` (« Tout » + catégories) ; champ de recherche du template (pilule avec loupe, libellé visuellement masqué « Rechercher un objet »).
- `ui-carte-produit` (`shared/ui`, ajouté ici) : photo `aspect-square` (`NgOptimizedImage`, `fill`), `ui-badge-stock`, nom, « {boutique} · {prix} », `uiBouton` « Ajouter » (désactivé si épuisé, nom accessible « Ajouter {nom} au panier ») et `a[uiBouton]` contour « Détails ».
- `FichePage` (`/catalogue/:id`) : grille 2 colonnes du template (photo 4:5 arrondie à 20 px, informations), quantité − / + bornée, « Ajouter au panier » ou « Épuisé » ; `titreProduitResolver` pour le titre du document.
- Zone gauche de l'en-tête : trois premières catégories ; colonne « Boutique » du pied de page : toutes ; menu mobile : mêmes liens.

### 6. Commande et espace client

- `CommandePage` (`/commande`, style des panneaux de connexion) : `etape = signal<'livraison' | 'recapitulatif'>()` ; formulaire réactif (`nomComplet` prérempli, `codePostal` `/^\d{5}$/`, `telephone` `/^0\d(\s?\d{2}){4}$/`) avec `ui-champ` ; récapitulatif en lignes du panier ; sur 409 → `panier.synchroniser()` puis `/panier` avec message ; sur succès → `panier.vider()`, toast, `/commande/confirmation/:id`.
- `ConfirmationCommandePage` : « Commande introuvable » si absente ou d'un autre client.
- `ComptePage` (de `socle-et-auth`) reçoit la liste `MesCommandes` au format du template (vignettes, articles, numéro et date, `ui-statut`, total) et le bouton « Annuler la commande » qui ouvre `ui-modale` (« Oui, annuler » / « Non »).

### 7. Animations propres au parcours

Construites sur les primitives de `design-template` (désactivées avec le mouvement réduit) :

- **Hero** : note, titre, textes et boutons en cascade au chargement (fondu montant de 300 ms, 60 ms d'écart).
- **Engagement** : les trois photos en pilule s'ouvrent en largeur (`scale-x` 0 → 1) l'une après l'autre quand le bloc apparaît.
- **Prix juste** : « 72 % » en `uiCompteur` ; segments de la barre qui s'ajustent (`motion-safe:transition-all motion-safe:duration-300`) quand le curseur bouge.
- **Cartes et univers** : apparition en cascade (`uiReveler`) ; zoom de la photo au survol (1,04 / 1,06).
- **Ajout au panier** : la photo de la carte (ou de la fiche) « vole » jusqu'au sac de l'en-tête (copie animée par l'API Web Animations, 300 ms, réduction et fondu), puis la pastille rebondit (`animate-pop`) ; le bouton affiche brièvement « Ajouté ✓ » (1,2 s). Sans mouvement : seule la pastille et le toast changent.
- **Filtre et recherche** : `document.startViewTransition()` autour de la mise à jour de la grille → les cartes restantes glissent vers leur nouvelle place, les autres s'effacent (chaque carte porte un `view-transition-name` unique).
- **Carte → fiche** : photo partagée (`uiPartage="produit-{id}"`) qui s'agrandit jusqu'à la fiche.
- **Tiroir et lignes** : glissement du tiroir (composant `ui-tiroir`) ; nouvelles lignes en fondu ; ligne retirée qui se replie (hauteur via `grid-template-rows`) ; chiffre de quantité qui glisse vers le haut ou le bas ; total qui défile vers sa nouvelle valeur.
- **Commande** : passage livraison → récapitulatif par glissement latéral ; confirmation avec une coche dessinée (tracé SVG animé) avant « Merci pour votre commande ! ».
- **Mes commandes** : lignes en cascade ; pastille de statut qui change de couleur en fondu après annulation.

### 8. Routes et guards

| Chemin | Garde | Composant | Titre |
| --- | --- | --- | --- |
| `''` | — | `AccueilPage` (donnée `enTete: 'superpose'`) | Accueil |
| `catalogue` | — | `CataloguePage` | Boutique |
| `catalogue/:id` | — | `FichePage` | `titreProduitResolver` |
| `panier` | — | `PanierPage` | Panier |
| `commande` | `authGuard` (socle) + `panierNonVideGuard` (`canActivate`) | `CommandePage` | Commande |
| `commande/confirmation/:id` | `authGuard` (socle) | `ConfirmationCommandePage` | Commande confirmée |
| `compte` | `authGuard` (socle) | `ComptePage` (+ `MesCommandes`) | Mon compte |

- `panierNonVideGuard` (`features/commande/panier-non-vide.guard.ts`) : `UrlTree` `/panier` si `panier.nombreArticles() === 0`.
- Le retour après connexion et la conservation du panier reposent sur `authGuard` et `PanierService`.

### 9. Services et composants créés ou modifiés

- Créés : `CategorieService`, `VendeurService`, `ProduitService`, `PanierService`, `CommandeService`, `panierNonVideGuard`, `ui-carte-produit`, pipe `prix`.
- Modifiés : `EnTete` (zone gauche, pastille, ouverture du tiroir), `PiedDePage` (colonne Boutique), `MenuMobile`, `ComptePage`, `api/server.cjs` (`reglesCommandes`).

## Risks / Trade-offs

- [`GET /users?role=vendeur` est public] → mots de passe retirés par le serveur ; acceptable pour l'API simulée.
- [Commandes lisibles par un appel direct à l'API] → l'interface filtre par `clientId` ; permissions fines hors périmètre.
- [Vol vers le panier : le sac est masqué dans le menu burger sur mobile] → la trajectoire vise le bouton du panier, toujours visible dans l'en-tête mobile ; sinon l'animation est omise.
- [`startViewTransition` indisponible] → la grille se met à jour sans animation.
- [Prix modifié entre l'ajout et la confirmation] → le récapitulatif relit les prix et le serveur fixe le prix final.

## Migration Plan

Aucune donnée à migrer (`commandes` vide). Les pages provisoires de l'accueil et des sections sont remplacées.
