# Spec Delta : charte-graphique

## Purpose

Garantir que chaque page de Flowering reproduit fidèlement l'identité visuelle de `design-template/` (couleurs, thème sombre, police, mise en page, arrondis, images, icônes, en-tête et pied de page), y compris les pages absentes de la maquette.

## ADDED Requirements

### Requirement: Couleurs du template

L'application SHALL déclarer les couleurs de `DESIGN.md` comme variables CSS sur `:root` (`--bg`, `--soft`, `--ink`, `--muted`, `--line`, `--forest`, `--forest-ink`, `--mint`, `--mint-strong`, `--candy`, `--candy-soft`, `--ok`, `--warn`, `--bad`) avec les valeurs du thème clair, et les exposer comme couleurs Tailwind. Aucune autre couleur MUST être utilisée dans les composants, hormis les couleurs fixes prévues par `DESIGN.md` sur les photos.

#### Scenario: Valeurs du thème clair

- **GIVEN** un navigateur en thème clair
- **WHEN** une page est affichée
- **THEN** `--forest` vaut `#173a29`, `--candy` vaut `#f6a9c5` et `--bg` vaut `#ffffff`
- **AND** un bouton plein a le fond `--forest` et le texte `--forest-ink`

#### Scenario: Pas de couleur hors charte

- **GIVEN** le code des composants et des styles de `src/app`
- **WHEN** on recherche les couleurs écrites en dur (hexadécimal, `rgb()`, palettes Tailwind par défaut)
- **THEN** on ne trouve que les couleurs fixes autorisées par `DESIGN.md` (texte blanc et dégradés sombres sur les photos)

### Requirement: Thème sombre automatique

Quand le système de l'utilisateur est en mode sombre (`prefers-color-scheme: dark`), l'application SHALL appliquer les valeurs sombres de `DESIGN.md` aux mêmes variables, sans rechargement. Les attributs `data-theme="dark"` et `data-theme="light"` sur `<html>` MUST forcer le thème correspondant.

#### Scenario: Passage en mode sombre

- **GIVEN** un visiteur sur le catalogue
- **WHEN** son système passe en mode sombre
- **THEN** `--bg` vaut `#0f1512` et `--ink` vaut `#eaf1ec`, et toute la page change de thème sans rechargement

#### Scenario: Thème forcé

- **GIVEN** un système en mode sombre
- **WHEN** `<html>` porte `data-theme="light"`
- **THEN** les valeurs du thème clair s'appliquent

### Requirement: Typographie Geist

Tous les textes SHALL utiliser la police Geist (graisses 300 à 600) avec la pile de secours de `DESIGN.md`, une taille de base de 15 px et un interligne de 1,55. Les titres MUST suivre l'échelle de `DESIGN.md` (graisse 400, interlettrage −0,025 em) et les prix, totaux et colonnes chiffrées MUST utiliser des chiffres tabulaires.

#### Scenario: Police et taille de base

- **GIVEN** n'importe quelle page
- **WHEN** on inspecte le corps du texte
- **THEN** la famille commence par « Geist », la taille est 15 px et l'interligne 1,55

#### Scenario: Chiffres alignés

- **GIVEN** un tableau ou une liste de prix
- **WHEN** on inspecte une cellule de prix
- **THEN** elle utilise `font-variant-numeric: tabular-nums`

### Requirement: Mise en page responsive du template

Le contenu SHALL être centré dans un conteneur de 1280 px maximum avec une gouttière d'au moins 16 px (zones sûres comprises). Les points de rupture MUST être ceux du template (1024, 820 et 480 px) et les grilles MUST se replier comme décrit dans `DESIGN.md` (produits 4 → 3 → 2 colonnes, univers 6 → 3 → 2, étapes 3 → 1, statistiques 4 → 2). Aucune page MUST provoquer de défilement horizontal, hors tableaux qui défilent dans leur propre cadre.

#### Scenario: Grille produits sur mobile

- **GIVEN** un écran de 390 px de large
- **WHEN** une grille de cartes produit est affichée
- **THEN** elle compte 2 colonnes séparées de 14 px
- **AND** la page ne défile pas horizontalement

#### Scenario: Grille produits sur bureau

- **GIVEN** un écran de 1440 px de large
- **WHEN** une grille de cartes produit est affichée
- **THEN** elle compte 4 colonnes dans un conteneur de 1280 px centré

### Requirement: Arrondis et surfaces

Les composants SHALL utiliser l'échelle d'arrondis de `DESIGN.md` (28, 22, 20, 16, 14, 12, 10 px, pilule et cercle) et des aplats de couleur sans ombre portée ; seuls les contours fins `inset 0 0 0 1px var(--line)`, les voiles `rgba(10,22,15,.35)` et les dégradés sur photos sont autorisés.

#### Scenario: Carte produit

- **GIVEN** une carte produit
- **WHEN** on inspecte son style
- **THEN** son arrondi est de 22 px, celui de sa photo de 16 px, et elle n'a aucune ombre portée

### Requirement: Bibliothèque d'images du site

Les seules images du site SHALL être les photos de `design-template/images/`, servies depuis `/images/` avec le même nom de fichier. Aucune image MUST être chargée depuis un autre domaine. Chaque image informative MUST avoir un texte alternatif ; les images décoratives un texte alternatif vide. Tant qu'une image n'est pas chargée, son emplacement MUST garder ses dimensions finales et afficher le fond `--line`.

#### Scenario: Aucune image externe

- **GIVEN** un parcours complet sur le site
- **WHEN** on observe les requêtes d'images
- **THEN** toutes visent `/images/<fichier>.jpg` du site, et aucune un autre domaine

#### Scenario: Emplacement réservé

- **GIVEN** une connexion lente
- **WHEN** une carte produit s'affiche avant sa photo
- **THEN** l'emplacement carré de la photo est déjà à sa taille finale, sur fond `--line`, et la mise en page ne se décale pas à l'arrivée de l'image

### Requirement: Icônes du template

Les icônes SHALL être les SVG du template (sac, burger, flèche diagonale, loupe, croix, moins, plus, étoile) dessinés avec `currentColor` et un trait de 1,7 à 2, sans bibliothèque d'icônes. Tout bouton qui ne contient qu'une icône MUST avoir un nom accessible.

#### Scenario: Bouton icône accessible

- **GIVEN** le bouton du panier de l'en-tête, qui ne montre qu'un sac
- **WHEN** un lecteur d'écran l'annonce
- **THEN** il est annoncé avec un nom contenant « Panier »

### Requirement: Focus visible

Tout élément focalisable SHALL afficher au focus clavier un contour rose (`--candy`) de 2 px, visible sur les fonds clairs, sombres et sur les photos, et MUST ne jamais être masqué. Les textes et éléments d'interface MUST respecter les contrastes WCAG AA dans les deux thèmes.

#### Scenario: Focus au clavier

- **GIVEN** un visiteur qui navigue avec la touche Tabulation
- **WHEN** le focus arrive sur un bouton, un lien, une puce ou un champ
- **THEN** un contour rose de 2 px l'entoure

### Requirement: En-tête du template

L'en-tête SHALL suivre la grille en trois zones du template : liens d'univers à gauche, logo « Flowering® » (avec le ® en `--candy`) au centre, liens, bouton du panier et bouton de compte à droite. Il mesure 72 px de haut, 64 px sous 820 px. Sous 820 px, les liens laissent place à un bouton burger qui ouvre un menu plein écran aux grands liens (1,6 rem) ; ce menu MUST se fermer avec la touche Échap, le bouton de fermeture ou un choix de lien, et rendre le focus au bouton burger.

#### Scenario: En-tête sur bureau

- **GIVEN** un écran de 1440 px
- **WHEN** une page autre que l'accueil est affichée
- **THEN** l'en-tête a un fond `--bg`, une bordure basse `--line`, le logo « Flowering® » au centre et les zones gauche et droite de part et d'autre

#### Scenario: Menu mobile

- **GIVEN** un écran de 390 px
- **WHEN** le visiteur active le bouton « Menu », puis appuie sur Échap
- **THEN** le menu plein écran s'ouvre avec ses liens, puis se ferme
- **AND** le focus revient sur le bouton « Menu »

### Requirement: Pied de page du template

Le pied de page SHALL reprendre le bloc du template : fond `--soft` arrondi en haut (28 px), logo « Flowering® » et phrase de présentation, colonne « Boutique » (liens d'univers), colonne « Aide » (« Livraison et retours », « Devenir artisan », « Contact : bonjour@flowering.fr »), puis « © 2026 Flowering » et « Photos : Unsplash ». Sous 820 px, les colonnes s'empilent.

#### Scenario: Contenu du pied de page

- **GIVEN** n'importe quelle page
- **WHEN** le visiteur atteint le pied de page
- **THEN** il voit le logo, la phrase « La boutique des artisans indépendants. Objets faits main pour la maison, la table et le quotidien. », les colonnes « Boutique » et « Aide », « © 2026 Flowering » et « Photos : Unsplash »
- **AND** « Contact : bonjour@flowering.fr » ouvre un e-mail vers cette adresse

### Requirement: Unité visuelle des pages hors maquette

Les pages absentes du template (commande, confirmation, espace vendeur, pages d'administration supplémentaires, accès refusé, page introuvable) SHALL être construites uniquement avec les composants, couleurs, arrondis et espacements de cette charte, en reprenant la disposition de la page du template la plus proche (panneaux et tableaux de l'admin pour l'espace vendeur, panneaux de connexion pour la commande).

#### Scenario: Espace vendeur dans le style de l'admin

- **GIVEN** un vendeur sur son espace
- **WHEN** la page s'affiche
- **THEN** elle utilise le même menu latéral vert forêt, les mêmes panneaux `--soft` arrondis à 22 px et le même tableau que l'administration du template
