# accueil Specification

## Purpose
Offrir la page d'accueil du template : présenter Flowering, ses artisans et son prix juste, mettre en avant une sélection de produits et mener vers les univers du catalogue.

## Requirements

### Requirement: Hero de l'accueil

L'accueil `/` SHALL s'ouvrir sur le hero du template : photo `hero-accueil.jpg` plein cadre avec dégradé, cinq étoiles et « 4,9 · d'après 1 240 avis », le titre « L'objet juste, fait par des mains qui ont un nom. », les deux colonnes de texte du template, un bouton « Découvrir la boutique » et un bouton rond fléché menant tous deux à `/catalogue`. Le hero mesure `min(86vh, 760px)` de haut.

#### Scenario: Contenu du hero

- **GIVEN** un visiteur
- **WHEN** il ouvre `/`
- **THEN** il voit le titre « L'objet juste, fait par des mains qui ont un nom. », la note « 4,9 » et le bouton « Découvrir la boutique »
- **AND** activer « Découvrir la boutique » mène à `/catalogue`

### Requirement: En-tête superposé sur l'accueil

Sur l'accueil, l'en-tête SHALL se superposer au hero, sans fond et en texte blanc. Dès que le hero n'est plus visible sous l'en-tête, celui-ci MUST reprendre son apparence normale (fond `--bg`, texte `--ink`, bordure basse) par une transition de 0,3 s, et la retrouver en remontant.

#### Scenario: En-tête au défilement

- **GIVEN** un visiteur en haut de l'accueil
- **WHEN** il fait défiler la page au-delà du hero, puis remonte en haut
- **THEN** l'en-tête passe de transparent à texte blanc, à fond clair à texte foncé, puis redevient transparent

### Requirement: Bloc engagement

L'accueil SHALL présenter le bloc « Notre engagement » du template sur fond `--mint` : la phrase « Chez Flowering, nous réunissons des artisans qui façonnent des objets du quotidien faits pour durer des années. », avec les trois petites photos en pilule insérées dans le texte (`engagement-portrait-1.jpg`, `engagement-ceramique.jpg`, `engagement-portrait-2.jpg`), et un bouton « Voir les créations » vers `/catalogue`.

#### Scenario: Bloc engagement

- **GIVEN** un visiteur sur l'accueil
- **WHEN** il atteint le bloc engagement
- **THEN** il lit la phrase d'engagement avec ses trois photos en pilule et voit « Voir les créations »

### Requirement: Sélection de produits

La section « Fait main, livré chez vous » SHALL afficher la carte mise en avant « Art de la table » (photo `mise-en-avant-art-de-la-table.jpg`, bouton « Explorer » vers `/catalogue?categorie=ceramique`) suivie des 7 premiers produits visibles du catalogue (par identifiant), présentés avec la carte produit du catalogue.

#### Scenario: Sélection du jeu d'exemple

- **GIVEN** le jeu de données d'exemple (9 produits visibles)
- **WHEN** un visiteur atteint la sélection
- **THEN** il voit la carte « Art de la table » puis 7 cartes produit, la première étant « Tasses empilables Nuage »
- **AND** « Bols en bois tourné », inactif, n'y figure pas

### Requirement: Prix juste et simulateur

Le bloc « Un prix juste pour celles et ceux qui fabriquent » SHALL afficher sur fond vert forêt le chiffre « 72 % » et son explication, un bouton « Acheter une pièce » vers `/catalogue`, et un simulateur : un curseur de 20 à 600 € (120 € par défaut, libellé « Votre achat ») recalcule en direct le montant, la barre de répartition (Artisan 72 %, Livraison & emballage 14 %, Boutique 14 %), les montants arrondis à l'euro et la note « {montant artisan} versés à l'atelier sous 7 jours ».

#### Scenario: Valeur par défaut

- **GIVEN** un visiteur qui atteint le bloc prix juste
- **WHEN** le simulateur s'affiche
- **THEN** il indique « 120 € », Artisan « 86 € », Livraison & emballage « 17 € », Boutique « 17 € » et « 86 € versés à l'atelier sous 7 jours »

#### Scenario: Déplacement du curseur

- **GIVEN** le simulateur à 120 €
- **WHEN** le visiteur règle le curseur sur 300 € (souris, toucher ou flèches du clavier)
- **THEN** il indique « 300 € », Artisan « 216 € » et « 216 € versés à l'atelier sous 7 jours »
- **AND** le curseur annonce sa valeur « 300 € » aux technologies d'assistance

### Requirement: Comment fonctionne Flowering

L'accueil SHALL présenter la section « Comment fonctionne Flowering » (ancre `comment-ca-marche`, cible du lien « Nos artisans ») avec les trois étapes du template : « Des ateliers sélectionnés », « Fabriqué à la commande », « Livré et suivi », chacune avec sa photo 4:3 (`etape-1-atelier.jpg`, `etape-2-tour-potier.jpg`, `etape-3-mains-argile.jpg`) et son texte ; la première carte est vert forêt.

#### Scenario: Lien « Nos artisans »

- **GIVEN** un visiteur sur `/catalogue`
- **WHEN** il active « Nos artisans » dans l'en-tête
- **THEN** il arrive sur l'accueil, défilé jusqu'à la section « Comment fonctionne Flowering », qui reçoit le focus

### Requirement: Parcourir par univers

La section « Parcourir par univers » SHALL afficher une tuile ronde par catégorie (photo `categorie-{slug}.jpg`, ou la photo de son premier produit si ce fichier n'existe pas), son nom et « {N} créations » où N est le nombre de produits visibles de la catégorie. Chaque tuile mène à `/catalogue?categorie={slug}` ; un lien « Tout voir » mène à `/catalogue`.

#### Scenario: Tuiles du jeu d'exemple

- **GIVEN** le jeu de données d'exemple
- **WHEN** un visiteur atteint les univers
- **THEN** il voit « Céramique — 3 créations », « Mobilier — 2 créations », « Cuisine — 2 créations » et « Maison — 2 créations »
- **AND** activer « Mobilier » mène à `/catalogue?categorie=mobilier`
