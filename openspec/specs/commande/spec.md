# commande Specification

## Purpose
Transformer le panier en commande pour un utilisateur connecté (livraison, récapitulatif, contrôle du stock, confirmation) et lui permettre de suivre et d'annuler ses commandes depuis son espace client.

## Requirements

### Requirement: Connexion exigée avec panier conservé

Le bouton de commande du panier SHALL mener à `/commande`. Un visiteur non connecté MUST passer par la connexion (ou l'inscription) puis arriver sur `/commande` avec son panier intact.

#### Scenario: Visiteur qui commande

- **GIVEN** un visiteur non connecté avec 2 « Tasses empilables Nuage » dans son panier
- **WHEN** il active « Se connecter pour commander », puis se connecte avec le compte client
- **THEN** il arrive sur `/commande`
- **AND** son panier contient toujours 2 « Tasses empilables Nuage »

#### Scenario: Visiteur qui crée un compte pour commander

- **GIVEN** un visiteur non connecté avec 1 « Bougie ambre Forêt » dans son panier, arrivé sur la page de connexion
- **WHEN** il passe à l'onglet « Créer un compte » et s'inscrit
- **THEN** il arrive sur `/commande` avec son panier intact

### Requirement: Commande impossible avec un panier vide

Un utilisateur connecté qui ouvre `/commande` avec un panier vide SHALL être redirigé vers `/panier`.

#### Scenario: Panier vide

- **GIVEN** un client connecté au panier vide
- **WHEN** il ouvre `/commande`
- **THEN** il est redirigé vers `/panier`, qui affiche « Votre panier est vide. »

### Requirement: Formulaire de livraison

La page `/commande` SHALL demander l'adresse de livraison : nom complet (prérempli avec le nom de l'utilisateur), adresse, code postal, ville et téléphone. Règles : tous les champs obligatoires ; code postal de 5 chiffres ; téléphone français à 10 chiffres commençant par 0 (espaces autorisés). Les erreurs MUST s'afficher sous chaque champ et être reliées au champ ; la soumission d'un formulaire invalide MUST placer le focus sur le premier champ invalide.

#### Scenario: Nom prérempli

- **GIVEN** le client « Lucas Martin » connecté avec un panier non vide
- **WHEN** il ouvre `/commande`
- **THEN** le champ « Nom complet » contient « Lucas Martin »

#### Scenario: Champs invalides

- **GIVEN** un client sur `/commande`
- **WHEN** il saisit le code postal `750` et le téléphone `12345`, laisse la ville vide et valide
- **THEN** il voit « Le code postal doit contenir 5 chiffres. », « Saisissez un numéro de téléphone valide. » et « Ce champ est obligatoire. » sous les champs concernés
- **AND** aucune commande n'est créée

### Requirement: Récapitulatif avant confirmation

Après une saisie valide de la livraison, la page SHALL afficher un récapitulatif : lignes (vignette, produit, quantité, prix unitaire, sous-total), total et adresse de livraison, avec les boutons « Modifier l'adresse » et « Confirmer la commande ». Aucune commande MUST être créée avant l'activation de « Confirmer la commande ».

#### Scenario: Récapitulatif affiché

- **GIVEN** un client avec 2 « Tasses empilables Nuage » qui a saisi une adresse valide
- **WHEN** il passe à l'étape suivante
- **THEN** il voit la ligne « Tasses empilables Nuage × 2 — 68 € », le total « 68 € » et son adresse
- **AND** aucune commande n'existe encore dans l'API

#### Scenario: Retour à l'adresse

- **GIVEN** un client sur le récapitulatif
- **WHEN** il active « Modifier l'adresse »
- **THEN** le formulaire de livraison réapparaît avec les valeurs saisies

### Requirement: Création de la commande

La confirmation SHALL créer une commande au statut `en_attente` avec l'identifiant du client connecté, une ligne par produit (prix unitaire relu au moment de la confirmation), le total, l'adresse de livraison et la date de création. Elle MUST ensuite diminuer le stock de chaque produit de la quantité commandée, vider le panier, afficher le toast « Commande n° {id} enregistrée » et mener à `/commande/confirmation/:id`.

#### Scenario: Commande réussie

- **GIVEN** le client (id 2) avec 2 « Tasses empilables Nuage » (stock 18, 34 €) qui confirme sa commande
- **WHEN** la création réussit
- **THEN** une commande `en_attente` existe avec `clientId: 2`, une ligne `{ produitId: 1, quantite: 2, prixUnitaire: 34 }` et un total de 68
- **AND** le stock des « Tasses empilables Nuage » vaut 16
- **AND** le panier est vide et la pastille masquée
- **AND** il arrive sur `/commande/confirmation/{id}`

#### Scenario: Page de confirmation

- **GIVEN** un client dont la commande n° 7 vient d'être créée
- **WHEN** la page de confirmation s'affiche
- **THEN** il voit « Merci pour votre commande ! », le numéro 7, le total, et un lien « Voir mes commandes » vers `/compte`

#### Scenario: Confirmation d'une commande d'un autre client

- **GIVEN** un client connecté
- **WHEN** il ouvre `/commande/confirmation/{id}` d'une commande d'un autre client
- **THEN** la page affiche « Commande introuvable »

### Requirement: Contrôle du stock à la confirmation

Au moment de la confirmation, les stocks SHALL être relus depuis l'API. Si un produit n'est plus visible ou n'a plus assez de stock, aucune commande MUST être créée, le panier MUST être ajusté (comme à sa restauration) et l'utilisateur ramené au panier avec le message « Certains produits ne sont plus disponibles dans la quantité demandée. Vérifiez votre panier. ».

#### Scenario: Stock épuisé entre-temps

- **GIVEN** un client avec 2 « Tabouret haut Lin » dans son panier, dont le stock vient de passer à 1
- **WHEN** il confirme sa commande
- **THEN** aucune commande n'est créée
- **AND** il arrive sur `/panier` où la quantité vaut 1, avec le message d'indisponibilité

### Requirement: Mes commandes

L'espace client `/compte` SHALL lister, sous son en-tête, les commandes de l'utilisateur connecté, et seulement les siennes, de la plus récente à la plus ancienne, au format du template : vignettes (trois au plus), articles, « n° {id} · {date} », pastille de statut et total. Sans commande, la page affiche « Vous n'avez pas encore passé de commande. » et un lien vers la boutique.

#### Scenario: Liste de ses commandes

- **GIVEN** le client avec deux commandes et un autre client avec une commande
- **WHEN** le client ouvre `/compte`
- **THEN** il voit ses deux commandes, la plus récente en premier, chacune avec ses vignettes, ses articles (par exemple « Tasses empilables Nuage × 2, Bougie ambre Forêt »), son numéro et sa date, sa pastille de statut (« En attente », « Expédiée », « Livrée » ou « Annulée ») et son total
- **AND** il ne voit pas la commande de l'autre client

#### Scenario: Aucune commande

- **GIVEN** un client qui n'a jamais commandé
- **WHEN** il ouvre `/compte`
- **THEN** il voit « Vous n'avez pas encore passé de commande. »

#### Scenario: Accès refusé à Mes commandes pour un visiteur

- **GIVEN** un visiteur non connecté
- **WHEN** il ouvre `/compte`
- **THEN** il est redirigé vers `/connexion?retour=/compte`

### Requirement: Annulation par le client

Une commande `en_attente` SHALL proposer un bouton « Annuler la commande » à son auteur, qui ouvre une fenêtre de confirmation « Voulez-vous vraiment annuler la commande n° {id} ? » (« Oui, annuler » / « Non »). L'annulation MUST passer la commande au statut `annulee` et afficher le toast « La commande n° {id} a été annulée. ». Les commandes dans un autre statut MUST ne pas proposer ce bouton.

#### Scenario: Annuler une commande en attente

- **GIVEN** un client avec la commande n° 7 `en_attente`
- **WHEN** il active « Annuler la commande » puis « Oui, annuler »
- **THEN** la commande n° 7 a le statut « Annulée »
- **AND** le toast « La commande n° 7 a été annulée. » s'affiche

#### Scenario: Renoncer à l'annulation

- **GIVEN** un client sur la confirmation d'annulation de la commande n° 7
- **WHEN** il choisit « Non »
- **THEN** la fenêtre se ferme et la commande reste `en_attente`

#### Scenario: Commande expédiée non annulable

- **GIVEN** un client avec une commande `expediee`
- **WHEN** il consulte `/compte`
- **THEN** aucun bouton « Annuler la commande » n'est proposé pour cette commande

### Requirement: Remise en stock à l'annulation

Toute commande qui passe au statut `annulee`, quelle que soit l'origine de l'annulation, SHALL rendre au stock de chaque produit la quantité de sa ligne. Une commande déjà annulée MUST ne jamais être remise en stock une seconde fois.

#### Scenario: Stock rétabli

- **GIVEN** la commande n° 7 `en_attente` avec 2 « Tasses empilables Nuage », dont le stock vaut 16
- **WHEN** son auteur l'annule
- **THEN** le stock des « Tasses empilables Nuage » vaut 18
