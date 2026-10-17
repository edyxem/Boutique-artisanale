# Spec Delta : composants-ui

## Purpose

Fournir les composants d'interface du template sous une forme unique et réutilisable, pour que chaque écran de Flowering ait la même apparence, le même comportement et la même accessibilité.

## ADDED Requirements

### Requirement: Boutons

Les boutons SHALL exister dans les variantes du template : plein (vert forêt), contour (`line`), clair (blanc sur photo), petit (`sm`), rond (42 px, flèche) et icône (34 px, bordure fine), tous en pilule ou en cercle. Un bouton désactivé MUST être visiblement atténué et ignorer les clics. Un bouton en cours d'action MUST afficher un indicateur de chargement, rester à la même largeur et exposer `aria-busy="true"`.

#### Scenario: Bouton en chargement

- **GIVEN** un bouton plein « Se connecter »
- **WHEN** l'action qu'il déclenche est en cours
- **THEN** il affiche un indicateur de chargement, garde sa largeur, porte `aria-busy="true"` et ignore un second clic

#### Scenario: Bouton désactivé

- **GIVEN** un bouton « Ajouter » d'un produit épuisé
- **WHEN** le visiteur clique dessus
- **THEN** rien ne se passe et le bouton est rendu avec une opacité réduite et l'attribut `disabled`

### Requirement: Badges de stock et pastilles de statut

Le badge de stock SHALL être une pastille blanche à point coloré : « En stock » (point `--ok`), « Plus que N » quand il reste 4 exemplaires ou moins (point `--warn`), « Épuisé » quand le stock est nul (point `--bad`). La pastille de statut de commande SHALL afficher le libellé du statut avec un point : `en_attente` → `--warn`, `expediee` → `--candy`, `livree` → `--ok`, `annulee` → `--bad`. Le badge de rôle MUST utiliser `--mint` pour Client, `--candy-soft` pour Admin et `--soft` pour Vendeur.

#### Scenario: Badge selon le stock

- **GIVEN** trois produits aux stocks 18, 2 et 0
- **WHEN** leurs badges s'affichent
- **THEN** ils indiquent « En stock », « Plus que 2 » et « Épuisé » avec des points vert, orange et rouge

#### Scenario: Pastille de statut

- **GIVEN** une commande `expediee`
- **WHEN** sa pastille s'affiche
- **THEN** elle indique « Expédiée » avec un point rose

### Requirement: Puces de filtre

Une puce de filtre SHALL être un bouton en pilule sur fond `--soft` qui passe en vert forêt quand elle est active, et MUST exposer son état par `aria-pressed`.

#### Scenario: Puce active

- **GIVEN** une rangée de puces dont « Tout » est active
- **WHEN** le visiteur active la puce « Cuisine »
- **THEN** « Cuisine » a `aria-pressed="true"` et un fond vert forêt, « Tout » a `aria-pressed="false"`

### Requirement: Champs de formulaire

Chaque champ SHALL avoir un libellé visible au-dessus, un cadre arrondi à 12 px entouré de `--ink` au focus, et, en cas d'erreur, un message rouge (`--bad`) sous le champ, relié par `aria-describedby`, le champ portant `aria-invalid="true"`. Les erreurs générales d'un formulaire MUST s'afficher dans un message `role="alert"` sous le formulaire, comme dans le template.

#### Scenario: Champ en erreur

- **GIVEN** un champ e-mail touché et invalide
- **WHEN** le message « Saisissez une adresse email valide. » s'affiche
- **THEN** le champ porte `aria-invalid="true"` et `aria-describedby` vers ce message

### Requirement: Notifications (toast)

Les confirmations d'action SHALL s'afficher dans un toast du template : pilule vert forêt centrée en bas de l'écran (au-dessus de la zone sûre), annoncée par une région `role="status"`. Un toast de succès MUST disparaître après 2,4 s ; un toast d'erreur reste 5 s et est annoncé avec `role="alert"`. Au plus trois toasts MUST être visibles à la fois, les plus anciens disparaissant d'abord.

#### Scenario: Toast de succès

- **GIVEN** une action réussie
- **WHEN** le toast « Tasses empilables Nuage a été ajouté au panier. » s'affiche
- **THEN** il est annoncé par la région de statut et disparaît après 2,4 s

#### Scenario: Toasts empilés

- **GIVEN** trois toasts visibles
- **WHEN** un quatrième est émis
- **THEN** le plus ancien disparaît et trois toasts restent visibles

### Requirement: Fenêtre modale

Une fenêtre modale SHALL s'afficher au centre (largeur max. 940 px, arrondi 28 px) au-dessus d'un voile, avec un titre relié par `aria-labelledby`. Le focus MUST rester piégé dans la modale, et la modale MUST se fermer avec le bouton ×, la touche Échap ou un clic sur le voile, en rendant le focus à l'élément qui l'a ouverte.

#### Scenario: Fermeture par Échap

- **GIVEN** une modale ouverte depuis le bouton « Nouveau produit »
- **WHEN** l'utilisateur appuie sur Échap
- **THEN** la modale se ferme et le focus revient sur « Nouveau produit »

#### Scenario: Focus piégé

- **GIVEN** une modale ouverte
- **WHEN** l'utilisateur appuie plusieurs fois sur Tabulation
- **THEN** le focus parcourt uniquement les éléments de la modale

### Requirement: Tiroir latéral

Un tiroir SHALL s'ouvrir depuis le bord droit (420 px de large, toute la largeur sous 480 px) au-dessus d'un voile, comme le panier du template, avec les mêmes règles de focus et de fermeture que la modale. Sur écran tactile, MUST se fermer aussi par un glissement vers la droite de plus de 80 px.

#### Scenario: Fermeture par glissement

- **GIVEN** un tiroir ouvert sur un téléphone
- **WHEN** l'utilisateur le fait glisser de 120 px vers la droite et relâche
- **THEN** le tiroir se ferme et le focus revient sur l'élément qui l'a ouvert

#### Scenario: Glissement trop court

- **GIVEN** un tiroir ouvert sur un téléphone
- **WHEN** l'utilisateur le fait glisser de 40 px et relâche
- **THEN** le tiroir revient à sa place et reste ouvert

### Requirement: Confirmation en deux clics

Une action de suppression SHALL utiliser le bouton de confirmation du template : un premier clic transforme « Supprimer » en « Confirmer » (style `armed`) pendant 3 s, avec un décompte visible ; un second clic pendant ce délai exécute l'action ; sinon le bouton revient à « Supprimer » sans rien faire. Le changement d'état MUST être annoncé aux technologies d'assistance (« Cliquez de nouveau pour confirmer la suppression de {nom} »).

#### Scenario: Suppression confirmée

- **GIVEN** un bouton « Supprimer » d'une ligne
- **WHEN** l'utilisateur clique, puis clique à nouveau dans les 3 s
- **THEN** l'action de suppression est exécutée une seule fois

#### Scenario: Délai écoulé

- **GIVEN** un bouton passé à « Confirmer »
- **WHEN** 3 s s'écoulent sans second clic
- **THEN** le bouton revient à « Supprimer » et aucune action n'est exécutée

### Requirement: Tableau de données

Les listes de gestion SHALL utiliser le tableau du template : légende qui nomme le tableau, lignes séparées arrondies à 14 px sur fond `--bg`, en-têtes triables (un clic trie, un second inverse, état exposé par `aria-sort`), champ de recherche avec libellé, pagination de 10 lignes (« Précédent », « Suivant », « Page N sur M ») et état vide explicite. Sous 820 px, le tableau MUST défiler horizontalement dans son cadre, sans faire défiler la page.

#### Scenario: Tri d'une colonne

- **GIVEN** un tableau de produits
- **WHEN** l'utilisateur active deux fois l'en-tête « Prix »
- **THEN** les lignes sont triées par prix croissant puis décroissant, et l'en-tête porte `aria-sort="ascending"` puis `"descending"`

#### Scenario: Pagination

- **GIVEN** un tableau de 23 lignes
- **WHEN** l'utilisateur active « Suivant » deux fois
- **THEN** il voit les lignes 21 à 23 et « Page 3 sur 3 », et « Suivant » est désactivé

#### Scenario: Tableau sur mobile

- **GIVEN** un écran de 390 px
- **WHEN** un tableau plus large que l'écran est affiché
- **THEN** il défile horizontalement dans son cadre et la page ne défile pas horizontalement

### Requirement: Onglets

Les onglets du template SHALL suivre le modèle d'accessibilité des onglets : `role="tablist"`, `role="tab"` avec `aria-selected`, navigation avec les flèches gauche et droite, panneau relié par `aria-controls`.

#### Scenario: Navigation au clavier

- **GIVEN** les onglets « Connexion » et « Créer un compte », le premier actif et focalisé
- **WHEN** l'utilisateur appuie sur la flèche droite
- **THEN** « Créer un compte » reçoit le focus et devient l'onglet sélectionné

### Requirement: Tuiles de statistique

Une tuile de statistique SHALL afficher un libellé, un grand chiffre (2 rem, graisse 300) et un sous-texte sur fond `--soft` arrondi à 22 px ; la première tuile d'une rangée MUST être vert forêt. Une tuile cliquable MUST être un lien dont le nom accessible reprend libellé et valeur.

#### Scenario: Première tuile

- **GIVEN** une rangée de quatre tuiles
- **WHEN** elle s'affiche
- **THEN** la première a le fond `--forest` et le texte `--forest-ink`, les autres le fond `--soft`

### Requirement: États de chargement

Pendant un chargement de données, les zones concernées SHALL afficher des squelettes aux dimensions du contenu attendu (cartes, lignes de tableau, tuiles) et porter `aria-busy="true"`. Si le chargement échoue, un message d'erreur avec un bouton « Réessayer » MUST remplacer les squelettes.

#### Scenario: Squelettes puis contenu

- **GIVEN** une liste qui charge ses données
- **WHEN** la réponse arrive
- **THEN** les squelettes sont remplacés par le contenu sans décalage de mise en page et `aria-busy` repasse à `false`
