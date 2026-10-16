# Tâches : espace vendeur et administration

## 1. Prérequis

- [ ] 1.1 Vérifier que `design-template`, `socle-et-auth` et `parcours-achat` sont implémentés et archivés (`openspec list --specs` liste notamment `composants-ui`, `auth`, `catalogue`, `commande`) et que `npm test` passe

## 2. Règles d'écriture de l'API simulée

- [ ] 2.1 Ajouter `auteur(req)` à `api/server.cjs` ; vérifier avec `curl` qu'un jeton absent ou d'un compte désactivé est refusé sur une écriture protégée
- [ ] 2.2 Ajouter les règles `POST /vendeurs` et `PATCH /vendeurs/:id` ; vérifier avec `curl` « Seconde demande refusée par l'API », la validation (rôle `vendeur` donné) et le refus
- [ ] 2.3 Ajouter les règles des produits (propriété, `vendeurId` forcé, 409 si commandé) ; vérifier avec `curl` « Modification refusée par l'API » et la suppression refusée d'un produit commandé
- [ ] 2.4 Ajouter les règles des catégories et de `PATCH /users/:id` (admin, pas soi-même, pas de rôle `vendeur`) ; vérifier chaque refus avec `curl`
- [ ] 2.5 Ajouter les transitions de statut de l'administrateur à `reglesCommandes` ; vérifier avec `curl` une transition permise, la remise en stock d'une commande `expediee` annulée et le 409 depuis `livree`, puis restaurer `db.json`

## 3. Services et éléments partagés

- [ ] 3.1 Étendre `ProduitService`, `CategorieService`, `VendeurService` et `CommandeService`, créer `UtilisateurService` ; tester chaque méthode avec `HttpTestingController`
- [ ] 3.2 Créer `messageErreur()` et `transitionsPermises()` ; tester la traduction de 403, 409 et 0, et chaque statut
- [ ] 3.3 Créer `PanneauLayout` (menu latéral, barre horizontale sous 820 px, titre et action) ; tester l'indication de page courante et le rendu des entrées
- [ ] 3.4 Créer `ProduitFormulaire` (champs, choix de photo en `radiogroup`, aperçu, champ Boutique optionnel) ; tester « Valeurs invalides », « Aperçu de la photo », le préremplissage et l'émission de `enregistrer`

## 4. Devenir artisan

- [ ] 4.1 Ajouter `clientGuard` et la route `devenir-vendeur` ; tester « Accès refusé à la demande »
- [ ] 4.2 Créer `DevenirArtisanPage` (formulaire et état de la demande) ; tester « Demande envoyée », « Nom de boutique déjà pris », « Champs invalides », « Demande en attente »
- [ ] 4.3 Relier « Devenir artisan » du pied de page et ajouter le bouton de l'espace client ; tester « Liens selon le rôle »

## 5. Espace vendeur

- [ ] 5.1 Créer `VendeurLayout` et les routes de `vendeur.routes.ts` ; tester la redirection de `/vendeur` vers `/vendeur/produits` et « Accès refusé à la liste »
- [ ] 5.2 Créer `MesProduitsPage` (`ui-tableau`, bouton « Nouveau produit ») ; tester « Seulement ses produits » et « Recherche et tri »
- [ ] 5.3 Créer la modale d'édition (routes enfants `nouveau` et `:id`) ; tester « Création d'un produit », « Modification pré-remplie », « Erreur d'enregistrement » et « Ouverture du produit d'un autre vendeur »
- [ ] 5.4 Ajouter la suppression en deux clics ; tester « Suppression confirmée », « Suppression abandonnée » et « Suppression d'un produit commandé »
- [ ] 5.5 Créer `MesVentesPage` ; tester « Ventes d'une commande partagée », « Total hors annulations » et « Aucune vente »

## 6. Administration : structure et catalogue

- [ ] 6.1 Créer `AdminLayout` et les routes de `admin.routes.ts` ; tester « Menu latéral » et « Accès refusé aux pages d'administration »
- [ ] 6.2 Créer `ApercuPage` ; tester « Tuiles du jeu d'exemple » et « Lien vers les demandes en attente »
- [ ] 6.3 Créer `CategoriesPage` et la modale `EditionCategorie` ; tester « Création avec slug proposé » et « Slug déjà utilisé »
- [ ] 6.4 Ajouter la suppression de catégorie en deux clics ; tester « Suppression d'une catégorie vide » et « Catégorie utilisée »
- [ ] 6.5 Créer `ProduitsAdminPage` et la modale `EditionProduitAdmin` (champ Boutique) ; tester « Liste de tous les produits », « Modification du produit d'un vendeur » et « Suppression par l'administrateur »

## 7. Administration : vendeurs, utilisateurs, commandes

- [ ] 7.1 Créer `VendeursAdminPage` (filtre par statut dans l'URL, actions selon l'état, confirmations en modale) ; tester « Filtrer les demandes en attente », « Valider une demande », « Refuser une demande », « Désactiver un vendeur », « Réactiver un vendeur »
- [ ] 7.2 Créer `UtilisateursAdminPage` ; tester « Promouvoir un client administrateur », « Désactiver un client », « Protection de son propre compte », « Rôle d'un titulaire de boutique »
- [ ] 7.3 Créer `CommandesAdminPage` ; tester « Filtrer les commandes en attente »
- [ ] 7.4 Créer `DetailCommandeAdminPage` avec les transitions permises ; tester « Consultation du détail », « Expédier une commande », « Annulation d'une commande expédiée par l'administrateur » et « Commande livrée définitive » (côté interface)

## 8. Animations des espaces de gestion

- [ ] 8.1 Ajouter compteurs et cascade aux tuiles et aux lignes de tableau, et l'indicateur glissant du menu latéral ; tester la présence des directives et l'absence de mouvement avec `mouvementReduit`
- [ ] 8.2 Ajouter le surlignage des lignes modifiées, le changement de couleur des pastilles et le repli des lignes supprimées ; tester les classes d'entrée / sortie

## 9. Vérification d'ensemble

- [ ] 9.1 Parcours manuel sur `npm run dev` : demande « Devenir artisan » par le client, validation par l'admin, création d'un produit par le nouveau vendeur avec une photo de la bibliothèque, visibilité dans le catalogue, commande, vente visible côté vendeur, expédition puis livraison, désactivation du vendeur ; noter chaque résultat puis restaurer `db.json`
- [ ] 9.2 Comparer l'aperçu, les produits, le formulaire en modale, les commandes et les utilisateurs aux captures `08` à `12` du template (1440 px et 390 px), et l'espace vendeur au même style
- [ ] 9.3 Vérifier l'accessibilité de `/devenir-vendeur`, `/vendeur/produits`, de la modale produit, de `/admin/apercu`, `/admin/vendeurs` et `/admin/commandes/:id` avec axe DevTools (aucune violation) et au clavier (tableaux, menus, confirmations)
- [ ] 9.4 Écrire les tests des scénarios : vérifier que chaque scénario des specs `espace-vendeur` et `administration` est couvert par un test automatisé ou une vérification manuelle (groupe 2, 9.1), compléter les tests manquants, puis vérifier que `npm test` et `npx ng build` passent
