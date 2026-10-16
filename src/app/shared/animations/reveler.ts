import { DestroyRef, Directive, ElementRef, computed, inject, input, signal } from '@angular/core';
import { ObservateurVisibilite } from './observateur';

/** Écart entre deux éléments d'une même cascade et nombre maximal d'éléments décalés. */
export const ECART_CASCADE = 60;
export const MAXIMUM_CASCADE = 8;

/**
 * Apparition au défilement : fondu montant de 16 px en 300 ms, une seule fois,
 * en cascade selon `index` (60 ms d'écart, 8 éléments au plus).
 */
@Directive({
  selector: '[uiReveler]',
  host: {
    '[class]': 'revele() ? classesVisible : classesCachees',
    '[attr.data-revele]': 'revele() ? "" : null',
    '[style.transition-delay]': 'delai()',
  },
})
export class UiReveler {
  readonly index = input(0, { alias: 'uiReveler', transform: (valeur: number | string) => Number(valeur) || 0 });

  readonly revele = signal(false);
  readonly delai = computed(() => `${Math.min(this.index(), MAXIMUM_CASCADE) * ECART_CASCADE}ms`);

  protected readonly classesCachees =
    'motion-safe:translate-y-4 motion-safe:opacity-0 motion-safe:transition motion-safe:duration-300 motion-safe:ease-flowering';
  protected readonly classesVisible =
    'motion-safe:translate-y-0 motion-safe:opacity-100 motion-safe:transition motion-safe:duration-300 motion-safe:ease-flowering';

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const observateur = inject(ObservateurVisibilite);
    observateur.observer(element, () => this.revele.set(true));
    inject(DestroyRef).onDestroy(() => observateur.oublier(element));
  }
}
