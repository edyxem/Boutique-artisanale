import { Component, computed, input } from '@angular/core';

/** Puce de filtre du template : pilule `--soft`, vert forêt quand elle est active. */
@Component({
  selector: 'button[uiPuce]',
  host: {
    type: 'button',
    '[attr.aria-pressed]': 'actif()',
    '[class]': 'classes()',
  },
  template: `<ng-content />`,
})
export class UiPuce {
  readonly actif = input(false);

  protected readonly classes = computed(() =>
    this.actif()
      ? 'cursor-pointer rounded-full bg-forest px-4 py-2 text-sm text-forest-ink motion-safe:transition-colors motion-safe:duration-200'
      : 'cursor-pointer rounded-full bg-soft px-4 py-2 text-sm text-ink hover:bg-line motion-safe:transition-colors motion-safe:duration-200',
  );
}
