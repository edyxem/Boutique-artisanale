# Proposition : parcours d'achat

## Why

Le socle (`socle-et-auth`) permet de s'identifier mais pas encore d'acheter. Ce changement livre le cœur de la boutique, dans le design du template : la page d'accueil, découvrir les produits, remplir un panier sans compte, passer commande une fois connecté et suivre ses commandes.

## What Changes

- **Accueil** (`/`, template `#view-home`) : hero avec en-tête superposé, bloc engagement, sélection de produits, bloc prix juste et son simulateur, « Comment fonctionne Flowering », univers.
- **Catalogue public** (`/catalogue`) : grille de cartes du template, puces d'univers, recherche instantanée (nom, description, boutique), fiche produit (`/catalogue/:id`) en page, badges de stock (« En stock », « Plus que N », « Épuisé »), liens d'univers dans l'en-tête et le pied de page. Seuls les produits actifs de vendeurs validés et actifs sont visibles.
- **Panier sans compte** : tiroir du template ouvert depuis l'en-tête, page `/panier`, quantité − / + limitée au stock, total et part reversée aux artisans, pastille rose dans l'en-tête, panier gardé dans le navigateur.
- **Commande** (`/commande`) : connexion exigée avec retour et panier conservé, formulaire de livraison, récapitulatif, création d'une commande `en_attente`, contrôle et baisse du stock, panier vidé, confirmation.
- **Mes commandes** dans l'espace client (`/compte`) : liste au format du template, statut, annulation d'une commande `en_attente` qui remet le stock.
- Animations propres au parcours : vol de la photo vers le panier, pastille qui rebondit, grille qui se réorganise au filtrage, photo partagée entre carte et fiche, hero animé, compteur « 72 % ».
- Services : `CategorieService`, `ProduitService`, `VendeurService` (lecture), `PanierService`, `CommandeService`.

## Rôles concernés

- **Visiteur** : accueil, catalogue, fiche produit, panier ; redirigé vers la connexion au moment de commander.
- **Client, vendeur, administrateur** (tout utilisateur connecté) : mêmes droits que le visiteur, plus passer commande et consulter / annuler ses propres commandes.

## Hors périmètre

- Paiement en ligne (la commande est enregistrée `en_attente`, sans paiement), e-mails de confirmation.
- Frais de port réels (la mention « Livraison offerte dès 80 € » reste informative), codes promo, avis clients (la note du hero est un texte du template), liste de souhaits.
- Badge « Pièce unique » et caractéristiques détaillées des produits du template : le modèle de données n'a pas ces champs.
- Plusieurs adresses enregistrées : l'adresse est saisie à chaque commande.
- Changement de statut d'une commande autre que l'annulation par le client (traité par `vendeur-et-admin`).
- Synchronisation du panier entre appareils, téléversement d'images, statistiques.

## Capabilities

### New Capabilities

- `accueil` : page d'accueil du template (hero et en-tête superposé, engagement, sélection, prix juste et simulateur, étapes, univers).
- `catalogue` : règle de visibilité des produits, grille, chargement, filtre par univers, recherche, fiche produit, produit épuisé, liens des univers.
- `panier` : ajout, quantités bornées par le stock, retrait, tiroir et page panier, bouton de commande, pastille d'en-tête, conservation dans le navigateur.
- `commande` : passage de commande (connexion, livraison, récapitulatif, stock, confirmation), « Mes commandes » et annulation avec remise en stock.

### Modified Capabilities

Aucune. Le design (`charte-graphique`, `composants-ui`, `animations`) et l'accès à `/commande` et `/compte` (`auth`) sont utilisés sans être modifiés.

## Impact

- **Prérequis** : `design-template` puis `socle-et-auth` implémentés et archivés.
- **Code** : `src/app/features/accueil`, `catalogue`, `panier`, `commande`, `compte` ; services dans `src/app/core/services` ; zone gauche de l'en-tête, colonne « Boutique » du pied de page et pastille du panier dans `core/layout`.
- **API simulée** : lectures `GET /produits`, `/categories`, `/vendeurs`, `/users?role=vendeur` ; écritures `POST /commandes`, `PATCH /commandes/:id` (avec le middleware `reglesCommandes`).
- **Navigateur** : nouvelle clé `localStorage` `flowering.panier`.
- **Interface** : uniquement les composants de `shared/ui` (toasts, modale de confirmation d'annulation, tiroir).
