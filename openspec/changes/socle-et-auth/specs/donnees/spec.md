# Spec Delta : donnees

## Purpose

Fournir les données de la boutique : une API REST simulée et locale, un jeu de données d'exemple cohérent et les modèles des entités métier partagés par toutes les fonctionnalités.

## ADDED Requirements

### Requirement: Ressources REST de la boutique

L'API simulée SHALL écouter sur `http://localhost:3000` et exposer les ressources `users`, `vendeurs`, `categories`, `produits` et `commandes`, lisibles par `GET /<ressource>` et `GET /<ressource>/<id>`, et modifiables par `POST`, `PATCH` et `DELETE`.

#### Scenario: Lister les produits

- **GIVEN** l'API simulée est démarrée avec le jeu de données d'exemple
- **WHEN** un client HTTP envoie `GET http://localhost:3000/produits`
- **THEN** la réponse a le statut 200 et contient 10 produits

#### Scenario: Ressource inexistante

- **GIVEN** l'API simulée est démarrée
- **WHEN** un client HTTP envoie `GET http://localhost:3000/produits/9999`
- **THEN** la réponse a le statut 404

### Requirement: Mots de passe protégés

Les mots de passe SHALL être stockés hachés en bcrypt dans le fichier de données, jamais en clair, et l'API MUST ne jamais renvoyer le champ `password` dans ses réponses, y compris pour `GET /users` et `GET /users/<id>`.

#### Scenario: Aucun mot de passe en clair

- **GIVEN** le fichier de données d'exemple
- **WHEN** on lit le champ `password` de chaque utilisateur
- **THEN** chaque valeur est un hachage bcrypt (préfixe `$2a$` ou `$2b$`)

#### Scenario: Mot de passe absent des réponses

- **GIVEN** l'API simulée est démarrée
- **WHEN** un client HTTP envoie `GET /users` puis `GET /users/1`
- **THEN** aucun objet utilisateur renvoyé ne contient de champ `password`

### Requirement: Jeu de données d'exemple

Le jeu de données d'exemple SHALL contenir 10 produits, 4 catégories, 2 vendeurs au statut `valide` et 4 utilisateurs actifs : 1 `admin`, 1 `client` et 2 `vendeur`, chacun de ces derniers rattaché à l'un des deux vendeurs. La collection `commandes` MUST exister et être vide. Chaque catégorie et chaque vendeur MUST posséder au moins un produit ; au moins un produit MUST être inactif et au moins un MUST avoir un stock nul.

#### Scenario: Volumes attendus

- **GIVEN** le fichier de données d'exemple
- **WHEN** on compte les éléments de chaque collection
- **THEN** on trouve 10 produits, 4 catégories, 2 vendeurs, 4 utilisateurs et 0 commande

#### Scenario: Répartition des rôles

- **GIVEN** le fichier de données d'exemple
- **WHEN** on regroupe les utilisateurs par rôle
- **THEN** on trouve 1 `admin`, 1 `client` et 2 `vendeur`, tous actifs

#### Scenario: Cas limites présents

- **GIVEN** le fichier de données d'exemple
- **WHEN** on parcourt les produits
- **THEN** chaque catégorie et chaque vendeur possèdent au moins un produit
- **AND** au moins un produit a `actif: false` et au moins un produit a `stock: 0`

### Requirement: Contenu d'exemple issu du template

Les produits, catégories et boutiques du jeu de données SHALL reprendre le contenu de `design-template/template.html` (noms, descriptions, prix, ateliers, univers), et chaque produit MUST utiliser une photo de `design-template/images/`.

#### Scenario: Photos du template

- **GIVEN** le fichier de données d'exemple
- **WHEN** on lit les images de chaque produit
- **THEN** chacune est un chemin `/images/{fichier}.jpg` dont le fichier existe dans `design-template/images/`

### Requirement: Comptes de démonstration

Chaque utilisateur du jeu de données SHALL pouvoir se connecter via `POST /login` avec son email et le mot de passe de démonstration documenté dans le README.

#### Scenario: Connexion d'un compte de démonstration

- **GIVEN** l'API simulée est démarrée avec le jeu de données d'exemple
- **WHEN** un client HTTP envoie `POST /login` avec `admin@boutique.fr` et le mot de passe documenté
- **THEN** la réponse a le statut 200 et contient un `accessToken` et l'utilisateur sans mot de passe

### Requirement: Modèle Utilisateur

Un utilisateur SHALL être décrit par `id`, `nom`, `email`, `motDePasse`, `role` et `actif`. Le rôle MUST valoir `client`, `vendeur` ou `admin`. Les emails MUST être uniques. Dans l'API, le mot de passe est stocké dans le champ `password` imposé par json-server-auth.

#### Scenario: Utilisateurs d'exemple conformes

- **GIVEN** le fichier de données d'exemple
- **WHEN** on contrôle chaque utilisateur
- **THEN** chacun a un `nom` non vide, un `email` valide et unique, un `role` autorisé et un booléen `actif`

### Requirement: Modèle Vendeur

Un vendeur SHALL être décrit par `id`, `utilisateurId`, `nomBoutique`, `description` et `statut`. Le statut MUST valoir `en_attente`, `valide` ou `refuse`. Un utilisateur MUST être rattaché à au plus un vendeur.

#### Scenario: Vendeurs d'exemple conformes

- **GIVEN** le fichier de données d'exemple
- **WHEN** on résout l'`utilisateurId` de chaque vendeur
- **THEN** chaque vendeur référence un utilisateur existant de rôle `vendeur`, différent pour chaque vendeur
- **AND** chaque statut est l'une des trois valeurs autorisées

### Requirement: Modèle Catégorie

Une catégorie SHALL être décrite par `id`, `nom` et `slug`. Le slug MUST être unique et composé de minuscules non accentuées, de chiffres et de tirets.

#### Scenario: Slugs valides et uniques

- **GIVEN** le fichier de données d'exemple
- **WHEN** on contrôle le slug de chaque catégorie
- **THEN** chaque slug respecte le format et aucun n'apparaît deux fois

### Requirement: Modèle Produit

Un produit SHALL être décrit par `id`, `nom`, `description`, `prix`, `stock`, `images` (chemins d'images de la bibliothèque du site `/images/…`, au moins un), `categorieId`, `vendeurId` et `actif`. Le prix MUST être strictement positif, le stock un entier positif ou nul, et `categorieId` / `vendeurId` MUST référencer des enregistrements existants.

#### Scenario: Produits d'exemple conformes

- **GIVEN** le fichier de données d'exemple
- **WHEN** on contrôle chaque produit
- **THEN** chacun a un `nom` non vide, un `prix` > 0, un `stock` entier ≥ 0, au moins une image et un booléen `actif`
- **AND** son `categorieId` et son `vendeurId` existent

### Requirement: Modèle Commande

Une commande SHALL être décrite par `id`, `clientId`, `lignes` (chacune avec `produitId`, `quantite` entière > 0 et `prixUnitaire`), `total`, `adresseLivraison` (`nomComplet`, `adresse`, `codePostal`, `ville`, `telephone`), `statut` et `dateCreation` (ISO 8601). Le statut MUST valoir `en_attente`, `expediee`, `livree` ou `annulee`.

#### Scenario: Commande conforme acceptée par le typage

- **GIVEN** une commande avec une ligne `{ produitId: 1, quantite: 2, prixUnitaire: 15 }`, un total de 30, une adresse complète, le statut `en_attente` et une date ISO 8601
- **WHEN** elle est déclarée comme une Commande
- **THEN** la compilation TypeScript réussit

#### Scenario: Statut inconnu refusé par le typage

- **GIVEN** une commande dont le statut vaut `payee`
- **WHEN** elle est déclarée comme une Commande
- **THEN** la compilation TypeScript échoue

### Requirement: Lancement de l'environnement de développement

Le projet SHALL fournir `npm run api`, qui démarre l'API simulée seule, et `npm run dev`, qui démarre l'API et l'application Angular ensemble. L'arrêt de `npm run dev` MUST arrêter les deux processus.

#### Scenario: Lancer l'API et Angular ensemble

- **GIVEN** les dépendances sont installées
- **WHEN** le développeur exécute `npm run dev`
- **THEN** l'API répond sur `http://localhost:3000` et l'application sur `http://localhost:4200`

#### Scenario: Arrêt groupé

- **GIVEN** `npm run dev` est en cours d'exécution
- **WHEN** le développeur l'interrompt (Ctrl+C) ou que l'un des deux processus s'arrête
- **THEN** ni le port 3000 ni le port 4200 ne restent occupés
