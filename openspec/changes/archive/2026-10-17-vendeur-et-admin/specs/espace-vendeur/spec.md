# Spec Delta : espace-vendeur

## Purpose

Permettre à un client de demander à devenir vendeur (artisan), puis, une fois validé, de gérer lui-même ses produits et de suivre ses ventes, sans jamais pouvoir agir sur les produits des autres vendeurs.

## ADDED Requirements

### Requirement: Demande « Devenir vendeur »

La page `/devenir-vendeur` (titre « Devenir artisan »), réservée aux utilisateurs de rôle `client`, SHALL proposer un formulaire : nom de la boutique (requis, 3 à 60 caractères, unique sans tenir compte de la casse) et description (requise, 20 à 500 caractères). L'envoi MUST créer un vendeur au statut `en_attente` rattaché à l'utilisateur connecté, sans changer son rôle, et afficher le toast « Votre demande a été envoyée. Un administrateur va l'examiner. ».

#### Scenario: Demande envoyée

- **GIVEN** le client « Lucas Martin » connecté, sans demande en cours
- **WHEN** il saisit « Les Tissages de Lucas » et une description de 40 caractères, puis valide
- **THEN** un vendeur `en_attente` rattaché à Lucas Martin est créé
- **AND** Lucas Martin garde le rôle `client`
- **AND** le toast de demande envoyée s'affiche

#### Scenario: Nom de boutique déjà pris

- **GIVEN** un client sur `/devenir-vendeur`
- **WHEN** il saisit « atelier grès & sel »
- **THEN** le message « Ce nom de boutique est déjà utilisé. » s'affiche et aucune demande n'est créée

#### Scenario: Champs invalides

- **GIVEN** un client sur `/devenir-vendeur`
- **WHEN** il saisit « AB » comme nom et une description de 10 caractères, puis valide
- **THEN** il voit « Le nom doit contenir entre 3 et 60 caractères. » et « La description doit contenir entre 20 et 500 caractères. »

#### Scenario: Accès refusé à la demande

- **GIVEN** un visiteur, puis un vendeur, puis l'administrateur
- **WHEN** chacun ouvre `/devenir-vendeur`
- **THEN** le visiteur est redirigé vers `/connexion?retour=/devenir-vendeur`
- **AND** le vendeur et l'administrateur sont redirigés vers `/acces-refuse`

### Requirement: Suivi de la demande

Un client ayant déjà une demande SHALL voir son état sur `/devenir-vendeur` au lieu du formulaire : « Votre demande pour {boutique} est en cours d'examen. » (`en_attente`) ou « Votre demande pour {boutique} a été refusée. » (`refuse`). Une seule demande par utilisateur MUST être possible.

#### Scenario: Demande en attente

- **GIVEN** un client dont la demande « Les Tissages de Lucas » est `en_attente`
- **WHEN** il ouvre `/devenir-vendeur`
- **THEN** il voit « Votre demande pour Les Tissages de Lucas est en cours d'examen. » et aucun formulaire

#### Scenario: Seconde demande refusée par l'API

- **GIVEN** un client qui a déjà une demande
- **WHEN** une seconde demande est envoyée à l'API pour ce client
- **THEN** l'API répond 409 et aucun second vendeur n'est créé

### Requirement: Accès à la demande

Le lien « Devenir artisan » de la colonne « Aide » du pied de page SHALL mener à `/devenir-vendeur`, et l'espace client d'un utilisateur de rôle `client` MUST proposer un bouton « Devenir artisan » vers la même page.

#### Scenario: Liens selon le rôle

- **GIVEN** un client connecté, puis un vendeur connecté
- **WHEN** chacun ouvre `/compte`
- **THEN** seul le client voit le bouton « Devenir artisan »
- **AND** pour les deux, le lien « Devenir artisan » du pied de page mène à `/devenir-vendeur`

### Requirement: Liste de ses produits

La page `/vendeur/produits` (cible de `/vendeur`) SHALL lister dans le tableau du template les produits du vendeur connecté, et seulement les siens : vignette, nom, catégorie, prix, stock et état (« Actif » / « Inactif »), avec recherche par nom, tri sur chaque colonne et pagination de 10 lignes. L'espace vendeur MUST reprendre le menu latéral vert forêt de l'administration avec les entrées « Mes produits » et « Mes ventes », et proposer un bouton « Nouveau produit ».

#### Scenario: Seulement ses produits

- **GIVEN** le vendeur « Atelier Grès & Sel » connecté
- **WHEN** il ouvre `/vendeur`
- **THEN** il arrive sur `/vendeur/produits` et voit ses 5 produits
- **AND** aucun produit de « Menuiserie Lebrun » n'apparaît

#### Scenario: Recherche et tri

- **GIVEN** le vendeur « Atelier Grès & Sel » sur `/vendeur/produits`
- **WHEN** il saisit « mugs » dans la recherche, puis l'efface et trie par prix décroissant
- **THEN** seul « Mugs mouchetés » s'affiche, puis « Set de bols Sable » apparaît en premier

#### Scenario: Accès refusé à la liste

- **GIVEN** un client connecté
- **WHEN** il ouvre `/vendeur/produits`
- **THEN** il est redirigé vers `/acces-refuse`

### Requirement: Formulaire produit

La création (`/vendeur/produits/nouveau`) et la modification (`/vendeur/produits/:id`) SHALL utiliser le même formulaire en fenêtre modale au-dessus de la liste, comme dans le template, prérempli en modification, avec des photos choisies dans la bibliothèque du site et leur aperçu immédiat. Le produit créé MUST être rattaché à la boutique du vendeur. L'enregistrement ferme la modale avec le toast « Le produit {nom} a été créé. » ou « … a été modifié. ».

#### Scenario: Création d'un produit

- **GIVEN** le vendeur « Menuiserie Lebrun » sur `/vendeur/produits/nouveau`
- **WHEN** il saisit « Chaise Fil », une description valide, 260 €, stock 6, catégorie Mobilier, choisit la photo `produit-chaise-fil.jpg`, puis enregistre
- **THEN** le produit est créé avec le `vendeurId` de « Menuiserie Lebrun » et l'image `/images/produit-chaise-fil.jpg`
- **AND** la modale se ferme sur `/vendeur/produits` avec le toast « Le produit Chaise Fil a été créé. »

#### Scenario: Aperçu de la photo

- **GIVEN** le formulaire produit ouvert
- **WHEN** le vendeur choisit la photo `produit-chaise-fil.jpg`
- **THEN** l'aperçu du formulaire affiche aussitôt cette photo

#### Scenario: Modification pré-remplie

- **GIVEN** le vendeur « Menuiserie Lebrun »
- **WHEN** il ouvre `/vendeur/produits/6`, passe le stock à 15 et enregistre
- **THEN** le formulaire était prérempli avec « Tabouret de comptoir en frêne »
- **AND** le stock vaut 15 et le toast « Le produit Tabouret de comptoir en frêne a été modifié. » s'affiche

#### Scenario: Erreur d'enregistrement

- **GIVEN** l'API simulée arrêtée
- **WHEN** le vendeur enregistre un formulaire valide
- **THEN** la modale reste ouverte avec ses valeurs et le toast d'erreur « L'enregistrement a échoué. Réessayez. » s'affiche

### Requirement: Validation du formulaire produit

Le formulaire produit SHALL appliquer ces règles et afficher sous chaque champ invalide un message relié au champ : nom requis (3 à 100 caractères), description requise (10 à 1000), prix requis, supérieur à 0 avec deux décimales au plus, stock requis et entier positif ou nul, catégorie requise, au moins une photo de la bibliothèque du site. Rien MUST être enregistré tant qu'un champ est invalide.

#### Scenario: Valeurs invalides

- **GIVEN** un vendeur sur le formulaire produit
- **WHEN** il saisit le prix `-3`, le stock `2.5`, ne choisit aucune photo, puis enregistre
- **THEN** il voit « Le prix doit être supérieur à 0. », « Le stock doit être un nombre entier positif. » et « Choisissez au moins une photo. »
- **AND** rien n'est enregistré

### Requirement: Produits d'un autre vendeur inaccessibles

Un vendeur SHALL ne jamais pouvoir consulter dans son espace, modifier ou supprimer le produit d'un autre vendeur. L'ouverture de `/vendeur/produits/:id` pour un tel produit MUST afficher « Produit introuvable », et l'API MUST refuser (403) toute modification ou suppression de ce produit par ce vendeur.

#### Scenario: Ouverture du produit d'un autre vendeur

- **GIVEN** le vendeur « Atelier Grès & Sel »
- **WHEN** il ouvre `/vendeur/produits/6` (produit de « Menuiserie Lebrun »)
- **THEN** il voit « Produit introuvable » et aucun formulaire

#### Scenario: Modification refusée par l'API

- **GIVEN** le jeton du vendeur « Atelier Grès & Sel »
- **WHEN** un client HTTP envoie `PATCH /produits/6` avec ce jeton
- **THEN** l'API répond 403 et le produit n'est pas modifié

### Requirement: Suppression d'un de ses produits

Chaque produit de la liste SHALL proposer « Supprimer » avec la confirmation en deux clics du template (« Confirmer » pendant 3 s). Après suppression, la liste est mise à jour et le toast « Le produit {nom} a été supprimé. » s'affiche.

#### Scenario: Suppression confirmée

- **GIVEN** le vendeur « Menuiserie Lebrun » avec le produit « Chaise Fil », jamais commandé
- **WHEN** il active « Supprimer », puis « Confirmer » dans les 3 s
- **THEN** le produit n'existe plus et le toast de suppression s'affiche

#### Scenario: Suppression abandonnée

- **GIVEN** le vendeur qui a activé « Supprimer » sur « Chaise Fil »
- **WHEN** 3 s s'écoulent sans qu'il active « Confirmer »
- **THEN** le bouton redevient « Supprimer » et le produit est conservé

### Requirement: Produit commandé non supprimable

Un produit présent dans au moins une commande SHALL ne pas pouvoir être supprimé, par un vendeur comme par l'administrateur : l'API MUST répondre 409 et l'interface afficher « Ce produit figure dans des commandes : désactivez-le plutôt. ».

#### Scenario: Suppression d'un produit commandé

- **GIVEN** le produit « Tasses empilables Nuage » présent dans une commande
- **WHEN** son vendeur confirme sa suppression
- **THEN** le produit est conservé et le message « Ce produit figure dans des commandes : désactivez-le plutôt. » s'affiche

### Requirement: Mes ventes

La page `/vendeur/ventes` SHALL lister dans le tableau du template, de la plus récente à la plus ancienne, chaque ligne de commande portant sur un produit du vendeur connecté : numéro et date de la commande, produit, quantité, montant (quantité × prix unitaire) et pastille de statut. Les lignes des autres vendeurs, même dans une commande partagée, MUST ne pas apparaître. Le total des ventes hors commandes annulées MUST être affiché dans une tuile de statistique.

#### Scenario: Ventes d'une commande partagée

- **GIVEN** une commande contenant 2 « Tasses empilables Nuage » (Atelier Grès & Sel, 34 €) et 1 « Tabouret de comptoir en frêne » (Menuiserie Lebrun)
- **WHEN** le vendeur « Atelier Grès & Sel » ouvre `/vendeur/ventes`
- **THEN** il voit la ligne « Tasses empilables Nuage », quantité 2, montant « 68 € »
- **AND** il ne voit pas la ligne « Tabouret de comptoir en frêne »

#### Scenario: Total hors annulations

- **GIVEN** un vendeur avec une vente de 68 € dans une commande `livree` et une de 32 € dans une commande `annulee`
- **WHEN** il ouvre `/vendeur/ventes`
- **THEN** la tuile du total des ventes affiche « 68 € »

#### Scenario: Aucune vente

- **GIVEN** un vendeur dont aucun produit n'a été commandé
- **WHEN** il ouvre `/vendeur/ventes`
- **THEN** il voit « Aucune vente pour le moment. »
