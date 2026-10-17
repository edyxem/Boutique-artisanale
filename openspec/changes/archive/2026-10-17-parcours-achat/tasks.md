# Tâches : parcours d'achat

## 1. Prérequis et configuration

- [x] 1.1 Vérifier que `design-template` et `socle-et-auth` sont implémentés et archivés (`openspec list --specs` liste `charte-graphique`, `composants-ui`, `animations`, `auth`, `donnees`) et que `npm test` passe
- [x] 1.2 Ajouter `LOCALE_ID: 'fr-FR'` (avec `registerLocaleData`) et `withComponentInputBinding()` dans `app.config.ts`, créer `formaterPrix()` et le pipe `prix` ; tester 34 → « 34 € » et 39.9 → « 39,90 € »

## 2. Services de lecture et visibilité

- [x] 2.1 Créer `estVisible()` ; tester « Produit inactif masqué », « Vendeur non validé masqué », « Vendeur désactivé masqué »
- [x] 2.2 Créer `CategorieService` et `VendeurService.listerPublics()` ; tester les URL appelées et le filtrage des vendeurs inactifs
- [x] 2.3 Créer `ProduitService.listerVisibles()` et `trouverVisible()` ; tester « Données d'exemple » (9 produits visibles) et le cas `null`

## 3. Catalogue

- [x] 3.1 Créer `ui-carte-produit` ; tester « Contenu d'une carte » et « Stock bas »
- [x] 3.2 Créer `CataloguePage` (titre, grille, squelettes, erreur) et sa route ; tester « API indisponible »
- [x] 3.3 Ajouter les puces d'univers liées à l'URL ; tester « Filtrer par univers », « Filtre conservé au rechargement », « Catégorie inconnue »
- [x] 3.4 Ajouter la recherche instantanée (nom, description, boutique, sans accents) ; tester « Recherche insensible aux accents », « Recherche sur la boutique », « Recherche combinée au filtre », « Aucun résultat »
- [x] 3.5 Créer `FichePage`, `titreProduitResolver` et la route `catalogue/:id` ; tester « Consultation d'une fiche » et « Produit inexistant ou masqué »
- [x] 3.6 Gérer les produits épuisés sur la carte et la fiche ; tester « Épuisé dans la grille et sur la fiche »
- [x] 3.7 Remplir la zone gauche de l'en-tête, le menu mobile et la colonne « Boutique » du pied de page ; tester « Univers de l'en-tête et du pied de page »

## 4. Accueil

- [x] 4.1 Créer `AccueilPage` avec `HeroAccueil` et la variante d'en-tête superposée ; tester « Contenu du hero » et « En-tête au défilement » (observateur simulé)
- [x] 4.2 Créer `BlocEngagement` et `EtapesFlowering` ; tester « Bloc engagement » et « Lien « Nos artisans » »
- [x] 4.3 Créer `SelectionProduits` ; tester « Sélection du jeu d'exemple »
- [x] 4.4 Créer `BlocPrixJuste` et `SimulateurPrix` ; tester « Valeur par défaut » et « Déplacement du curseur »
- [x] 4.5 Créer `UniversAccueil` ; tester « Tuiles du jeu d'exemple »

## 5. Panier

- [x] 5.1 Créer `PanierService` (lignes, ajout, quantités bornées, retrait, total, part des artisans) ; tester l'ajout, le cumul, le plafonnement, le retrait et les calculs
- [x] 5.2 Ajouter la persistance et `synchroniser()` ; tester « Panier retrouvé après rechargement » et « Ajustement à la restauration »
- [x] 5.3 Brancher « Ajouter » (carte) et « Ajouter au panier » (fiche) avec les toasts ; tester « Ajout depuis une carte », « Ajout d'un produit déjà présent », « Ajout au-delà du stock »
- [x] 5.4 Créer `ContenuPanier` et `TiroirPanier` ouvert par le bouton de l'en-tête ; tester « Tiroir d'un visiteur », « Tiroir vide », « Bouton d'un visiteur », « Tiroir d'un client », « Quantité bornée dans le panier », « Retirer une ligne »
- [x] 5.5 Créer `PanierPage` ; tester « Calcul du total »
- [x] 5.6 Ajouter la pastille dans l'en-tête ; tester « Pastille mise à jour » et « Pastille masquée »
- [x] 5.7 Tester « Panier conservé à la connexion » (connexion puis déconnexion avec `AuthService` simulé)

## 6. Règles de commande dans l'API simulée

- [x] 6.1 Ajouter `reglesCommandes` pour `POST /commandes` ; vérifier avec `curl` une création réussie, un 401 sans jeton et un 409 sur stock insuffisant, puis restaurer `db.json`
- [x] 6.2 Ajouter l'annulation (`PATCH` vers `annulee`) ; vérifier avec `curl` « Stock rétabli », le 403 sur une commande non `en_attente` et l'absence de double remise en stock, puis restaurer `db.json`

## 7. Commande

- [x] 7.1 Créer `CommandeService` ; tester les requêtes et la traduction du 409
- [x] 7.2 Créer `panierNonVideGuard` et les routes `commande` et `commande/confirmation/:id` ; tester « Panier vide »
- [x] 7.3 Créer l'étape livraison de `CommandePage` ; tester « Nom prérempli » et « Champs invalides » (focus sur le premier champ invalide)
- [x] 7.4 Créer l'étape récapitulatif ; tester « Récapitulatif affiché » et « Retour à l'adresse »
- [x] 7.5 Brancher la confirmation (création, toast, panier vidé, navigation) ; tester « Commande réussie » côté interface et « Stock épuisé entre-temps »
- [x] 7.6 Créer `ConfirmationCommandePage` ; tester « Page de confirmation » et « Confirmation d'une commande d'un autre client »
- [x] 7.7 Tester avec `RouterTestingHarness` « Visiteur qui commande » et « Visiteur qui crée un compte pour commander »

## 8. Mes commandes

- [x] 8.1 Ajouter `MesCommandes` à `ComptePage` ; tester « Liste de ses commandes », « Aucune commande » et « Accès refusé à Mes commandes pour un visiteur »
- [x] 8.2 Ajouter l'annulation avec `ui-modale` et toast ; tester « Annuler une commande en attente », « Renoncer à l'annulation » et « Commande expédiée non annulable »

## 9. Animations du parcours

- [x] 9.1 Animer le hero, le bloc engagement et le compteur « 72 % » ; tester la présence des classes d'animation et l'absence de mouvement avec `mouvementReduit`
- [x] 9.2 Créer l'animation de vol vers le panier et le rebond de la pastille ; tester qu'elle est demandée à l'ajout, omise avec `mouvementReduit`, et que « Ajouté ✓ » revient à « Ajouter » après 1,2 s
- [x] 9.3 Animer le filtrage de la grille (`startViewTransition`) et la photo partagée carte → fiche ; tester l'appel à `startViewTransition` (simulé) et les `view-transition-name`
- [x] 9.4 Animer les lignes du panier (entrée, repli, quantité, total), les étapes de commande et la coche de confirmation ; tester les classes d'entrée / sortie

## 10. Vérification d'ensemble

- [x] 10.1 Parcours manuel sur `npm run dev` : accueil, simulateur, univers, recherche et filtre, ajout au panier en visiteur, tiroir, rechargement, connexion au moment de commander, commande, contrôle du stock dans `db.json`, annulation et remise en stock ; noter chaque résultat puis restaurer `db.json`
- [x] 10.2 Comparer l'accueil, le catalogue, la fiche, le tiroir et l'espace client aux captures `01` à `04` et `07` du template (1440 px et 390 px) ; vérifier les animations sur un téléphone, puis avec la réduction des animations activée ; vérifier aussi les scénarios de `charte-graphique` « Grille produits sur mobile », « Grille produits sur bureau », « Carte produit » et « Emplacement réservé »
- [x] 10.3 Vérifier l'accessibilité de `/`, `/catalogue`, `/catalogue/1`, du tiroir, de `/panier`, `/commande` et `/compte` avec axe DevTools (aucune violation) et au clavier ; mesurer le CLS avec Lighthouse sur l'accueil et le catalogue
- [x] 10.4 Écrire les tests des scénarios : vérifier que chaque scénario des specs `accueil`, `catalogue`, `panier` et `commande` est couvert par un test automatisé ou une vérification manuelle (6.1, 6.2, 10.1), compléter les tests manquants, puis vérifier que `npm test` et `npx ng build` passent
