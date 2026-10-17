import { Component, DestroyRef, computed, inject, input, linkedSignal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CategorieService } from '../../core/services/categorie.service';
import { ProduitAffiche, ProduitService } from '../../core/services/produit.service';
import { UiCarteProduit } from '../../shared/produits/carte-produit';
import { valeurOu } from '../../shared/ressource';
import { UiBouton, UiEtatErreur, UiIcone, UiPuce, UiReveler, UiSquelette } from '../../shared/ui';

/** Délai avant de reporter la recherche dans l'URL (la grille, elle, se filtre immédiatement). */
export const DELAI_URL_RECHERCHE = 150;

export function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function correspond(produit: ProduitAffiche, recherche: string): boolean {
  return normaliser(`${produit.nom} ${produit.description} ${produit.vendeur.nomBoutique}`).includes(recherche);
}

/** Catalogue du template : puces d'univers, recherche instantanée et grille de cartes. */
@Component({
  selector: 'app-catalogue-page',
  imports: [UiBouton, UiCarteProduit, UiEtatErreur, UiIcone, UiPuce, UiReveler, UiSquelette],
  template: `
    <section class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:py-12">
      <div class="flex flex-col gap-1">
        <p class="text-eyebrow text-muted">Boutique</p>
        <h1>{{ titre() }}</h1>
      </div>

      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap gap-2" role="group" aria-label="Univers">
          <button uiPuce [actif]="!categorieActive()" (click)="filtrer(null)">Tout</button>
          @for (categorie of listeCategories(); track categorie.id) {
            <button uiPuce [actif]="categorieActive()?.id === categorie.id" (click)="filtrer(categorie.slug)">{{ categorie.nom }}</button>
          }
        </div>
        <div class="relative md:w-80">
          <label for="recherche-catalogue" class="sr-only">Rechercher un objet</label>
          <span class="pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-muted"><ui-icone nom="loupe" [taille]="16" /></span>
          <input
            id="recherche-catalogue"
            type="search"
            placeholder="Rechercher un objet"
            class="w-full rounded-full bg-soft py-3 pr-4 pl-10 text-ink placeholder:text-muted focus:ring-1 focus:ring-ink"
            [value]="texte()"
            (input)="rechercher($any($event.target).value)"
          />
        </div>
      </div>

      <h2 class="sr-only">Produits</h2>
      <div class="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4" [attr.aria-busy]="chargement()">
        @if (chargement()) {
          <ui-squelette forme="carte" [nombre]="8" />
        } @else if (produits.error()) {
          <ui-etat-erreur class="col-span-full" message="Le catalogue est momentanément indisponible." (reessayer)="recharger()" />
        } @else {
          @for (produit of filtres(); track produit.id; let i = $index) {
            <ui-carte-produit [uiReveler]="i" [produit]="produit" [prioritaire]="prioritaires().has(produit.id)" />
          } @empty {
            <div class="col-span-full flex flex-col items-center gap-3 rounded-carte bg-soft px-6 py-12 text-center">
              <h2 class="text-h3">Aucun résultat</h2>
              <p class="text-muted">Rien ne correspond à « {{ texte() }} ».</p>
              <button uiBouton variante="contour" type="button" (click)="effacer()">Effacer les filtres</button>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class CataloguePage {
  /** Paramètres de l'URL : `?categorie=<slug>&q=<texte>`. */
  readonly categorie = input<string>();
  readonly q = input<string>();

  private readonly router = inject(Router);
  private readonly produitService = inject(ProduitService);
  private readonly categorieService = inject(CategorieService);
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  protected readonly produits = rxResource({ stream: () => this.produitService.listerVisibles() });
  private readonly categories = rxResource({ stream: () => this.categorieService.lister() });

  /** Texte saisi : suit l'URL, mais filtre la grille dès la frappe. */
  protected readonly texte = linkedSignal(() => this.q() ?? '');

  /** Sans catégories (API en échec), seule la puce « Tout » reste. */
  protected readonly listeCategories = computed(() => valeurOu(this.categories, []));
  protected readonly categorieActive = computed(
    () => this.listeCategories().find((categorie) => categorie.slug === this.categorie()) ?? null,
  );
  /** La grille attend les produits et les univers : le filtre de l'URL s'applique dès le premier affichage. */
  protected readonly chargement = computed(() => this.produits.isLoading() || this.categories.isLoading());
  protected readonly titre = computed(() => this.categorieActive()?.nom ?? 'Toutes les créations');

  protected readonly filtres = computed(() => {
    const categorie = this.categorieActive();
    const recherche = normaliser(this.texte());
    return valeurOu(this.produits, []).filter(
      (produit) => (!categorie || produit.categorieId === categorie.id) && (!recherche || correspond(produit, recherche)),
    );
  });

  /**
   * Les 4 premières cartes affichées au chargement (filtre de l'URL compris) chargent leur photo en priorité.
   * Calculé une fois les données reçues, pas au filtrage : la priorité d'une image ne doit plus changer ensuite.
   */
  protected readonly prioritaires = computed(() => {
    valeurOu(this.produits, []);
    this.listeCategories();
    return new Set(untracked(this.filtres).slice(0, 4).map((p) => p.id));
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.minuterie));
  }

  protected recharger(): void {
    this.produits.reload();
    this.categories.reload();
  }

  /** Change d'univers : la navigation anime le déplacement des cartes (transition de vue). */
  protected filtrer(slug: string | null): void {
    void this.router.navigate([], { queryParams: { categorie: slug }, queryParamsHandling: 'merge' });
  }

  protected rechercher(valeur: string): void {
    this.texte.set(valeur);
    clearTimeout(this.minuterie);
    this.minuterie = setTimeout(
      () =>
        void this.router.navigate([], {
          queryParams: { q: valeur.trim() || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
          state: { sansTransition: true },
        }),
      DELAI_URL_RECHERCHE,
    );
  }

  protected effacer(): void {
    clearTimeout(this.minuterie);
    this.texte.set('');
    void this.router.navigate([], { queryParams: {} });
  }
}
