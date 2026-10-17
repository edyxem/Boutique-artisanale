# administration Specification

## Purpose
Donner à l'administrateur un panel unique, `/admin`, pour piloter la boutique : aperçu, catalogue (catégories et produits), vendeurs, comptes utilisateurs et commandes.

## Requirements

### Requirement: Navigation de l'administration

Toutes les pages `/admin` SHALL afficher le menu latéral vert forêt du template, nommé « Menu d'administration », avec les entrées Aperçu, Produits, Commandes, Catégories, Vendeurs et Utilisateurs ; l'entrée de la page courante MUST être signalée comme page courante. `/admin` MUST mener à `/admin/apercu`. Sous 820 px, le menu MUST devenir une barre horizontale au-dessus du contenu, comme dans le template.

#### Scenario: Menu latéral

- **GIVEN** l'administrateur connecté
- **WHEN** il ouvre `/admin`
- **THEN** il arrive sur `/admin/apercu`
- **AND** le menu affiche les six entrées, « Aperçu » étant signalée comme page courante

#### Scenario: Accès refusé aux pages d'administration

- **GIVEN** un vendeur connecté, puis un visiteur
- **WHEN** chacun ouvre `/admin/utilisateurs`
- **THEN** le vendeur est redirigé vers `/acces-refuse`
- **AND** le visiteur vers `/connexion?retour=/admin/utilisateurs`

### Requirement: Aperçu

La page `/admin/apercu` SHALL afficher, sous le sur-titre « Administration » et le titre « Aperçu », quatre tuiles de statistique : produits actifs, commandes en attente, demandes de vendeur en attente et utilisateurs. Chaque tuile MUST mener à la liste correspondante, filtrée quand c'est pertinent.

#### Scenario: Tuiles du jeu d'exemple

- **GIVEN** le jeu de données d'exemple, plus une demande de vendeur `en_attente` et une commande `en_attente`
- **WHEN** l'administrateur ouvre l'aperçu
- **THEN** il voit 9 produits actifs, 1 commande en attente, 1 demande de vendeur en attente et 4 utilisateurs

#### Scenario: Lien vers les demandes en attente

- **GIVEN** l'administrateur sur l'aperçu
- **WHEN** il active la tuile des demandes de vendeur en attente
- **THEN** il arrive sur `/admin/vendeurs?statut=en_attente`

### Requirement: Gestion des catégories

La page `/admin/categories` SHALL lister les catégories dans le tableau du template (recherche, tri, pagination) et permettre de les créer et de les modifier avec un même formulaire en fenêtre modale : nom (requis, 2 à 50 caractères, unique) et slug (proposé automatiquement à partir du nom, modifiable, format minuscules-chiffres-tirets, unique). Chaque enregistrement MUST afficher un toast de succès ou d'erreur.

#### Scenario: Création avec slug proposé

- **GIVEN** l'administrateur sur le formulaire de création de catégorie
- **WHEN** il saisit le nom « Vannerie & Osier »
- **THEN** le slug proposé est « vannerie-osier »
- **AND** après enregistrement, la catégorie apparaît dans la liste et le toast « La catégorie Vannerie & Osier a été créée. » s'affiche

#### Scenario: Slug déjà utilisé

- **GIVEN** l'administrateur sur le formulaire de catégorie
- **WHEN** il saisit le slug « mobilier » pour une nouvelle catégorie
- **THEN** le message « Ce slug est déjà utilisé. » s'affiche et rien n'est enregistré

### Requirement: Suppression d'une catégorie

Une catégorie SHALL pouvoir être supprimée avec la confirmation en deux clics du template, sauf si des produits y sont rattachés : l'API MUST alors répondre 409 et l'interface afficher « Cette catégorie contient des produits : déplacez-les avant de la supprimer. ».

#### Scenario: Suppression d'une catégorie vide

- **GIVEN** la catégorie « Vannerie & Osier » sans produit
- **WHEN** l'administrateur active « Supprimer » puis « Confirmer » dans les 3 s
- **THEN** elle n'existe plus et le toast « La catégorie Vannerie & Osier a été supprimée. » s'affiche

#### Scenario: Catégorie utilisée

- **GIVEN** la catégorie « Mobilier », qui contient des produits
- **WHEN** l'administrateur confirme sa suppression
- **THEN** elle est conservée et le message de catégorie non vide s'affiche

### Requirement: Gestion des produits

La page `/admin/produits` SHALL lister tous les produits, de toutes les boutiques, dans le tableau du template (vignette, nom, boutique, catégorie, prix, stock, état) avec recherche, tri, pagination et filtre par boutique, et un bouton « Nouveau produit ». L'administrateur MUST pouvoir créer, modifier et supprimer (confirmation en deux clics) n'importe quel produit avec le formulaire en modale des vendeurs, complété d'un champ « Boutique » requis. Chaque action MUST afficher un toast.

#### Scenario: Liste de tous les produits

- **GIVEN** le jeu de données d'exemple
- **WHEN** l'administrateur ouvre `/admin/produits`
- **THEN** il voit les 10 produits, actifs ou non, avec leur boutique

#### Scenario: Modification du produit d'un vendeur

- **GIVEN** l'administrateur sur `/admin/produits/10` (« Bols en bois tourné », inactif)
- **WHEN** il coche « Actif » et enregistre
- **THEN** le produit est actif et le toast « Le produit Bols en bois tourné a été modifié. » s'affiche

#### Scenario: Suppression par l'administrateur

- **GIVEN** un produit jamais commandé
- **WHEN** l'administrateur active « Supprimer » puis « Confirmer » dans les 3 s
- **THEN** il n'existe plus et le toast « Le produit {nom} a été supprimé. » s'affiche

### Requirement: Liste des vendeurs

La page `/admin/vendeurs` SHALL lister les vendeurs (boutique, titulaire, e-mail, pastille de statut, compte actif ou non) dans le tableau du template, avec recherche, tri, pagination et filtre par statut repris dans l'URL.

#### Scenario: Filtrer les demandes en attente

- **GIVEN** deux vendeurs validés et une demande `en_attente`
- **WHEN** l'administrateur ouvre `/admin/vendeurs?statut=en_attente`
- **THEN** seule la demande en attente est listée et le filtre « En attente » est actif

### Requirement: Actions sur les vendeurs

Les actions d'un vendeur SHALL dépendre de son état : « Valider » et « Refuser » pour une demande `en_attente` ; « Désactiver » pour un vendeur validé actif ; « Réactiver » pour un vendeur validé désactivé. « Refuser » et « Désactiver » MUST être confirmés dans une fenêtre modale ; chaque action est suivie d'un toast.

#### Scenario: Valider une demande

- **GIVEN** la demande `en_attente` de « Les Tissages de Lucas », titulaire Lucas Martin (rôle `client`)
- **WHEN** l'administrateur active « Valider »
- **THEN** le vendeur a le statut `valide` et Lucas Martin le rôle `vendeur`
- **AND** le toast « La boutique Les Tissages de Lucas a été validée. » s'affiche

#### Scenario: Refuser une demande

- **GIVEN** la même demande `en_attente`
- **WHEN** l'administrateur active « Refuser » puis confirme dans la fenêtre
- **THEN** le vendeur a le statut `refuse` et Lucas Martin garde le rôle `client`

#### Scenario: Désactiver un vendeur

- **GIVEN** le vendeur validé « Menuiserie Lebrun », dont le compte est actif
- **WHEN** l'administrateur active « Désactiver » puis confirme
- **THEN** le compte de son titulaire a `actif: false`
- **AND** ses produits n'apparaissent plus dans le catalogue et son titulaire ne peut plus se connecter

#### Scenario: Réactiver un vendeur

- **GIVEN** le vendeur « Menuiserie Lebrun » désactivé
- **WHEN** l'administrateur active « Réactiver »
- **THEN** le compte de son titulaire est de nouveau actif et ses produits actifs réapparaissent dans le catalogue

### Requirement: Gestion des utilisateurs

La page `/admin/utilisateurs` SHALL lister les comptes (nom, e-mail, badge de rôle, actif) dans le tableau du template avec recherche, tri et pagination. L'administrateur MUST pouvoir, après confirmation dans une fenêtre modale, changer le rôle d'un compte entre `client` et `admin`, et activer ou désactiver un compte.

#### Scenario: Promouvoir un client administrateur

- **GIVEN** le client « Lucas Martin »
- **WHEN** l'administrateur choisit le rôle « Admin » et confirme
- **THEN** Lucas Martin a le rôle `admin` et le toast « Le rôle de Lucas Martin a été modifié. » s'affiche

#### Scenario: Désactiver un client

- **GIVEN** le client « Lucas Martin », actif
- **WHEN** l'administrateur active « Désactiver » et confirme
- **THEN** son compte a `actif: false` et il ne peut plus se connecter

### Requirement: Comptes protégés

Le rôle d'un titulaire de boutique validée SHALL se gérer depuis la page Vendeurs et ne pas être modifiable depuis la page Utilisateurs. L'administrateur MUST ne pas pouvoir modifier son propre rôle ni désactiver son propre compte ; l'API MUST refuser ces modifications.

#### Scenario: Protection de son propre compte

- **GIVEN** l'administrateur « Mariam Diallo » sur `/admin/utilisateurs`
- **WHEN** il consulte sa propre ligne
- **THEN** le choix du rôle et le bouton « Désactiver » sont désactivés pour cette ligne

#### Scenario: Rôle d'un titulaire de boutique

- **GIVEN** la vendeuse « Claire Fontaine », titulaire de « Atelier Grès & Sel »
- **WHEN** l'administrateur consulte sa ligne
- **THEN** son badge de rôle « Vendeur » est affiché sans choix de rôle possible

### Requirement: Liste des commandes

La page `/admin/commandes` SHALL lister toutes les commandes (numéro, date, client, nombre d'articles, total, pastille de statut) dans le tableau du template, de la plus récente à la plus ancienne, avec recherche par numéro ou nom de client, tri, pagination et filtre par statut repris dans l'URL.

#### Scenario: Filtrer les commandes en attente

- **GIVEN** deux commandes `en_attente` et une `livree`
- **WHEN** l'administrateur ouvre `/admin/commandes?statut=en_attente`
- **THEN** il voit les deux commandes en attente, la plus récente en premier

### Requirement: Détail d'une commande

La page `/admin/commandes/:id` SHALL afficher dans les panneaux du template le numéro, la date, le client (nom et e-mail), l'adresse de livraison, les lignes (vignette, produit, quantité, prix unitaire, sous-total), le total et la pastille de statut. Une commande inexistante MUST afficher « Commande introuvable ».

#### Scenario: Consultation du détail

- **GIVEN** la commande n° 7 du client « Lucas Martin » avec 2 « Tasses empilables Nuage »
- **WHEN** l'administrateur ouvre `/admin/commandes/7`
- **THEN** il voit « Lucas Martin », son e-mail, l'adresse de livraison, la ligne « Tasses empilables Nuage × 2 — 68 € » et le statut « En attente »

### Requirement: Changement du statut d'une commande

Depuis le détail, l'administrateur SHALL pouvoir faire avancer le statut selon ces transitions seulement : `en_attente` → `expediee` ou `annulee` ; `expediee` → `livree` ou `annulee`. `livree` et `annulee` sont définitifs. Seules les transitions permises MUST être proposées, et l'API MUST refuser (409) les autres. L'annulation MUST être confirmée dans une fenêtre modale ; chaque changement MUST afficher un toast.

#### Scenario: Expédier une commande

- **GIVEN** la commande n° 7 `en_attente`
- **WHEN** l'administrateur choisit « Marquer comme expédiée »
- **THEN** la commande a le statut `expediee` et le toast « La commande n° 7 est maintenant Expédiée. » s'affiche

#### Scenario: Annulation d'une commande expédiée par l'administrateur

- **GIVEN** la commande n° 7 `expediee` avec 2 « Tasses empilables Nuage », dont le stock vaut 16
- **WHEN** l'administrateur choisit « Annuler la commande » et confirme
- **THEN** la commande a le statut `annulee` et le stock des « Tasses empilables Nuage » vaut 18

#### Scenario: Commande livrée définitive

- **GIVEN** une commande `livree`
- **WHEN** l'administrateur ouvre son détail
- **THEN** aucune action de changement de statut n'est proposée
- **AND** une requête directe `PATCH` vers `en_attente` est refusée par l'API avec le statut 409
