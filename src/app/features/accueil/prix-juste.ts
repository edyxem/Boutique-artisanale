import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PART_ARTISANS } from '../../core/services/panier.service';
import { formaterPrix } from '../../shared/format';
import { UiBouton, UiCompteur, UiReveler } from '../../shared/ui';

/** Répartition du prix de vente (template) : 72 % artisan, 14 % livraison et emballage, 14 % boutique. */
export const REPARTITION = [
  { libelle: 'Artisan', part: PART_ARTISANS, couleur: 'bg-forest' },
  { libelle: 'Livraison & emballage', part: 0.14, couleur: 'bg-candy' },
  { libelle: 'Boutique', part: 0.14, couleur: 'bg-white' },
] as const;

/** Simulateur : un curseur de 20 à 600 € recalcule en direct la répartition du prix. */
@Component({
  selector: 'app-simulateur-prix',
  template: `
    <div class="flex flex-col gap-5 rounded-carte bg-mint-strong p-5 text-photo-ink md:p-7">
      <div class="flex justify-between text-sm">
        <label for="simulateur-achat">Votre achat</label>
        <span>Simulation</span>
      </div>
      <p class="text-center text-montant font-light tabular-nums" aria-live="polite">{{ montantTexte() }}</p>
      <div class="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
        @for (part of parts(); track part.libelle) {
          <i class="block h-full motion-safe:transition-all motion-safe:duration-300" [class]="part.couleur" [style.width.%]="part.part * 100"></i>
        }
      </div>
      <dl class="flex flex-col gap-1.5 text-sm">
        @for (part of parts(); track part.libelle) {
          <div class="flex items-center justify-between gap-3">
            <dt class="flex items-center gap-2"><span class="size-2 rounded-full" [class]="part.couleur"></span>{{ part.libelle }}</dt>
            <dd class="font-medium tabular-nums">{{ part.montant }}</dd>
          </div>
        }
      </dl>
      <input
        id="simulateur-achat"
        type="range"
        min="20"
        max="600"
        step="10"
        class="w-full accent-forest"
        [value]="montant()"
        [attr.aria-valuetext]="montantTexte()"
        (input)="montant.set(+$any($event.target).value)"
      />
      <p class="rounded-full bg-white px-4 py-2 text-center text-sm">{{ note() }}</p>
    </div>
  `,
})
export class SimulateurPrix {
  readonly montant = signal(120);
  readonly montantTexte = computed(() => formaterPrix(this.montant()));
  readonly parts = computed(() =>
    REPARTITION.map((part) => ({ ...part, montant: formaterPrix(Math.round(this.montant() * part.part)) })),
  );
  readonly note = computed(() => `${this.parts()[0].montant} versés à l'atelier sous 7 jours`);
}

/** Bloc « Un prix juste » sur fond vert forêt, avec le grand chiffre « 72 % » qui défile. */
@Component({
  selector: 'app-bloc-prix-juste',
  imports: [RouterLink, SimulateurPrix, UiBouton, UiCompteur, UiReveler],
  template: `
    <div uiReveler class="grid gap-8 rounded-bloc bg-forest px-5 py-12 text-forest-ink md:grid-cols-2 md:items-center md:px-12 md:py-16">
      <div class="flex flex-col gap-5">
        <h2>Un prix juste pour celles et ceux qui fabriquent</h2>
        <p class="text-chiffre leading-none font-light tracking-tighter">
          <span uiCompteur [valeur]="72"></span><sup class="text-h2 text-candy">%</sup>
        </p>
        <p class="max-w-sm text-sm opacity-90">
          du prix de vente revient directement à l'artisan. Le reste couvre l'emballage, la livraison et le fonctionnement de la boutique.
        </p>
        <div><a uiBouton variante="clair" taille="petit" routerLink="/catalogue">Acheter une pièce</a></div>
      </div>
      <app-simulateur-prix />
    </div>
  `,
})
export class BlocPrixJuste {}
