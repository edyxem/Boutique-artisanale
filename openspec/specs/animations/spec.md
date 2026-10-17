# animations Specification

## Purpose
Rendre Flowering vivant et fluide (transitions, apparitions, retours visuels) dans l'esprit du template, sans jamais gêner la lecture, la performance ni les personnes sensibles au mouvement.

## Requirements

### Requirement: Mouvement réduit respecté

Quand l'utilisateur a activé la réduction des animations (`prefers-reduced-motion: reduce`), l'application SHALL supprimer tous les déplacements, zooms, rotations et défilements animés, et réduire les fondus à 0,01 s au plus. Les compteurs MUST afficher directement leur valeur finale et les transitions entre pages MUST être ignorées. Aucune information ni action MUST dépendre d'une animation.

#### Scenario: Ouverture du tiroir sans animation

- **GIVEN** un utilisateur avec la réduction des animations activée
- **WHEN** il ouvre le tiroir du panier
- **THEN** le tiroir apparaît immédiatement à sa place, sans glissement

#### Scenario: Compteur sans animation

- **GIVEN** un utilisateur avec la réduction des animations activée
- **WHEN** une tuile de statistique apparaît
- **THEN** elle affiche directement sa valeur finale

### Requirement: Transitions entre les pages

Lors d'une navigation interne, l'ancienne page SHALL disparaître en fondu et la nouvelle apparaître en fondu avec une montée de 8 px, en 0,3 s, grâce aux transitions de vues du navigateur quand elles sont disponibles (sinon la page change sans animation). Après la navigation, la page MUST revenir en haut (ou à la position mémorisée lors d'un retour arrière) et le focus MUST être placé sur le titre principal de la nouvelle page.

#### Scenario: Navigation animée

- **GIVEN** un visiteur sur le catalogue, dans un navigateur qui gère les transitions de vues
- **WHEN** il navigue vers `/panier`
- **THEN** la page du catalogue s'efface et celle du panier apparaît en fondu montant de 0,3 s
- **AND** le focus est sur le titre principal de la page Panier

#### Scenario: Retour arrière

- **GIVEN** un visiteur qui a défilé jusqu'au bas du catalogue puis ouvert une fiche produit
- **WHEN** il revient en arrière
- **THEN** le catalogue réapparaît à la position où il l'avait quitté

### Requirement: Éléments partagés entre pages

Un élément présent sur deux pages consécutives (par exemple la photo d'un produit dans sa carte puis sur sa fiche) SHALL pouvoir être marqué comme partagé : pendant la transition, il se déplace et se redimensionne de sa position d'origine à sa position d'arrivée au lieu de disparaître puis réapparaître.

#### Scenario: Photo partagée

- **GIVEN** une carte produit et la fiche du même produit, dont les photos sont marquées comme partagées
- **WHEN** le visiteur passe de la carte à la fiche
- **THEN** la photo glisse et s'agrandit de la carte jusqu'à son emplacement sur la fiche

### Requirement: Apparitions au défilement

Les sections, cartes et tuiles marquées comme « à révéler » SHALL apparaître en fondu avec une montée de 16 px (0,3 s) quand elles entrent dans l'écran, une seule fois. Les éléments d'une même grille MUST apparaître en cascade (60 ms d'écart, 8 éléments au plus avant que le reste n'apparaisse ensemble). Les éléments déjà visibles au chargement MUST apparaître sans attendre de défilement.

#### Scenario: Cascade d'une grille

- **GIVEN** une grille de 8 cartes située sous la ligne de flottaison
- **WHEN** le visiteur la fait défiler jusqu'à l'écran
- **THEN** les cartes apparaissent l'une après l'autre à 60 ms d'intervalle
- **AND** elles ne se réaniment pas si le visiteur remonte puis redescend

### Requirement: Survols et pressions

Sur les appareils qui gèrent le survol, les effets du template SHALL s'appliquer : zoom de la photo produit (1,04 en 0,3 s) et des tuiles d'univers (1,06), rotation de −45° du bouton rond, opacité 0,9 des boutons pleins, contour assombri des boutons contour, soulignement glissant des liens de navigation. Sur tout appareil, un bouton pressé MUST se compresser légèrement (`scale(.98)`). Les effets de survol MUST ne pas se déclencher au toucher sur mobile.

#### Scenario: Survol d'une carte

- **GIVEN** un visiteur avec une souris sur le catalogue
- **WHEN** il survole une carte produit
- **THEN** la photo grossit progressivement jusqu'à 1,04 en 0,3 s, sans déborder de son cadre arrondi

#### Scenario: Toucher sur mobile

- **GIVEN** un visiteur sur téléphone
- **WHEN** il touche une carte produit
- **THEN** aucun zoom de survol ne reste figé sur la photo

### Requirement: Ouverture et fermeture des surfaces

Les surfaces superposées SHALL s'animer comme dans le template : voile en fondu (0,3 s) ; modale en fondu avec une légère montée (0,3 s) ; tiroir glissant depuis la droite (0,3 s, courbe `cubic-bezier(.2,.8,.2,1)`) ; toast montant depuis le bas ; menu mobile en fondu avec ses liens en cascade et l'icône burger qui se transforme en croix. La fermeture MUST jouer l'animation inverse avant de retirer la surface.

#### Scenario: Fermeture animée de la modale

- **GIVEN** une modale ouverte
- **WHEN** l'utilisateur la ferme
- **THEN** elle s'efface en fondu descendant, puis le voile disparaît, avant que la modale ne soit retirée de la page

#### Scenario: Menu mobile en cascade

- **GIVEN** un écran de 390 px
- **WHEN** le visiteur ouvre le menu
- **THEN** les deux traits du burger pivotent pour former une croix et les liens apparaissent l'un après l'autre

### Requirement: Retours visuels des formulaires

Les formulaires SHALL donner un retour immédiat : les messages d'erreur apparaissent en se dépliant sous le champ ; une soumission invalide fait légèrement trembler le bouton d'envoi (une fois, 0,3 s) et place le focus sur le premier champ invalide ; un envoi en cours affiche l'indicateur de chargement du bouton ; un envoi réussi affiche brièvement une coche dans le bouton avant la suite.

#### Scenario: Soumission invalide

- **GIVEN** un formulaire avec un champ obligatoire vide
- **WHEN** l'utilisateur l'envoie
- **THEN** le bouton d'envoi tremble une fois, le message d'erreur se déplie sous le champ et le focus va sur ce champ

### Requirement: Compteurs animés

Les grands chiffres marqués comme compteurs (statistiques, pourcentages) SHALL défiler de 0 jusqu'à leur valeur en 0,3 s, avec un ralentissement final, la première fois qu'ils deviennent visibles. La valeur exacte MUST être lisible par les technologies d'assistance dès le départ.

#### Scenario: Statistique qui défile

- **GIVEN** une tuile dont la valeur est 9
- **WHEN** elle entre dans l'écran
- **THEN** le chiffre passe de 0 à 9 en 0,3 s puis reste à 9
- **AND** son nom accessible indique 9 dès l'affichage

### Requirement: Fluidité des animations

Les animations SHALL n'animer que l'opacité et les transformations (hors dépliement des messages d'erreur), durer entre 0,2 et 0,3 s, être déclarées avec les utilitaires Tailwind sous `motion-safe:` lorsqu'elles sont en CSS, et utiliser la courbe du template `cubic-bezier(.2,.8,.2,1)` pour les déplacements. Elles MUST ne provoquer aucun décalage de mise en page (CLS inférieur à 0,1 sur chaque page) et garder une animation fluide sur un téléphone de milieu de gamme.

#### Scenario: Mesure de stabilité

- **GIVEN** les pages accueil, catalogue, fiche produit et administration
- **WHEN** on mesure leur chargement avec l'outil Lighthouse du navigateur (profil mobile)
- **THEN** le Cumulative Layout Shift de chaque page est inférieur à 0,1
