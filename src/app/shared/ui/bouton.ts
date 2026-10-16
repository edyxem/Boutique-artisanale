import { Component, booleanAttribute, computed, input } from '@angular/core';

export type VarianteBouton = 'plein' | 'contour' | 'clair' | 'rond' | 'icone' | 'danger';
export type TailleBouton = 'normal' | 'petit';

const BASE =
  'relative inline-flex items-center justify-center gap-2 rounded-full font-medium select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:opacity-50 motion-safe:transition motion-safe:duration-200 motion-safe:active:scale-98';

const VARIANTES: Record<VarianteBouton, string> = {
  plein: 'bg-forest text-forest-ink hover:opacity-90',
  contour: 'bg-transparent text-ink ring-1 ring-inset ring-line hover:ring-ink',
  clair: 'bg-white text-photo-ink hover:opacity-90',
  rond: 'size-10.5 bg-white text-photo-ink motion-safe:hover:-rotate-45',
  icone: 'size-8.5 bg-transparent text-ink ring-1 ring-inset ring-line hover:ring-ink',
  danger: 'bg-bad text-white hover:opacity-90',
};

const TAILLES: Record<TailleBouton, string> = {
  normal: 'px-5.5 py-3 text-bouton',
  petit: 'px-4 py-2 text-sm',
};

/**
 * Bouton du template sur un `<button>` ou un `<a>` natif (la sémantique reste celle de l'élément).
 * En chargement, le contenu reste en place (largeur conservée) et un indicateur le recouvre.
 */
@Component({
  selector: 'button[uiBouton], a[uiBouton]',
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'chargement() ? "true" : null',
    '[attr.disabled]': 'chargement() || disabled() ? "" : null',
  },
  template: `
    <span class="inline-flex items-center gap-2" [class.invisible]="chargement() || succes()">
      <ng-content />
    </span>
    @if (chargement()) {
      <span class="absolute inset-0 grid place-items-center" aria-hidden="true">
        <span class="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"></span>
      </span>
    }
    @if (succes()) {
      <span class="absolute inset-0 grid place-items-center motion-safe:animate-pop" aria-hidden="true">✓</span>
    }
  `,
})
export class UiBouton {
  readonly variante = input<VarianteBouton>('plein');
  readonly taille = input<TailleBouton>('normal');
  readonly chargement = input(false);
  readonly succes = input(false);
  /** Désactivation native (`disabled`), conservée en plus de l'état de chargement. */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() => {
    const variante = this.variante();
    const dimension = variante === 'rond' || variante === 'icone' ? '' : TAILLES[this.taille()];
    return `${BASE} ${VARIANTES[variante]} ${dimension}`;
  });
}
