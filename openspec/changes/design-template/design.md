# Design : intégration du design Flowering

## Context

- Référence : `design-template/DESIGN.md` (couleurs, typo, espacements, arrondis, composants, routes, interactions), `template.html` (CSS et JS vanilla d'une SPA à vues masquées), `captures/` (cible visuelle bureau 1440 px et mobile 390 px), `images/` (29 photos Unsplash de 1100 px de large).
- Application : Angular 22.2, Tailwind 4 (`@tailwindcss/postcss`, `@import 'tailwindcss'` dans `src/styles.css`), Vitest + jsdom. Le code de `socle-projet` existe : `App` (lien d'évitement + `<main>`), `core/layout/en-tete` et `pied-de-page` en classes Tailwind provisoires (`emerald`, `stone`), `NOM_BOUTIQUE = 'FLOWERING'`, `TitreStrategy`, routes provisoires.
- Le template gère déjà `prefers-reduced-motion` (toutes transitions coupées) et le thème sombre par variables CSS.
- La configuration OpenSpec (section STYLE) exclut PrimeNG, impose les seuls jetons de `@theme`, des classes Tailwind complètes, le mobile d'abord et des animations de 200 à 300 ms sous `motion-safe:`.
- Espace disque très limité : aucune dépendance nouvelle n'est ajoutée.

Voir `proposal.md` pour le périmètre et `specs/` pour les exigences.

## Goals / Non-Goals

**Goals :**

- Un thème Tailwind qui *est* la charte du template : impossible d'utiliser une couleur, un arrondi ou un point de rupture hors charte par inadvertance.
- Des composants réutilisables qui encapsulent les classes du template, pour qu'aucun écran ne recopie de longues listes de classes.
- Des animations déclaratives (directives, classes CSS, `animate.enter` / `animate.leave` d'Angular) plutôt que du code impératif dans chaque page.

**Non-Goals :**

- Pas de copier-coller du HTML/JS du template : il sert de référence visuelle, ses fonctions (`render*`, `openCart`, etc.) ne sont pas portées.
- Pas de `@angular/animations` (API dépréciée au profit de `animate.enter` / `animate.leave`), pas de bibliothèque d'animation ni d'icônes.
- Pas de PrimeNG ni d'autre bibliothèque de composants : tableaux, modales et toasts sont maison.

## Decisions

### 1. Thème Tailwind = variables du template

`src/styles.css` est réorganisé en couches :

```text
@import 'tailwindcss';
@import './styles/jetons.css';      variables :root, thème sombre, data-theme
@import './styles/base.css';        corps, titres, focus, sélection, mouvement réduit
@import './styles/animations.css';  @keyframes, transitions de vues, [data-reveler]
```

- `jetons.css` déclare les variables de `DESIGN.md` sur `:root`, les redéfinit dans `@media (prefers-color-scheme: dark)` (garde `:root:not([data-theme="light"])`) et sous `:root[data-theme="dark"]`.
- Bloc `@theme` :
  - `--color-*: initial;` **supprime la palette par défaut** de Tailwind, puis `--color-bg: var(--bg)`, `--color-soft`, `--color-ink`, `--color-muted`, `--color-line`, `--color-forest`, `--color-forest-ink`, `--color-mint`, `--color-mint-strong`, `--color-candy`, `--color-candy-soft`, `--color-ok`, `--color-warn`, `--color-bad`, `--color-white: #fff` (texte sur photos). Classes obtenues : `bg-forest`, `text-muted`, `border-line`…
  - `--breakpoint-*: initial;` puis `--breakpoint-xs: 480px`, `--breakpoint-md: 820px`, `--breakpoint-lg: 1024px`, `--breakpoint-xl: 1280px`.
  - `--radius-bloc: 28px`, `--radius-carte: 22px`, `--radius-photo: 20px`, `--radius-vignette: 16px`, `--radius-ligne: 14px`, `--radius-champ: 12px`, `--radius-mini: 10px` (`rounded-carte`…).
  - `--font-sans: "Geist", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
  - `--ease-flowering: cubic-bezier(.2,.8,.2,1)` (`ease-flowering`), `--animate-*` pour les keyframes réutilisées (`animate-tremble`, `animate-pop`, `animate-chatoiement`).
  - Tailles typographiques fluides du template : `--text-hero: clamp(2.6rem, 5.4vw, 4.4rem)`, `--text-titre`, `--text-h2`, `--text-grand`, `--text-chiffre`…
- Alternative écartée : garder la palette Tailwind et ajouter des couleurs. La spec interdit les couleurs hors charte, et retirer la palette rend la règle vérifiable par le compilateur (classe inexistante = aucun style).
- Une règle de vérification (`npm run verifier:couleurs`, script Node de quelques lignes) cherche les couleurs écrites en dur dans `src/app` ; elle sert au scénario « Pas de couleur hors charte ».

### 2. Police et images

- Geist via Google Fonts dans `src/index.html` (`preconnect` + `display=swap`), comme le template. Alternative `@fontsource/geist` écartée : dépendance de plus et disque saturé.
- `design-template/images/*.jpg` est copié dans `public/images/` (même nom). Les images passent par `NgOptimizedImage` en mode `fill` dans un conteneur à ratio fixe (`aspect-square`, `aspect-[4/3]`, `aspect-[4/5]`), avec `sizes` adapté à la grille ; `priority` sur la photo du hero et les 4 premières cartes visibles.
- Directive `uiImageFondu` (sur les `<img>`) : fond `bg-line` sur le conteneur, opacité 0 puis 1 en 300 ms (`motion-safe:transition-opacity motion-safe:duration-300`) à l'événement `load`.

### 3. Icônes

Composant `ui-icone` (`shared/ui/icone.ts`) : `nom = input.required<'sac' | 'menu' | 'fleche' | 'loupe' | 'croix' | 'moins' | 'plus' | 'etoile'>()`, tracés SVG du template en constante, `stroke="currentColor"`, `aria-hidden="true"`. Le nom accessible est porté par le bouton parent. L'étoile est en SVG (et non en `clip-path`) pour rester nette en thème sombre.

### 4. Composants (`src/app/shared/ui/`)

| Composant | Sélecteur et API | Notes |
| --- | --- | --- |
| Bouton | `button[uiBouton], a[uiBouton]` — `variante: 'plein' \| 'contour' \| 'clair' \| 'rond' \| 'icone'`, `taille: 'normal' \| 'petit'`, `chargement: boolean` | Composant à sélecteur d'attribut : la sémantique native du `<button>` ou du lien est conservée |
| Confirmation | `button[uiConfirmer]` — `libelle`, `nomCible`, `output confirme` | Bascule « Supprimer » → « Confirmer » 3 s, barre de décompte (`scale-x` de 1 à 0, linéaire), annonce `aria-live` |
| Badge stock | `ui-badge-stock` — `stock: number` | Seuil « Plus que N » : `stock <= 4` |
| Statut | `ui-statut` — `statut: StatutCommande` | Libellés et couleurs de la spec |
| Rôle | `ui-badge-role` — `role: Role` | |
| Puce | `button[uiPuce]` — `actif = input<boolean>()` | `aria-pressed` |
| Champ | `ui-champ` — `libelle`, `controle: AbstractControl`, `messages` ; contenu projeté | Génère les `id`, ajoute `aria-describedby` / `aria-invalid` au champ projeté via la directive `uiSaisie` |
| Toast | `NotificationService` (`succes`, `erreur`) + `ui-toasts` (dans `App`) | File en signal ; 2,4 s ou 5 s ; trois au maximum ; région `role="status"` / `role="alert"` ; pilule vert forêt du template |
| Modale | `ui-modale` — `ouverte = model<boolean>()`, `titre` | `<dialog>` natif avec `showModal()` (focus piégé et Échap gérés par le navigateur), fermeture au clic sur le voile, animation de sortie avant `close()` |
| Tiroir | `ui-tiroir` — `ouvert = model<boolean>()`, `titre` | `<dialog>` natif positionné à droite ; glissement tactile (`pointerdown/move/up`, seuil 80 px) |
| Tableau | `ui-tableau` — `lignes`, `colonnes: ColonneTableau[]`, `champsRecherche`, `legende`, `parPage = 10` ; cellules personnalisées par `ng-template uiCellule="cle"` | `<table>` natif ; filtrage, tri et pagination en `computed()` ; `aria-sort` ; défilement horizontal dans son cadre |
| Onglets | `ui-onglets` / `ui-onglet` — `selection = model<string>()` | Flèches gauche/droite, indicateur glissant |
| Statistique | `ui-tuile-stat` — `libelle`, `valeur`, `sousTexte`, `lien?` | La 1re tuile vert forêt via `:first-child` |
| Squelette | `ui-squelette` — `forme: 'carte' \| 'ligne' \| 'tuile' \| 'texte'`, `nombre` | Chatoiement `--soft` → `--line` |
| Erreur | `ui-etat-erreur` — `message`, `output reessayer` | |

- Les classes Tailwind propres à chaque composant restent dans son template ; aucune règle `@apply` globale, sauf les pseudo-éléments impossibles en utilitaires (point des pastilles via `before:`, qui reste utilisable).
- `NotificationService` est créé ici (et non dans `socle-et-auth`) : le socle l'utilise directement.



### 5. Layout du template

- `EnTete` réécrit en grille `grid-cols-[1fr_auto_1fr]` : zone gauche (`<nav aria-label="Univers">`, remplie par `parcours-achat`), logo `Flowering<sup>®</sup>` centré (`routerLink="/"`, nom accessible « Flowering, accueil »), zone droite (liens, bouton panier, bouton compte). Les contenus des zones viennent des changements suivants ; ce changement livre la structure, les styles et la variante `superposee` (texte blanc, fond transparent) activée par la donnée de route `enTete: 'superpose'`.
- `MenuMobile` : `<dialog>` plein écran, liens de 1,6 rem, mêmes liens que les zones gauche et droite, fermeture par Échap / bouton / navigation (`NavigationEnd`), focus rendu au burger.
- `PiedDePage` réécrit selon le template ; colonne « Boutique » alimentée plus tard par les univers.
- `NOM_BOUTIQUE` passe à `'Flowering'` (casse du logo du template) ; `TitreStrategy` produit donc « … | Flowering ».

### 6. Animations (`src/app/shared/animations/` et `styles/animations.css`)

- **Mouvement réduit** : règle globale du template (`transition: none; animation: none` sous `prefers-reduced-motion: reduce`, fondus ramenés à 0,01 s) + signal `mouvementReduit` (`matchMedia`) pour le code (compteurs, transitions de vues, glissement tactile).
- **Transitions de pages** : `provideRouter(routes, withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated }))` ; `onViewTransitionCreated` appelle `skipTransition()` si `mouvementReduit()`. CSS : `::view-transition-old(root)` en fondu sortant 0,2 s, `::view-transition-new(root)` en fondu montant 8 px 0,3 s (`ease-flowering`). Repli automatique sans animation dans les navigateurs sans API.
- **Éléments partagés** : directive `uiPartage="produit-12"` qui pose `view-transition-name` ; la carte et la fiche d'un même produit portent le même nom.
- **Défilement et focus** : `withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })` ; service `FocusTitre` qui, à chaque `NavigationEnd` (hors première), place le focus sur le `h1` du `<main>` (`tabindex="-1"`, `preventScroll`).
- **Révélation** : directive `uiReveler` (`index = input(0)`) → `data-reveler` puis `data-revele` posé par un `IntersectionObserver` partagé (seuil 0,15, une seule fois) ; classes Tailwind `motion-safe:transition motion-safe:duration-300` sur `opacity` / `translate` 16 px, délai `min(index, 8) × 60 ms`.
- **Entrées/sorties** : `animate.enter` / `animate.leave` d'Angular avec des classes CSS (`entree-fondu-montee`, `sortie-fondu`, `entree-tiroir`, `sortie-tiroir`, `entree-cascade`) pour toasts, modale, tiroir, menu mobile, messages d'erreur et éléments de listes.
- **Compteurs** : directive `uiCompteur` (`valeur`, `format`) ; `requestAnimationFrame` de 0 à la valeur en 300 ms (ralentissement cubique) au premier passage à l'écran ; `aria-label` porte la valeur finale.
- **Formulaires** : classe `animate-tremble` (0,3 s, ±4 px) posée sur le bouton d'envoi à une soumission invalide ; dépliement des erreurs par `grid-template-rows: 0fr → 1fr` (seule exception aux propriétés transform/opacity) ; coche de succès dans `uiBouton`.
- **Survols** : utilitaires `hover:` de Tailwind 4, déjà limités aux appareils à pointeur (`@media (hover: hover)`), donc sans effet collant au toucher ; `active:scale-[.98]` sur `uiBouton`.
- **Burger → croix** : deux traits SVG animés en `rotate` / `translate`.

### 7. Tests

- Vitest + jsdom ne calcule ni mise en page ni animation : les tests vérifient les classes, attributs ARIA, états, minuteries (`vi.useFakeTimers()`) et le respect de `mouvementReduit` (`matchMedia` simulé).
- Le rendu (couleurs, grilles, captures 1440/390, CLS) est vérifié manuellement dans le navigateur, page par page, contre `design-template/captures/`.

### 8. Routes, guards et services

- Routes : aucune ajoutée ni modifiée ; seules les options de `provideRouter` changent (`withViewTransitions`, `withInMemoryScrolling`).
- Guards : aucun.
- Services créés : `NotificationService`, `FocusTitre`, observateur de révélation partagé. Modifiés : aucun.

## Risks / Trade-offs

- [Transitions de vues indisponibles dans certains navigateurs (Firefox ancien)] → repli sans animation, aucune fonction perdue.
- [Retirer la palette Tailwind casse les classes provisoires existantes (`emerald`, `stone`)] → le layout est réécrit dans ce changement ; une recherche de ces classes fait partie des tâches.
- [Police chargée depuis Google Fonts : requête externe] → `display=swap` et pile de secours ; option `@fontsource/geist` documentée si un usage hors ligne est requis.
- [`<dialog>` et `showModal()` dans jsdom] → méthodes simulées dans les tests.
- [Trop d'animations nuisent à la lisibilité] → durées courtes, une seule révélation par élément, aucun mouvement en boucle.

## Migration Plan

1. Appliquer ce changement avant `socle-et-auth`.
2. Les pages provisoires existantes reçoivent la charte ; les tests existants qui vérifient « FLOWERING » sont mis à jour pour « Flowering ».
