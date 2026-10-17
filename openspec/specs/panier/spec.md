# panier Specification

## Purpose
Permettre à tout visiteur, avec ou sans compte, de rassembler les produits qu'il veut acheter, d'en ajuster les quantités dans la limite du stock et de retrouver son panier en revenant sur la boutique.

## Requirements

### Requirement: Ajout au panier

Le bouton « Ajouter » de chaque carte produit (quantité 1) et le bouton « Ajouter au panier » de la fiche (quantité choisie) SHALL ajouter le produit au panier. L'ajout d'un produit déjà présent MUST augmenter sa quantité au lieu de créer une seconde ligne. Chaque ajout MUST afficher le toast « {Nom du produit} ajouté au panier ».

#### Scenario: Ajout depuis une carte

- **GIVEN** un visiteur au panier vide sur `/catalogue`
- **WHEN** il active « Ajouter » sur la carte « Tasses empilables Nuage »
- **THEN** le panier contient une ligne « Tasses empilables Nuage » en quantité 1
- **AND** le toast « Tasses empilables Nuage ajouté au panier » s'affiche

#### Scenario: Ajout d'un produit déjà présent

- **GIVEN** un panier contenant « Tasses empilables Nuage » en quantité 1
- **WHEN** le visiteur ajoute 2 « Tasses empilables Nuage » depuis la fiche produit
- **THEN** le panier contient une seule ligne pour ce produit, en quantité 3

### Requirement: Quantité limitée au stock

La quantité d'une ligne du panier SHALL être un entier compris entre 1 et le stock disponible du produit, réglée par les boutons − et + de la fiche, du tiroir et de la page panier. Le bouton + MUST être désactivé au stock maximal. Un ajout qui dépasserait le stock MUST porter la quantité au stock disponible et afficher « Stock insuffisant : {N} exemplaires disponibles. ».

#### Scenario: Quantité bornée dans le panier

- **GIVEN** un panier contenant « Tabouret haut Lin » (stock 2) en quantité 2
- **WHEN** le visiteur consulte la ligne
- **THEN** le bouton « Augmenter la quantité de Tabouret haut Lin » est désactivé et la quantité reste 2

#### Scenario: Ajout au-delà du stock

- **GIVEN** un panier contenant « Tabouret haut Lin » (stock 2) en quantité 1
- **WHEN** le visiteur en ajoute 3 depuis la fiche produit
- **THEN** la quantité passe à 2
- **AND** le message « Stock insuffisant : 2 exemplaires disponibles. » s'affiche

### Requirement: Retrait d'un article

Comme dans le template, le bouton − d'une ligne en quantité 1 SHALL retirer la ligne ; son nom accessible MUST alors être « Retirer {nom} du panier » (sinon « Diminuer la quantité de {nom} »). Le retrait MUST afficher le toast « {Nom du produit} retiré du panier ».

#### Scenario: Retirer une ligne

- **GIVEN** un panier contenant 1 « Tasses empilables Nuage » et 1 « Bougie ambre Forêt »
- **WHEN** le visiteur active « Retirer Tasses empilables Nuage du panier »
- **THEN** seule « Bougie ambre Forêt » reste dans le panier
- **AND** le toast « Tasses empilables Nuage retiré du panier » s'affiche

### Requirement: Tiroir du panier

Le bouton du panier de l'en-tête SHALL ouvrir le tiroir du template depuis la droite, titré « Panier », listant chaque ligne (vignette, nom, prix, − quantité +), puis « Total », la mention « Livraison offerte dès 80 € · {72 % du total, arrondi} reversés aux artisans » et le bouton de commande. Un panier vide MUST afficher « Votre panier est vide. » et un lien « Découvrir la boutique ».

#### Scenario: Tiroir d'un visiteur

- **GIVEN** un visiteur avec 2 « Tasses empilables Nuage » (34 €) et 1 « Bougie ambre Forêt » (32 €)
- **WHEN** il active le bouton du panier de l'en-tête
- **THEN** le tiroir s'ouvre avec les deux lignes, « Total » « 100 € » et « Livraison offerte dès 80 € · 72 € reversés aux artisans »

#### Scenario: Tiroir vide

- **GIVEN** un visiteur au panier vide
- **WHEN** il ouvre le tiroir
- **THEN** il voit « Votre panier est vide. » et le lien « Découvrir la boutique » vers `/catalogue`

### Requirement: Bouton de commande du panier

Le bouton de commande du tiroir et de la page panier SHALL être « Commander » (vers `/commande`) pour un utilisateur connecté et « Se connecter pour commander » (vers `/connexion?retour=/commande`) pour un visiteur ; le tiroir MUST se fermer à la navigation.

#### Scenario: Bouton d'un visiteur

- **GIVEN** un visiteur au panier non vide
- **WHEN** il ouvre le tiroir
- **THEN** le bouton affiché est « Se connecter pour commander »

#### Scenario: Tiroir d'un client

- **GIVEN** un client connecté au panier non vide
- **WHEN** il ouvre le tiroir et active « Commander »
- **THEN** le tiroir se ferme et il arrive sur `/commande`

### Requirement: Page panier

La page `/panier` SHALL afficher le même contenu que le tiroir (lignes, total, mention, bouton de commande ou panier vide) en page complète, avec les sous-totaux de chaque ligne au format du template.

#### Scenario: Calcul du total

- **GIVEN** un panier contenant 2 « Tasses empilables Nuage » (34 €) et 1 « Bougie ambre Forêt » (32 €)
- **WHEN** le visiteur ouvre `/panier`
- **THEN** les sous-totaux sont « 68 € » et « 32 € » et le total « 100 € »

### Requirement: Pastille du panier dans l'en-tête

Le bouton du panier de l'en-tête SHALL afficher la pastille rose du template avec le nombre total d'articles (somme des quantités), masquée quand le panier est vide. Son nom accessible MUST inclure ce nombre (« Panier, 3 articles »). La pastille MUST se mettre à jour immédiatement après chaque ajout, modification ou retrait.

#### Scenario: Pastille mise à jour

- **GIVEN** un visiteur au panier vide
- **WHEN** il ajoute 1 « Tasses empilables Nuage » puis 2 « Ustensiles en olivier »
- **THEN** la pastille affiche 3 et le bouton a pour nom accessible « Panier, 3 articles »

#### Scenario: Pastille masquée

- **GIVEN** un panier contenant un seul article
- **WHEN** le visiteur le retire
- **THEN** la pastille n'est plus affichée et le bouton a pour nom accessible « Panier »

### Requirement: Panier conservé dans le navigateur

Le panier SHALL être enregistré dans le navigateur (identifiants des produits et quantités) et restauré à chaque visite, que l'utilisateur soit connecté ou non ; la connexion et la déconnexion MUST le laisser intact. À la restauration, les prix et stocks MUST être relus depuis l'API : une ligne dont le produit n'est plus visible est retirée, une quantité supérieure au nouveau stock est ramenée au stock, et un message résume ces ajustements.

#### Scenario: Panier retrouvé après rechargement

- **GIVEN** un visiteur avec 2 « Tasses empilables Nuage » dans son panier
- **WHEN** il ferme l'onglet puis rouvre la boutique
- **THEN** son panier contient toujours 2 « Tasses empilables Nuage »

#### Scenario: Panier conservé à la connexion

- **GIVEN** un visiteur avec 1 « Bougie ambre Forêt » dans son panier
- **WHEN** il se connecte puis se déconnecte
- **THEN** son panier contient toujours 1 « Bougie ambre Forêt »

#### Scenario: Ajustement à la restauration

- **GIVEN** un panier enregistré contenant 4 « Tabouret de comptoir en frêne » et 1 produit devenu inactif, alors que le stock du tabouret est passé à 2
- **WHEN** le visiteur ouvre `/panier`
- **THEN** le panier contient 2 « Tabouret de comptoir en frêne » et plus le produit inactif
- **AND** le message « Votre panier a été mis à jour selon les stocks disponibles. » s'affiche
