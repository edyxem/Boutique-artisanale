import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBouton } from './bouton';
import { UiCompteur } from '../animations/compteur';

/** Tuile de statistique du template ; la première d'une rangée est vert forêt. */
@Component({
  selector: 'ui-tuile-stat',
  imports: [RouterLink, UiCompteur],
  host: { class: 'group/tuile block' },
  template: `
    @if (lien(); as cible) {
      <a
        [routerLink]="cible"
        [queryParams]="parametres()"
        class="flex h-full flex-col gap-1 rounded-carte bg-soft p-5 text-ink hover:ring-1 hover:ring-inset hover:ring-line group-first/tuile:bg-forest group-first/tuile:text-forest-ink motion-safe:transition-shadow motion-safe:duration-200"
        [attr.aria-label]="libelle() + ' : ' + valeur() + ' ' + sousTexte()"
      >
        <span class="text-sm opacity-80">{{ libelle() }}</span>
        <span class="text-stat font-light tabular-nums" uiCompteur [valeur]="valeurNumerique()" [format]="format()"></span>
        <span class="text-sm opacity-80">{{ sousTexte() }}</span>
      </a>
    } @else {
      <div class="flex h-full flex-col gap-1 rounded-carte bg-soft p-5 text-ink group-first/tuile:bg-forest group-first/tuile:text-forest-ink">
        <span class="text-sm opacity-80">{{ libelle() }}</span>
        <span class="text-stat font-light tabular-nums" uiCompteur [valeur]="valeurNumerique()" [format]="format()"></span>
        <span class="text-sm opacity-80">{{ sousTexte() }}</span>
      </div>
    }
  `,
})
export class UiTuileStat {
  readonly libelle = input.required<string>();
  readonly valeur = input.required<number>();
  readonly sousTexte = input('');
  readonly lien = input<string | null>(null);
  readonly parametres = input<Record<string, string> | null>(null);
  readonly format = input<'nombre' | 'euro'>('nombre');

  protected readonly valeurNumerique = computed(() => this.valeur());
}

/** Squelette de chargement aux dimensions du contenu attendu. */
@Component({
  selector: 'ui-squelette',
  host: { class: 'contents' },
  template: `
    @for (i of elements(); track i) {
      @switch (forme()) {
        @case ('carte') {
          <div class="flex flex-col gap-3 rounded-carte bg-soft p-2 pb-4" aria-hidden="true">
            <div class="aspect-square rounded-vignette bg-line"></div>
            <div class="mx-auto h-4 w-2/3 rounded-full bg-line"></div>
            <div class="mx-auto h-3 w-1/2 rounded-full bg-line"></div>
          </div>
        }
        @case ('ligne') {
          <div class="h-12 rounded-ligne bg-line" aria-hidden="true"></div>
        }
        @case ('tuile') {
          <div class="h-32 rounded-carte bg-soft" aria-hidden="true"></div>
        }
        @default {
          <div class="h-4 w-full rounded-full bg-line" aria-hidden="true"></div>
        }
      }
    }
  `,
})
export class UiSquelette {
  readonly forme = input<'carte' | 'ligne' | 'tuile' | 'texte'>('texte');
  readonly nombre = input(1);

  protected readonly elements = computed(() => Array.from({ length: this.nombre() }, (_, i) => i));
}

/** Message d'erreur de chargement avec un bouton « Réessayer ». */
@Component({
  selector: 'ui-etat-erreur',
  imports: [UiBouton],
  host: { class: 'flex flex-col items-center gap-4 rounded-carte bg-soft px-6 py-10 text-center' },
  template: `
    <p role="alert" class="text-ink">{{ message() }}</p>
    <button uiBouton variante="contour" type="button" (click)="reessayer.emit()">Réessayer</button>
  `,
})
export class UiEtatErreur {
  readonly message = input.required<string>();
  readonly reessayer = output<void>();
}
