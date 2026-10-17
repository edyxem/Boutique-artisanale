# Tâches : intégration du design Flowering

## 1. Jetons, police et images

- [x] 1.1 Créer `src/styles/jetons.css` (variables clair, sombre, `data-theme`) et le bloc `@theme` (palette remplacée, points de rupture, arrondis, police, courbe, tailles fluides) ; tester « Valeurs du thème clair », « Passage en mode sombre » et « Thème forcé » en lisant les variables calculées
- [x] 1.2 Créer `src/styles/base.css` (corps 15 px / 1,55, titres, chiffres tabulaires, focus rose, sélection) ; tester « Police et taille de base » et « Chiffres alignés »
- [x] 1.3 Ajouter le chargement de Geist dans `src/index.html` ; vérifier dans le navigateur que la police est appliquée
- [x] 1.4 Copier `design-template/images/*.jpg` dans `public/images/` ; vérifier que les 29 fichiers sont servis sur `npm start`
- [x] 1.5 Créer le script `verifier:couleurs` et l'exécuter ; tester « Pas de couleur hors charte » (le script échoue sur un fichier de test contenant `#ff0000`)

## 2. Icônes et composants de base

- [x] 2.1 Créer `ui-icone` ; tester le rendu de chaque nom et `aria-hidden`, et « Bouton icône accessible »
- [x] 2.2 Créer `uiBouton` (variantes, tailles, chargement, désactivé) ; tester « Bouton en chargement » et « Bouton désactivé »
- [x] 2.3 Créer `ui-badge-stock`, `ui-statut` et `ui-badge-role` ; tester « Badge selon le stock » et « Pastille de statut »
- [x] 2.4 Créer `uiPuce` ; tester « Puce active »
- [x] 2.5 Créer `ui-champ` et `uiSaisie` ; tester « Champ en erreur »
- [x] 2.6 Créer `uiImageFondu` et les conteneurs à ratio fixe ; tester l'ajout de la classe visible à l'événement `load`

## 3. Surfaces et retours

- [x] 3.1 Créer `NotificationService` et `ui-toasts` (placé dans `App`) ; tester « Toast de succès » et « Toasts empilés »
- [x] 3.2 Créer `ui-modale` (`<dialog>` natif) ; tester « Fermeture par Échap » et « Focus piégé » (`showModal` simulé)
- [x] 3.3 Créer `ui-tiroir` avec le glissement tactile ; tester « Fermeture par glissement » et « Glissement trop court »
- [x] 3.4 Créer `uiConfirmer` ; tester « Suppression confirmée » et « Délai écoulé » avec de fausses minuteries
- [x] 3.5 Créer `ui-onglets` ; tester « Navigation au clavier »

## 4. Données et chargements

- [x] 4.1 Créer `ui-tableau` (`<table>` natif : recherche, tri, pagination, cellules personnalisées, état vide) ; tester « Tri d'une colonne » et « Pagination »
- [x] 4.2 Créer `ui-tuile-stat`, `ui-squelette` et `ui-etat-erreur` ; tester « Première tuile » et « Squelettes puis contenu »

## 5. Layout

- [x] 5.1 Passer `NOM_BOUTIQUE` à « Flowering » et mettre à jour les tests existants ; vérifier avec `npm test`
- [x] 5.2 Réécrire `EnTete` (trois zones, logo, variante superposée par donnée de route) ; tester « En-tête sur bureau » (structure et classes)
- [x] 5.3 Créer `MenuMobile` (burger → croix, liens, fermeture) ; tester « Menu mobile »
- [x] 5.4 Réécrire `PiedDePage` ; tester « Contenu du pied de page »
- [x] 5.5 Restyler les pages provisoires, la page introuvable et le lien d'évitement avec la charte ; vérifier qu'aucune classe `emerald` / `stone` ne subsiste et que `npm run verifier:couleurs` passe

## 6. Animations

- [x] 6.1 Créer `styles/animations.css` (keyframes, mouvement réduit) et le signal `mouvementReduit` ; tester « Ouverture du tiroir sans animation »
- [x] 6.2 Activer `withViewTransitions` et `withInMemoryScrolling`, créer `FocusTitre` ; tester « Navigation animée » (transition demandée, focus sur le `h1`) et « Retour arrière » (option de restauration active)
- [x] 6.3 Créer `uiPartage` ; tester la pose du `view-transition-name` (« Photo partagée »)
- [x] 6.4 Créer `uiReveler` et son observateur partagé ; tester « Cascade d'une grille » (délais 0 à 420 ms, une seule révélation)
- [x] 6.5 Ajouter les animations d'entrée/sortie aux surfaces ; tester « Fermeture animée de la modale » (retrait après la fin de l'animation) et « Menu mobile en cascade »
- [x] 6.6 Ajouter le tremblement, le dépliement des erreurs et la coche de succès ; tester « Soumission invalide »
- [x] 6.7 Créer `uiCompteur` ; tester « Statistique qui défile » et « Compteur sans animation »
- [x] 6.8 Ajouter les effets de survol et de pression aux composants ; tester la présence des classes `hover:` / `active:` et « Toucher sur mobile » (aucune classe de zoom permanente)

## 7. Vérification d'ensemble

- [x] 7.1 Comparer chaque page existante à `design-template/captures/` en 1440 px et 390 px (en-tête, pied de page, menu mobile) avec `npm run verifier:rendu` ; les scénarios de grille produit (« Grille produits sur mobile », « Grille produits sur bureau », « Carte produit », « Emplacement réservé ») sont vérifiés avec le catalogue, dans `parcours-achat` (tâche 10.2)
- [x] 7.2 Vérifier avec `npm run verifier:rendu` (axe-core, thèmes clair et sombre, focus clavier réel) : aucune violation, focus rose sur chaque page (« Focus au clavier ») ; modale, tiroir, menu mobile, onglets et tableau sont couverts par les tests automatisés
- [x] 7.3 Mesurer le CLS avec `npm run verifier:rendu` (« Mesure de stabilité » sur les pages existantes) et vérifier « Aucune image externe » (requêtes d'images interceptées) ; l'accueil, le catalogue, la fiche et l'administration sont mesurés par les changements qui les créent
- [x] 7.4 Écrire les tests des scénarios : vérifier que chaque scénario des specs `charte-graphique`, `composants-ui` et `animations` est couvert par un test automatisé ou une vérification manuelle (7.1 à 7.3), compléter les tests manquants, puis vérifier que `npm test`, `npm run verifier:couleurs` et `npx ng build` passent
