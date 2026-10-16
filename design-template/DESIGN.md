# FLOWERING : spécification du design

Boutique en ligne d'objets artisanaux : céramique, mobilier, ustensiles de cuisine, textile, vannerie et bougies.
Source de référence : `template.html`, un fichier unique avec HTML, CSS et JS vanilla.
Le template est une SPA sans framework : les « pages » sont des `<div id="view-…">` qu'on affiche ou masque avec l'attribut `hidden`.
Les données (produits, utilisateurs, commandes, panier, session) sont des exemples stockés dans `localStorage` sous la clé `flowering_v3`.
Dans Angular, il faut les remplacer par des services et des appels API.

---

## 1. Couleurs

Toutes les couleurs sont des variables CSS déclarées sur `:root`.
Un thème sombre redéfinit les mêmes variables :
- automatiquement avec `@media (prefers-color-scheme: dark)` ;
- ou en forçant le thème avec `:root[data-theme="dark"]` / `[data-theme="light"]`.

| Variable | Clair | Sombre | Usage |
|---|---|---|---|
| `--bg` | `#ffffff` | `#0f1512` | Fond de page, fond des modales, du tiroir panier et des cellules de tableau |
| `--soft` | `#f4f6f3` | `#151d18` | Fond des cartes produit, panneaux admin, pied de page, champs de recherche, puces de filtre |
| `--ink` | `#15261c` | `#eaf1ec` | Texte principal |
| `--muted` | `#66746b` | `#9aa89f` | Texte secondaire, libellés, sur-titres (`.eyebrow`) |
| `--line` | `#e5e9e4` | `#24302a` | Bordures fines, contour des boutons « line », fond d'image en attente |
| `--forest` | `#173a29` | `#1b4430` | **Couleur principale** : boutons pleins, bloc « Prix juste », 1re carte étape, menu admin, toast, première tuile de stat |
| `--forest-ink` | `#f3f8f4` | `#f3f8f4` | Texte posé sur `--forest` |
| `--mint` | `#dcefe2` | `#1a2e22` | Vert menthe pâle : bloc « Notre engagement », badge de rôle client |
| `--mint-strong` | `#b9e0c6` | `#2a4a36` | Carte du simulateur de prix, barres du graphique admin |
| `--candy` | `#f6a9c5` | `#f39abb` | **Accent rose bonbon** (usage ponctuel) : pastille du panier, `®` du logo, badge « Pièce unique », anneau de focus, « % » du grand chiffre, statut « Expédiée » |
| `--candy-soft` | `#fde4ee` | `#3a2230` | Badge de rôle « Admin » |
| `--ok` | `#2f7a4a` | `#86cf9b` | Statut « Livrée », stock suffisant |
| `--warn` | `#b5761a` | `#e7b25a` | Statut « En préparation », stock bas |
| `--bad` | `#c3405c` | `#f18aa2` | Erreurs de formulaire, statut « Annulée », rupture, bouton « Supprimer » |

Couleurs fixes, hors variables :
- `#ffffff` et `#15261c` pour le texte et les boutons posés sur les photos (hero, carte mise en avant) ;
- dégradés sombres `rgba(10,22,15,.25 → .7)` superposés aux photos pour la lisibilité.
- Dans le simulateur, les trois parts utilisent `#173a29` (artisan), `#f6a9c5` (livraison) et `#ffffff` (boutique).

## 2. Typographie

- **Police unique :** **Geist**, chargée depuis Google Fonts avec les graisses 300, 400, 500 et 600.
  - Lien : `https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap`
  - Alternative npm : `@fontsource/geist`.
  - Pile de secours : `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- **Taille de base :** `15px`, interligne `1.55`, avec `-webkit-font-smoothing: antialiased`.
- **Titres :** graisse 400, `letter-spacing: -0.025em`, `line-height: 1.05` et `text-wrap: balance`.

| Élément | Taille |
|---|---|
| `h1` | `clamp(2.6rem, 5.4vw, 4.4rem)` (hero). Ailleurs, souvent forcé à `clamp(2.2rem, 4.5vw, 3.4rem)` |
| `h2` | `clamp(1.9rem, 3.4vw, 2.8rem)` |
| `h3` | `1.05rem`, graisse 500 |
| Grand texte d'engagement (`.big`) | `clamp(1.9rem, 4.2vw, 3.5rem)`, `line-height 1.12`, `letter-spacing -0.03em`, `max-width: 20ch` |
| Grand chiffre (`.stat-big`) | `clamp(4.5rem, 10vw, 8rem)`, graisse 300, `letter-spacing -0.05em` |
| Montant du simulateur | `clamp(2.6rem, 6vw, 3.6rem)`, graisse 300 |
| Chiffre de stat admin | `2rem`, graisse 300 |
| Prix sur la fiche produit | `1.8rem`, graisse 300 |
| Logo | `1.35rem`, graisse 500, `letter-spacing -0.03em`, avec un `®` en exposant rose |
| Sur-titre (`.eyebrow`) | `.78rem`, couleur `--muted` |
| Boutons | `.9rem`, graisse 500 (`.84rem` pour `.sm`) |
| Liens de navigation | `.86rem` |
| Badges | `.7rem`, graisse 500 |

Les nombres alignés (prix, totaux, tableaux) utilisent `font-variant-numeric: tabular-nums`.

## 3. Espacements, grilles et mise en page

- **Conteneur `.wrap` :**
  - `max-width: 1280px`, centré ;
  - gouttière latérale `max(16px, env(safe-area-inset-left/right))`.
- **Espacement vertical :**
  - les sections (`section.block`) ont `padding-block: clamp(56px, 8vw, 96px)` ;
  - les blocs pleine largeur (hero, engagement, prix juste) sont séparés de `12px` ;
  - les grilles ont un écart de `14px`.
- **Intérieur des grands blocs :** `clamp(20px, 4vw, 48px)` sur les côtés.
- **Grilles :**
  - produits en 4 colonnes, puis 3 sous 1024px et 2 sous 820px ;
  - univers en 6 colonnes, puis 3 sous 1024px et 2 sous 480px ;
  - étapes en 3 colonnes, puis 1 sous 820px ;
  - stats admin en 4 colonnes, puis 2 sous 1024px.
- **Points de rupture :** `1024px`, `820px` (passage en mise en page mobile et menu burger) et `480px`.
- **Hauteur :**
  - en-tête de `72px`, `64px` sous 820px ;
  - hero en `min-height: min(86vh, 760px)`.

## 4. Arrondis

| Valeur | Éléments |
|---|---|
| `28px` | Grands blocs : hero, engagement, prix juste, panneaux de connexion, modale, haut du pied de page |
| `22px` | Cartes produit, carte mise en avant, étapes, panneaux et stats admin, carte du simulateur, menu admin |
| `20px` | Photo de la fiche produit |
| `16px` | Image dans la carte produit, ligne du panier |
| `14px` | Lignes de tableau admin, éléments de stock bas, note du simulateur |
| `12px` | Champs de formulaire, petites vignettes du panier, caractéristiques de la fiche produit |
| `10px` | Vignettes dans les tableaux admin |
| `999px` | Boutons, puces, badges, recherche, onglets, statuts, images rondes des univers, petites images insérées dans le texte |
| `50%` | Boutons ronds (flèche, icônes) |

## 5. Ombres et effets de surface

- **Aucune ombre portée :** le design repose sur des aplats de couleur, `--soft` sur `--bg`.
- **Contours :** `box-shadow: inset 0 0 0 1px var(--line)` pour les boutons `.line`.
- **Voiles :** fond semi-transparent `rgba(10,22,15,.35)` derrière la modale et le panier.
- **Dégradés** sur les photos (hero, mise en avant, connexion) pour garder le texte lisible.

## 6. Icônes

- **Aucune bibliothèque d'icônes :** toutes les icônes sont des SVG écrits à la main, avec `stroke="currentColor"` et `stroke-width` de 1.7 à 2.
  - Panier (sac) : en-tête.
  - Menu burger (deux traits) : en-tête mobile.
  - Flèche diagonale ↗ : bouton rond du hero.
  - Loupe : champ de recherche du catalogue.
- **Étoiles d'avis :** dessinées en CSS avec `clip-path: polygon(...)` sur des `<span>`.
- **Signes `×`, `−` et `+` :** simples caractères texte dans `.icon-btn`.
- **Pour Angular :** on peut les remplacer par **Lucide**, avec les icônes `shopping-bag`, `menu`, `arrow-up-right`, `search`, `x`, `minus`, `plus` et `star`.

## 7. Composants

| Composant | Classe(s) | Description |
|---|---|---|
| En-tête | `header.top`, `.bar` | Grille en 3 colonnes : catégories à gauche, logo au centre, liens + panier + connexion à droite. Sur l'accueil (`body.on-home`), il se superpose au hero en texte blanc. Sur les autres pages, il a un fond blanc et une bordure basse. |
| Menu mobile | `.mnav` | Plein écran, grands liens de `1.6rem`. Il s'ouvre avec le bouton burger. |
| Logo | `.logo` | Texte « Flowering » suivi d'un `®` rose. |
| Bouton | `.btn`, `.btn.line`, `.btn.light`, `.btn.sm` | Pilule. Plein vert forêt, version contour, version blanche ou version petite. |
| Bouton rond | `.round` | 42px, blanc. Il pivote de -45° au survol. |
| Bouton icône | `.icon-btn` | 34px, rond, bordure fine. |
| Pastille panier | `.cart b` | Rose, avec le nombre d'articles. Elle est cachée quand le panier est vide. |
| Hero | `.hero` | Photo plein cadre avec dégradé. En bas : étoiles d'avis, `h1`, deux colonnes de texte, bouton et bouton rond. |
| Bloc engagement | `.statement`, `.big`, `.pillimg` | Fond menthe et grand texte, avec de petites photos en pilule insérées dans la phrase. |
| Carte mise en avant | `.feature` | Photo avec dégradé, titre et bouton blanc. C'est la première case de la grille produits. |
| Carte produit | `.card`, `.ph`, `.card-b`, `.card-a` | Photo carrée avec badge, nom, « atelier · prix », et boutons « Ajouter » et « Détails ». |
| Badge stock | `.badge`, `.low`, `.out`, `.unique` | Pastille blanche avec un point coloré : vert (en stock), orange (« Plus que N »), rouge (épuisé) ou rose (« Pièce unique »). |
| Bloc prix juste | `.fair`, `.stat-big`, `.calc` | Fond vert forêt, grand chiffre « 72 % » et simulateur avec curseur. |
| Carte étape | `.step` | Photo 4:3 et texte. La première carte est vert forêt. |
| Tuile univers | `.cat` | Image ronde, nom et nombre de créations. |
| Puce de filtre | `.chip` | Fond `--soft`, devient vert forêt quand elle est active (`aria-pressed="true"`). |
| Recherche | `.search` | Pilule avec une loupe. |
| Fiche produit | `.modal`, `.pd`, `.specs`, `.qty` | Modale en 2 colonnes : photo 4:5, puis atelier, titre, description, caractéristiques, prix, quantité et bouton d'ajout. |
| Tiroir panier | `.drawer`, `.ci`, `.total` | Panneau à droite (420px) : lignes produit avec quantité, total, part reversée aux artisans et bouton de commande. |
| Onglets | `.tabs` | Bascule entre « Connexion » et « Créer un compte ». |
| Champ | `.field` | Libellé au-dessus, champ arrondi à 12px. Il est entouré de `--ink` au focus. |
| Message d'erreur | `.err` | Texte rouge sous le formulaire, avec `role="alert"`. |
| Statut de commande | `.status.prep/.ship/.done/.cancel` | Pilule avec un point coloré. |
| Menu admin | `.side` | Colonne vert forêt, collante. Elle devient une barre horizontale sur mobile. |
| Tuile de stat | `.stat` | Libellé, grand chiffre et sous-texte. La première tuile est vert forêt. |
| Graphique | `.chart` | SVG généré en JS : barres arrondies sur 7 jours, la barre du jour en vert forêt. |
| Tableau admin | `table`, `.table-wrap` | Lignes séparées, arrondies à 14px, avec défilement horizontal sur mobile. |
| Petit bouton | `.mini`, `.danger`, `.armed` | Petites pilules. `.armed` sert à la confirmation de suppression. |
| Toast | `.toast` | Pilule vert forêt en bas de l'écran, visible 2,4 s. |
| Pied de page | `footer .foot` | Fond `--soft` arrondi en haut : logo et texte, colonnes « Boutique » et « Aide », copyright et crédit photo. |

## 8. Pages, sections et routes Angular

| Page | Route Angular proposée | Dans le template | Composants |
|---|---|---|---|
| **Accueil** | `/` | `#view-home` | En-tête superposé, hero, bloc engagement, sélection (carte mise en avant + 7 cartes produit), bloc prix juste et simulateur, « Comment fonctionne Flowering » (3 étapes), univers (6 tuiles), pied de page |
| **Catalogue** | `/boutique` (filtre en paramètre : `/boutique?categorie=mobilier`) | `#view-shop` | Titre (« Toutes les créations » ou nom de l'univers), puces de filtre, recherche, grille de cartes produit, état vide « Aucun résultat » |
| **Fiche produit** | `/produit/:id` | Modale `openProduct(id)` | Photo, atelier, nom, description, caractéristiques, disponibilité, prix, quantité, bouton d'ajout, mention livraison et retours. *C'est une modale dans le template : en faire une page à part entière.* |
| **Panier** | `/panier` (ou un tiroir global) | Tiroir `openCart()` | Lignes avec quantité, total, part reversée aux artisans, « Commander » ou « Se connecter pour commander » |
| **Commande** | `/commande` | **Absent du template** | Le bouton « Commander » crée directement la commande, sans adresse, livraison ni paiement. Seule existe la confirmation par toast, suivie d'une redirection vers l'espace client. |
| **Connexion** | `/connexion` (et `/inscription`) | `#view-auth` | Photo avec texte, onglets connexion/inscription, formulaires avec validation, comptes de démo |
| **Espace client** | `/compte` | `#view-account` | Bonjour, e-mail, liste des commandes (vignettes, articles, n°, date, statut, total), déconnexion. *Cette page n'était pas demandée, mais elle existe dans le template.* |
| **Espace vendeur** | `/vendeur` | **Absent du template** | Aucun espace artisan ou vendeur. On peut le dériver de l'admin (mêmes panneaux, tableaux et formulaire produit), filtré sur l'atelier du vendeur. |
| **Admin** | `/admin` avec les enfants `apercu`, `produits`, `commandes`, `clients` | `#view-admin` | Menu latéral. **Aperçu** : 4 stats, graphique des ventes sur 7 jours, stock bas, dernières commandes. **Produits** : tableau avec +10, Modifier, Supprimer (confirmation en 2 clics) et formulaire produit en modale. **Commandes** : tableau avec choix du statut. **Clients** : tableau. Accès réservé au rôle `admin`, sinon redirection vers la connexion avec un message. |

Les captures correspondantes sont dans `captures/`, avec le suffixe `-bureau` (1440px) ou `-mobile` (390px).

## 9. Effets et interactions existants

- **Survol :**
  - zoom léger de la photo produit (`scale(1.04)`, 0,6 s) et des tuiles univers (`scale(1.06)`) ;
  - le bouton rond pivote de -45° ;
  - les boutons pleins passent à une opacité de 0,9 ;
  - les boutons `.line` foncent leur contour.
- **Clic sur un bouton :** légère compression `scale(.98)`.
- **Fiche produit :** la modale apparaît en fondu et glisse légèrement (0,35 s) avec un voile. Elle se ferme au clic sur le voile, avec la touche Échap ou avec ×.
- **Panier :**
  - le tiroir glisse depuis la droite (0,4 s) ;
  - les quantités se règlent avec + et −, et sont plafonnées au stock ;
  - la pastille de l'en-tête se met à jour.
- **Toast :** confirmation qui monte depuis le bas (ajout au panier, commande, connexion, changements admin).
- **Simulateur prix juste :** un curseur de 20 à 600 € recalcule en direct la barre de répartition, les montants et la note.
- **Catalogue :** filtre par univers (puces ou liens de l'en-tête) et recherche instantanée sur le nom, la description et l'atelier.
- **Authentification simulée :**
  - le mot de passe est haché en SHA-256 côté client ;
  - les messages d'erreur sont explicites (e-mail invalide, compte existant, 6 caractères minimum, confirmation différente) ;
  - après connexion, l'utilisateur est redirigé vers le panier, l'admin ou son compte ;
  - les pages protégées (compte, admin) sont gardées.
- **Admin :**
  - réassort +10 ;
  - suppression avec confirmation (« Confirmer » pendant 3 s) ;
  - statut de commande modifiable ;
  - formulaire produit avec aperçu immédiat de la photo choisie ;
  - graphique avec info-bulle `<title>` au survol des barres.
- **Responsive :** menu burger sous 820px, grilles qui se replient, tableaux qui défilent à l'horizontale.
- **Accessibilité :**
  - focus visible (contour rose de 2px) ;
  - `aria-pressed` sur les filtres et `aria-current` sur la navigation ;
  - `role="dialog"` et `role="alert"` ;
  - textes alternatifs sur les photos ;
  - animations coupées avec `prefers-reduced-motion`.
- **Thème sombre automatique** via `prefers-color-scheme`.

## 10. Images

Les photos viennent d'**Unsplash** (licence Unsplash, usage commercial libre, crédit apprécié). Elles mesurent 1100px de large.
Les fichiers `categorie-*.jpg` sont des copies des photos produit correspondantes.

| Fichier | Usage |
|---|---|
| `hero-accueil.jpg` | Hero de l'accueil |
| `engagement-portrait-1.jpg`, `engagement-ceramique.jpg`, `engagement-portrait-2.jpg` | Petites images insérées dans le texte du bloc engagement |
| `mise-en-avant-art-de-la-table.jpg` | Carte « Art de la table » |
| `etape-1-atelier.jpg`, `etape-2-tour-potier.jpg`, `etape-3-mains-argile.jpg` | Cartes « Comment fonctionne Flowering ». `etape-1-atelier.jpg` sert aussi de photo à la page de connexion. |
| `categorie-*.jpg` (6) | Tuiles univers : céramique, mobilier, cuisine, textile, vannerie, maison |
| `produit-*.jpg` (15) | Photos des 15 produits d'exemple. La correspondance clé → fichier est dans `IMG_FILES` du script. |
