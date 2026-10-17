# Proposition : intégration du design Flowering

## Why

`design-template/` contient **le** design du site : couleurs, police Geist, mises en page, composants, photos et interactions, décrits dans `DESIGN.md` et illustrés par `template.html` et les captures. L'application Angular a aujourd'hui un habillage Tailwind provisoire, et le plan prévoyait PrimeNG, dont le style ne correspond pas à ce design ; il est abandonné. Ce changement pose le système visuel du template dans Angular, en composants réutilisables, avant que les écrans métier ne soient construits, pour que chaque écran naisse directement dans le bon style.

## What Changes

- **Charte graphique** : variables de couleur du template (clair et sombre automatique) exposées comme thème Tailwind, police Geist, échelle typographique, conteneur, grilles et points de rupture (1024, 820, 480 px), arrondis, aplats sans ombre, focus rose.
- **Images** : les photos de `design-template/images/` deviennent la seule bibliothèque d'images du site (copiées dans `public/images/`).
- **Icônes** : les icônes SVG du template sous forme d'un composant d'icône, sans bibliothèque externe.
- **Composants d'interface réutilisables** (`src/app/shared/ui`) : boutons, badges de stock, pastilles de statut, puces de filtre, champs et messages d'erreur, toast, fenêtre modale, tiroir latéral, confirmation en deux clics, tableau de données, onglets, tuiles de statistique, squelettes de chargement.
- **Sans PrimeNG** : tableaux, fenêtres modales et toasts sont des composants maison, comme le reste de l'interface (Tailwind et éléments HTML natifs).
- **Layout du template** : en-tête en trois zones avec logo « Flowering® » centré, menu burger plein écran sous 820 px, pied de page arrondi à colonnes.
- **Animations et interactions** : transitions entre pages, éléments partagés entre pages, apparitions au défilement, survols et pressions, ouverture animée des surfaces (modale, tiroir, menu, toast), retours de formulaire, compteurs animés, squelettes, le tout désactivé proprement avec `prefers-reduced-motion`.
- **Les trois autres changements** utilisent ces composants partagés ; PrimeNG est retiré de tout le plan.
- **Configuration OpenSpec** : une section DESIGN impose `design-template/DESIGN.md` à toutes les interfaces.

## Rôles concernés

- **Tous les rôles** (visiteur, client, vendeur, administrateur) : apparence, navigation, animations et retours visuels de toutes les pages.
- **Développeurs** : bibliothèque de composants et thème Tailwind à utiliser pour tous les écrans.

## Hors périmètre

- Nouvelles fonctionnalités : aucun écran ni règle métier n'est ajouté. Les éléments du template qui supposent une donnée ou une fonction absente du plan ne sont pas repris : graphique des ventes sur 7 jours, liste « Stock à surveiller » et réassort « +10 » de l'aperçu admin, badge « Pièce unique », caractéristiques détaillées des produits, colonnes « commandes / total » des clients.
- Nouvelles images : seules les photos de `design-template/images/` sont utilisées ; aucune image distante.
- Changement de structure du template : les pages gardent l'organisation de la maquette. Les pages absentes de la maquette (commande, espace vendeur, pages admin supplémentaires) reprennent ses composants.
- Sélecteur manuel de thème clair / sombre : seul le thème automatique du template est repris.
- Contenu des pages métier (accueil, catalogue, panier, commande, espaces) : il est construit par les changements `socle-et-auth`, `parcours-achat` et `vendeur-et-admin`, avec les composants de ce changement.

## Capabilities

### New Capabilities

- `charte-graphique` : couleurs et thème sombre, typographie, mise en page responsive, arrondis et surfaces, images, icônes, focus, en-tête et pied de page du template, règle d'unité visuelle des pages hors maquette.
- `composants-ui` : comportement et apparence des composants d'interface partagés.
- `animations` : mouvements, transitions et retours visuels, et leurs garde-fous (mouvement réduit, fluidité).

### Modified Capabilities

Aucune. Ce changement est appliqué **avant** `socle-et-auth` ; les règles qui concernaient déjà le design dans les trois autres changements y ont été corrigées directement (voir Impact).

## Impact

- **Ordre d'application** : `design-template` → `socle-et-auth` → `parcours-achat` → `vendeur-et-admin`.
- **Code** : `src/styles.css` (thème Tailwind), `src/index.html` (police), `public/images/`, `src/app/shared/ui/**`, `src/app/shared/animations/**`, `core/layout/**`, `app.config.ts` (transitions de vues). Le layout Tailwind livré par `socle-projet` est réécrit.
- **Dépendances** : aucune nouvelle (Tailwind 4 est déjà installé, police chargée depuis Google Fonts).
- **Autres changements mis à jour** pour ne plus contredire le template :
  - `socle-et-auth` : PrimeNG retiré ; marque « Flowering » ; logo vers l'accueil `/` ; menu « Boutique / Nos artisans / Espace vendeur / Admin » et bouton de compte ; inscription par onglets avec mot de passe de 6 caractères minimum ; déconnexion depuis l'espace client ; données d'exemple reprises des produits et photos du template.
  - `parcours-achat` : nouvelle capacité `accueil` (page d'accueil du template) ; catalogue en puces et cartes du template ; tiroir panier ; espace client au format du template ; prix au format du template ; noms de produits des scénarios.
  - `vendeur-et-admin` : PrimeNG retiré ; suppression par confirmation en deux clics ; choix des images dans la bibliothèque du site ; formulaire produit en modale ; noms de produits des scénarios.
