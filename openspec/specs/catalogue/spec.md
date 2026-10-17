# catalogue Specification

## Purpose
Présenter publiquement les produits artisanaux de la boutique, avec filtre par univers, recherche et fiche détaillée, en n'exposant que les produits réellement en vente.

## Requirements

### Requirement: Produits visibles dans le catalogue

Le catalogue (accueil, grille, recherche, filtres et fiche produit) SHALL n'afficher que les produits qui remplissent les trois conditions : le produit est actif, son vendeur a le statut `valide`, et le compte utilisateur de ce vendeur est actif.

#### Scenario: Produit inactif masqué

- **GIVEN** un produit avec `actif: false` d'un vendeur validé et actif
- **WHEN** un visiteur ouvre `/catalogue`
- **THEN** ce produit n'apparaît pas dans la grille

#### Scenario: Vendeur non validé masqué

- **GIVEN** un vendeur au statut `en_attente`, et un autre au statut `refuse`, ayant chacun un produit actif
- **WHEN** un visiteur ouvre `/catalogue`
- **THEN** aucun de ces deux produits n'apparaît

#### Scenario: Vendeur désactivé masqué

- **GIVEN** un vendeur validé dont le compte utilisateur a `actif: false`
- **WHEN** un visiteur ouvre `/catalogue` ou la fiche d'un de ses produits
- **THEN** ses produits n'apparaissent pas dans la grille et sa fiche affiche « Produit introuvable »

#### Scenario: Données d'exemple

- **GIVEN** le jeu de données d'exemple (10 produits dont 1 inactif, 2 vendeurs validés et actifs)
- **WHEN** un visiteur ouvre `/catalogue`
- **THEN** la grille affiche 9 produits

### Requirement: Grille des produits

La page `/catalogue` SHALL afficher, sous le sur-titre « Boutique » et le titre « Toutes les créations », les produits visibles dans la grille du template, triés par identifiant. Chaque carte MUST montrer la photo carrée (texte alternatif = nom du produit) avec le badge de stock, le nom, « {boutique} · {prix} » au format du template (« 34 € », « 39,90 € »), et les boutons « Ajouter » et « Détails », ce dernier menant à la fiche.

#### Scenario: Contenu d'une carte

- **GIVEN** le produit « Tasses empilables Nuage » (34 €, stock 18, Atelier Grès & Sel)
- **WHEN** un visiteur ouvre `/catalogue`
- **THEN** sa carte affiche sa photo avec le texte alternatif « Tasses empilables Nuage », le badge « En stock », son nom et « Atelier Grès & Sel · 34 € »
- **AND** activer « Détails » mène à `/catalogue/1`

#### Scenario: Stock bas

- **GIVEN** le produit « Tabouret haut Lin » (stock 2)
- **WHEN** sa carte s'affiche
- **THEN** son badge indique « Plus que 2 »

### Requirement: Chargement du catalogue

Pendant le chargement des produits, la grille SHALL afficher des cartes squelettes ; si l'API ne répond pas, le message « Le catalogue est momentanément indisponible. » MUST s'afficher avec un bouton « Réessayer » qui relance le chargement.

#### Scenario: API indisponible

- **GIVEN** l'API simulée est arrêtée
- **WHEN** un visiteur ouvre `/catalogue`
- **THEN** le message « Le catalogue est momentanément indisponible. » et un bouton « Réessayer » s'affichent

### Requirement: Filtre par univers

Le catalogue SHALL proposer une rangée de puces « Tout » puis une puce par catégorie. Le choix d'une puce MUST n'afficher que les produits visibles de cette catégorie, remplacer le titre par le nom de la catégorie, et être reflété dans l'URL (`/catalogue?categorie={slug}`), pour qu'un lien ou un rechargement conserve le filtre. Un slug inconnu MUST être ignoré.

#### Scenario: Filtrer par univers

- **GIVEN** un visiteur sur `/catalogue`
- **WHEN** il active la puce « Mobilier »
- **THEN** l'URL devient `/catalogue?categorie=mobilier`, le titre devient « Mobilier »
- **AND** seuls « Tabouret de comptoir en frêne » et « Tabouret haut Lin » sont affichés

#### Scenario: Filtre conservé au rechargement

- **GIVEN** un visiteur qui ouvre directement `/catalogue?categorie=maison`
- **WHEN** la page se charge
- **THEN** la puce « Maison » est active et seuls les produits visibles de cette catégorie sont affichés

#### Scenario: Catégorie inconnue

- **GIVEN** un visiteur
- **WHEN** il ouvre `/catalogue?categorie=inconnue`
- **THEN** tous les produits visibles sont affichés, la puce « Tout » est active et le titre est « Toutes les créations »

### Requirement: Recherche de produits

Le catalogue SHALL proposer le champ de recherche du template (« Rechercher un objet ») qui filtre instantanément les produits visibles sur leur nom, leur description et le nom de leur boutique, sans tenir compte des majuscules ni des accents. La recherche MUST se combiner avec le filtre d'univers et être reflétée dans l'URL (`q={texte}`). Sans résultat, la grille MUST afficher « Aucun résultat » et « Rien ne correspond à « {texte} ». », avec un bouton « Effacer les filtres ».

#### Scenario: Recherche insensible aux accents

- **GIVEN** un visiteur sur `/catalogue`
- **WHEN** il saisit « frene »
- **THEN** la grille affiche « Tabouret de comptoir en frêne »
- **AND** l'URL contient `q=frene`

#### Scenario: Recherche sur la boutique

- **GIVEN** un visiteur sur `/catalogue`
- **WHEN** il saisit « lebrun »
- **THEN** la grille affiche les 4 produits visibles de « Menuiserie Lebrun »

#### Scenario: Recherche combinée au filtre

- **GIVEN** un visiteur sur `/catalogue?categorie=cuisine`
- **WHEN** il saisit « olivier »
- **THEN** seul « Ustensiles en olivier » est affiché

#### Scenario: Aucun résultat

- **GIVEN** un visiteur sur `/catalogue`
- **WHEN** il saisit « téléviseur »
- **THEN** il voit « Aucun résultat » et « Rien ne correspond à « téléviseur ». »
- **AND** activer « Effacer les filtres » réaffiche tous les produits visibles et retire les paramètres de l'URL

### Requirement: Fiche produit

La page `/catalogue/:id` SHALL reprendre la fiche du template en page à part entière (photo 4:5, sur-titre, nom, description, disponibilité, prix, quantité − / +, « Ajouter au panier », mention de livraison). Le titre du document MUST être « {Nom du produit} | Flowering ». Un identifiant inexistant ou un produit non visible MUST afficher « Produit introuvable » avec un lien « Retour au catalogue ».

#### Scenario: Consultation d'une fiche

- **GIVEN** un visiteur
- **WHEN** il ouvre `/catalogue/1`
- **THEN** il voit « Céramique · Atelier Grès & Sel », le titre « Tasses empilables Nuage », sa description, la disponibilité « 18 en stock », « 34 € », les boutons − et +, « Ajouter au panier » et « Livraison sous 3 à 5 jours · Retours gratuits 30 jours »
- **AND** le titre du document est « Tasses empilables Nuage | Flowering »

#### Scenario: Produit inexistant ou masqué

- **GIVEN** un visiteur
- **WHEN** il ouvre `/catalogue/9999`, puis `/catalogue/10` (produit inactif)
- **THEN** chaque page affiche « Produit introuvable » et un lien « Retour au catalogue »

### Requirement: Produit épuisé

Un produit visible dont le stock vaut 0 SHALL rester affiché, avec le badge « Épuisé » sur sa carte et « Épuisé » comme disponibilité sur sa fiche ; son ajout au panier MUST être impossible (boutons désactivés, libellé « Épuisé » sur la fiche).

#### Scenario: Épuisé dans la grille et sur la fiche

- **GIVEN** le produit visible « Mugs mouchetés » avec `stock: 0`
- **WHEN** un visiteur consulte la grille puis `/catalogue/3`
- **THEN** la carte affiche le badge « Épuisé » et son bouton « Ajouter » est désactivé
- **AND** la fiche indique « Épuisé » et son bouton, libellé « Épuisé », est désactivé

### Requirement: Liens des univers

L'en-tête SHALL afficher dans sa zone gauche (navigation « Univers ») les trois premières catégories par identifiant, et le pied de page, dans sa colonne « Boutique », toutes les catégories ; chaque lien mène à `/catalogue?categorie={slug}`. Le menu mobile MUST reprendre les liens de l'en-tête.

#### Scenario: Univers de l'en-tête et du pied de page

- **GIVEN** le jeu de données d'exemple
- **WHEN** un visiteur consulte l'en-tête puis le pied de page
- **THEN** l'en-tête affiche « Céramique », « Mobilier » et « Cuisine », et la colonne « Boutique » du pied de page ces trois univers et « Maison »
- **AND** activer « Cuisine » mène à `/catalogue?categorie=cuisine`
