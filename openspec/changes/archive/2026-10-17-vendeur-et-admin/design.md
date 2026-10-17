# Design : espace vendeur et administration

## Context

- S'appuie sur `design-template` (thème, `shared/ui` dont `ui-tableau`, `ui-modale`, `uiConfirmer`, `ui-tuile-stat`, `ui-statut`, `ui-badge-role`, `uiCompteur`, animations), `socle-et-auth` (`AuthService`, `exigerRole()`, `vendeurGuard`, `adminGuard`, `api/server.cjs`, `db.json` du template) et `parcours-achat` (`CategorieService`, `VendeurService`, `ProduitService`, `CommandeService`, `reglesCommandes`, `estVisible()`, pipe `prix`, `ComptePage`).
- Référence visuelle : `design-template/captures/08` (aperçu), `09` (produits), `10` (formulaire produit en modale), `11` (commandes), `12` (clients) ; l'espace vendeur reprend ces écrans.
- json-server-auth signe ses jetons avec une clé connue et `sub` = id utilisateur : le serveur peut retrouver l'auteur de chaque requête.

Voir `proposal.md` et `specs/` (espace-vendeur, administration).

## Goals / Non-Goals

**Goals :**

- Les règles d'écriture appliquées par l'API simulée, l'interface ne faisant que les refléter.
- Un seul formulaire produit et une seule mise en page « panneau d'administration » partagés par le vendeur et l'administrateur.

**Non-Goals :**

- Aucune bibliothèque de composants : tableaux, modales et toasts passent par `shared/ui`.
- Pas d'historique des changements de statut.

## Decisions

### 1. Règles d'écriture dans `api/server.cjs`

Un utilitaire `auteur(req)` vérifie le jeton (`jsonwebtoken.verify` avec la clé de json-server-auth) et renvoie l'utilisateur actif de `router.db` (ou `null`). Middlewares placés avant le routeur :

| Requête | Règle |
| --- | --- |
| `POST /vendeurs` | rôle `client` requis (403) ; `utilisateurId` = auteur, `statut` = `en_attente` ; 409 si l'auteur a déjà un vendeur ou si le nom de boutique existe (sans casse) |
| `PATCH /vendeurs/:id` | admin seulement ; `en_attente` → `valide` donne le rôle `vendeur` au titulaire ; `en_attente` → `refuse` ; autre transition → 409 |
| `PATCH /users/:id` | admin seulement ; 403 sur son propre compte ; 409 si le rôle demandé est `vendeur` ou si la cible est titulaire d'une boutique validée et que le rôle change |
| `POST /produits` | admin (boutique libre) ou vendeur (`vendeurId` forcé à sa boutique) ; sinon 403 |
| `PATCH` / `DELETE /produits/:id` | admin, ou vendeur propriétaire ; sinon 403 ; `DELETE` → 409 si le produit figure dans une ligne de commande |
| `POST` / `PATCH` / `DELETE /categories` | admin seulement ; 409 si nom ou slug déjà pris ; `DELETE` → 409 si des produits y sont rattachés |
| `PATCH /commandes/:id` (admin) | transitions `en_attente → expediee/annulee`, `expediee → livree/annulee`, sinon 409 ; la remise en stock de `reglesCommandes` s'applique à `annulee` |

- Désactiver / réactiver un vendeur = `PATCH /users/<titulaire> { actif }` : la règle de visibilité de `catalogue` masque ses produits sans nouveau champ.
- Alternative écartée : contrôles seulement dans Angular (contournables par un appel direct).

### 2. Services (`src/app/core/services/`)

- `ProduitService` : + `listerTous()`, `listerParVendeur(vendeurId)`, `trouver(id)`, `creer()`, `modifier()`, `supprimer()`.
- `CategorieService` : + `creer()`, `modifier()`, `supprimer()`.
- `VendeurService` : + `demander()`, `maBoutique()`, `lister()` (avec titulaire), `valider(id)`, `refuser(id)`.
- `UtilisateurService` (nouveau) : `lister()`, `changerRole(id, role)`, `changerActif(id, actif)`.
- `CommandeService` : + `listerToutes()` (avec client), `changerStatut(id, statut)`, `ventesDuVendeur(vendeurId)`.
- `core/services/erreurs-api.ts` : `messageErreur(err, contexte)` traduit 403 / 409 / 0 en messages des specs, affichés par `NotificationService.erreur()`.
- `core/services/transitions.ts` : `transitionsPermises(statut)`, fonction pure reprise à l'identique dans le serveur (mêmes cas de test des deux côtés).

### 3. Mise en page « panneau d'administration »

- `shared/panneau/panneau-layout.ts` : grille du template `md:grid-cols-[14rem_1fr]` ; colonne gauche = menu vert forêt collant (`<nav>` nommée, liens natifs `routerLinkActive` + `ariaCurrentWhenActive`), barre horizontale défilante sous 820 px ; colonne droite = sur-titre, titre, action principale (« Nouveau produit ») et contenu. Entrées passées en `input()`.
- `AdminLayout` (« Menu d'administration » : Aperçu, Produits, Commandes, Catégories, Vendeurs, Utilisateurs) et `VendeurLayout` (« Menu de l'espace vendeur » : Mes produits, Mes ventes) utilisent ce composant.
- Choix des libellés : « Aperçu » et l'ordre Aperçu / Produits / Commandes viennent du template ; « Catégories », « Vendeurs » et « Utilisateurs » (au lieu de « Clients », puisque la page gère tous les rôles) complètent le menu dans le même style.

### 4. Formulaires en modale

- `shared/produit-formulaire/produit-formulaire.ts` : formulaire réactif (`input()` `produit`, `categories`, `boutiques?` ; `output()` `enregistrer`) ; validateurs `prixValide` et `auMoinsUnePhoto` ; champ « Boutique » (`<select>` natif stylé) seulement si `boutiques` est fourni.
- **Choix de la photo** : grille de vignettes des photos produit de la bibliothèque (`PHOTOS_PRODUITS`, liste des fichiers `produit-*.jpg`), en boutons radio natifs regroupés dans un `fieldset` ; la photo choisie s'affiche aussitôt dans l'aperçu 4:5 du formulaire (fondu croisé). Remplace le champ URL : aucune image externe n'est possible.
- Les routes `…/nouveau` et `…/:id` sont des **routes enfants** de la liste : la liste reste affichée et le formulaire s'ouvre dans `ui-modale` ; fermer la modale ramène à l'URL de la liste. URL partageables, retour arrière naturel, apparence du template.
- Catégories : même principe avec `CategorieFormulaire` (nom, slug proposé par `slugifier()` tant que l'utilisateur ne l'a pas modifié).

### 5. Confirmations

- Suppressions (produits, catégories) : `uiConfirmer` (deux clics, décompte de 3 s), comme le template.
- Autres actions sensibles (refuser, désactiver, changer un rôle, annuler une commande) : `ui-modale` avec la question et deux boutons (« Confirmer » plein, « Annuler » contour), focus initial sur « Annuler ».

### 6. Routes et guards

| Chemin | Garde | Composant | Titre |
| --- | --- | --- | --- |
| `devenir-vendeur` | `canMatch: [clientGuard]` | `DevenirArtisanPage` | Devenir artisan |
| `vendeur` | `vendeurGuard` (socle) | `VendeurLayout` | — |
| `vendeur/` | — | redirection vers `produits` | — |
| `vendeur/produits` (+ enfants `nouveau`, `:id`) | — | `MesProduitsPage` (+ modale `EditionProduitVendeur`) | Mes produits |
| `vendeur/ventes` | — | `MesVentesPage` | Mes ventes |
| `admin` | `adminGuard` (socle) | `AdminLayout` | — |
| `admin/` | — | redirection vers `apercu` | — |
| `admin/apercu` | — | `ApercuPage` | Aperçu |
| `admin/produits` (+ `nouveau`, `:id`) | — | `ProduitsAdminPage` (+ modale `EditionProduitAdmin`) | Produits |
| `admin/commandes`, `admin/commandes/:id` | — | `CommandesAdminPage`, `DetailCommandeAdminPage` | Commandes |
| `admin/categories` (+ `nouvelle`, `:id`) | — | `CategoriesPage` (+ modale `EditionCategorie`) | Catégories |
| `admin/vendeurs` | — | `VendeursAdminPage` (`statut` en paramètre) | Vendeurs |
| `admin/utilisateurs` | — | `UtilisateursAdminPage` | Utilisateurs |

- `clientGuard = exigerRole('client')` ajouté à `core/auth/auth.guards.ts`.
- Les sous-routes héritent du guard de leur section (`canMatch` sur le parent).
- `/devenir-vendeur` est une route de premier niveau, hors de `/vendeur` réservé au rôle `vendeur`.

### 7. Accès à la demande

- `PiedDePage` : « Devenir artisan » (colonne Aide) devient un lien vers `/devenir-vendeur`.
- `ComptePage` : bouton contour « Devenir artisan » si `auth.role() === 'client'`.
- L'en-tête du template n'est pas modifié.

### 8. Animations propres aux espaces de gestion

Sur les primitives de `design-template`, désactivées avec le mouvement réduit :

- tuiles de l'aperçu et total des ventes en `uiCompteur` ; tuiles qui apparaissent en cascade ;
- lignes de tableau en cascade au premier affichage et après filtrage (60 ms, 8 lignes au plus) ;
- entrée active du menu latéral mise en valeur par un fond clair qui apparaît en fondu (300 ms) ;
- bouton « Supprimer » armé : passage en « Confirmer » (couleur `--bad`, 200 ms) avec le décompte des secondes restantes ;
- formulaire en modale : ouverture du template, aperçu de photo en fondu croisé, vignette choisie entourée d'un anneau vert forêt (rose au focus clavier) ;
- changement de statut ou d'état : la pastille change de couleur en fondu (le surlignage de la ligne est abandonné : en 300 ms au plus, il ne serait pas perceptible) ;
- ligne supprimée ou filtrée : sortie en fondu descendant (`animate.leave`).

### 9. Services créés ou modifiés

- Créés : `UtilisateurService`, `clientGuard`, `PanneauLayout`, `ProduitFormulaire`, `CategorieFormulaire`, `transitionsPermises`, `messageErreur`.
- Modifiés : `ProduitService`, `CategorieService`, `VendeurService`, `CommandeService`, `PiedDePage`, `ComptePage`, `api/server.cjs`.

## Risks / Trade-offs

- [Clé de signature JWT connue de tous] → l'API simulée n'est pas une sécurité réelle ; ces contrôles garantissent le comportement attendu.
- [Table des transitions dupliquée entre Angular et le serveur] → mêmes cas de test des deux côtés.
- [Validation d'un vendeur en deux écritures (statut puis rôle)] → exécutées dans le même middleware synchrone.
- [Un vendeur désactivé garde sa session jusqu'à expiration du jeton] → ses écritures sont refusées par `auteur(req)` ; les pages restent visibles jusqu'au prochain 401.
- [Choix limité aux 15 photos produit du template] → conforme à la règle « uniquement les images du template » ; le téléversement reste hors périmètre.

## Migration Plan

Aucune migration de données : les vendeurs existants sont déjà `valide`. Les pages provisoires `/vendeur` et `/admin` sont remplacées.
