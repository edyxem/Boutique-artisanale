import { NgTemplateOutlet } from '@angular/common';
import { Component, Directive, TemplateRef, computed, contentChildren, effect, inject, input, signal } from '@angular/core';

export interface ColonneTableau<T> {
  cle: string;
  libelle: string;
  /** Valeur utilisée pour l'affichage par défaut et pour le tri. */
  valeur: (ligne: T) => string | number;
  triable?: boolean;
  /** Aligne la colonne à droite avec des chiffres tabulaires. */
  numerique?: boolean;
}

/** Gabarit d'une cellule personnalisée : `<ng-template uiCellule="cle" let-ligne>…</ng-template>`. */
@Directive({ selector: 'ng-template[uiCellule]' })
export class UiCellule {
  readonly cle = input.required<string>({ alias: 'uiCellule' });
  readonly gabarit = inject<TemplateRef<{ $implicit: unknown }>>(TemplateRef);
}

type Sens = 'ascending' | 'descending';

function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Tableau du template : recherche, tri, pagination, lignes arrondies, défilement horizontal sur mobile. */
@Component({
  selector: 'ui-tableau',
  imports: [NgTemplateOutlet],
  host: { class: 'flex flex-col gap-4' },
  template: `
    @if (recherche()) {
      <div class="flex flex-col gap-1.5 sm:max-w-sm">
        <label [attr.for]="idRecherche" class="text-sm text-muted">Rechercher</label>
        <input
          [id]="idRecherche"
          type="search"
          class="w-full rounded-full bg-bg px-4 py-2.5 text-ink ring-1 ring-inset ring-line placeholder:text-muted focus:ring-ink"
          [placeholder]="indication()"
          [value]="texteRecherche()"
          (input)="rechercher($any($event.target).value)"
        />
      </div>
    }
    <div class="overflow-x-auto">
      <table class="w-full min-w-max border-separate border-spacing-y-1.5 text-left">
        <caption class="sr-only">{{ legende() }}</caption>
        <thead>
          <tr>
            @for (colonne of colonnes(); track colonne.cle) {
              <th
                scope="col"
                class="px-3 py-2 text-sm font-normal text-muted"
                [class.text-right]="colonne.numerique"
                [attr.aria-sort]="tri()?.cle === colonne.cle ? tri()?.sens : null"
              >
                @if (colonne.triable) {
                  <button type="button" class="inline-flex cursor-pointer items-center gap-1 hover:text-ink" (click)="trier(colonne.cle)">
                    {{ colonne.libelle }}
                    <span aria-hidden="true">{{ tri()?.cle === colonne.cle ? (tri()?.sens === 'ascending' ? '↑' : '↓') : '↕' }}</span>
                  </button>
                } @else {
                  {{ colonne.libelle }}
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (ligne of lignesPage(); track $index; let i = $index) {
            <tr class="motion-safe:animate-entree" animate.leave="motion-safe:animate-sortie" [style.animation-delay]="delai(i)">
              @for (colonne of colonnes(); track colonne.cle) {
                <td
                  class="bg-bg px-3 py-3 align-middle first:rounded-l-ligne last:rounded-r-ligne"
                  [class.text-right]="colonne.numerique"
                  [class.tabular-nums]="colonne.numerique"
                >
                  @if (gabarit(colonne.cle); as modele) {
                    <ng-container [ngTemplateOutlet]="modele" [ngTemplateOutletContext]="{ $implicit: ligne }" />
                  } @else {
                    {{ colonne.valeur(ligne) }}
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="colonnes().length" class="rounded-ligne bg-bg px-3 py-6 text-center text-muted">{{ vide() }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    @if (nombrePages() > 1) {
      <nav class="flex items-center justify-between gap-3 text-sm" [attr.aria-label]="'Pagination : ' + legende()">
        <button
          type="button"
          class="cursor-pointer rounded-full px-4 py-2 ring-1 ring-inset ring-line hover:ring-ink disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="page() === 1"
          (click)="page.set(page() - 1)"
        >
          Précédent
        </button>
        <span aria-live="polite">Page {{ page() }} sur {{ nombrePages() }}</span>
        <button
          type="button"
          class="cursor-pointer rounded-full px-4 py-2 ring-1 ring-inset ring-line hover:ring-ink disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="page() === nombrePages()"
          (click)="page.set(page() + 1)"
        >
          Suivant
        </button>
      </nav>
    }
  `,
})
export class UiTableau<T> {
  readonly lignes = input.required<readonly T[]>();
  readonly colonnes = input.required<ColonneTableau<T>[]>();
  readonly legende = input.required<string>();
  /** Texte sur lequel porte la recherche ; sans fonction, pas de champ de recherche. */
  readonly recherche = input<((ligne: T) => string) | null>(null);
  readonly indication = input('');
  readonly vide = input('Aucun élément.');
  readonly parPage = input(10);

  private readonly cellules = contentChildren(UiCellule);
  private static compteur = 0;
  protected readonly idRecherche = `tableau-recherche-${++UiTableau.compteur}`;

  readonly texteRecherche = signal('');
  readonly tri = signal<{ cle: string; sens: Sens } | null>(null);
  readonly page = signal(1);

  private readonly lignesFiltrees = computed(() => {
    const texte = normaliser(this.texteRecherche().trim());
    const champ = this.recherche();
    if (!texte || !champ) {
      return [...this.lignes()];
    }
    return this.lignes().filter((ligne) => normaliser(champ(ligne)).includes(texte));
  });

  private readonly lignesTriees = computed(() => {
    const tri = this.tri();
    const lignes = this.lignesFiltrees();
    const colonne = this.colonnes().find((c) => c.cle === tri?.cle);
    if (!tri || !colonne) {
      return lignes;
    }
    const facteur = tri.sens === 'ascending' ? 1 : -1;
    return [...lignes].sort((a, b) => {
      const va = colonne.valeur(a);
      const vb = colonne.valeur(b);
      const ordre = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'fr');
      return ordre * facteur;
    });
  });

  readonly nombrePages = computed(() => Math.max(1, Math.ceil(this.lignesTriees().length / this.parPage())));

  readonly lignesPage = computed(() => {
    const debut = (this.page() - 1) * this.parPage();
    return this.lignesTriees().slice(debut, debut + this.parPage());
  });

  constructor() {
    // Revenir à une page existante quand la liste rétrécit (recherche, suppression).
    effect(() => {
      if (this.page() > this.nombrePages()) {
        this.page.set(this.nombrePages());
      }
    });
  }

  rechercher(texte: string): void {
    this.texteRecherche.set(texte);
    this.page.set(1);
  }

  trier(cle: string): void {
    const actuel = this.tri();
    this.tri.set({ cle, sens: actuel?.cle === cle && actuel.sens === 'ascending' ? 'descending' : 'ascending' });
  }

  protected gabarit(cle: string): TemplateRef<{ $implicit: unknown }> | null {
    return this.cellules().find((cellule) => cellule.cle() === cle)?.gabarit ?? null;
  }

  /** Cascade d'apparition : 60 ms d'écart, 8 lignes au plus. */
  protected delai(index: number): string {
    return `${Math.min(index, 8) * 60}ms`;
  }
}
