import { Component, computed, input } from '@angular/core';

export type NomIcone = 'sac' | 'menu' | 'fleche' | 'loupe' | 'croix' | 'moins' | 'plus' | 'etoile';

/** Tracés SVG du template (viewBox 0 0 24 24). */
const TRACES: Record<NomIcone, string[]> = {
  sac: ['M5 8h14l-1.4 11.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8z', 'M9 8V6a3 3 0 0 1 6 0v2'],
  menu: ['M4 8h16', 'M4 16h16'],
  fleche: ['M7 17 17 7', 'M8 7h9v9'],
  loupe: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'm20 20-4-4'],
  croix: ['M6 6l12 12', 'M18 6 6 18'],
  moins: ['M5 12h14'],
  plus: ['M12 5v14', 'M5 12h14'],
  etoile: ['m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z'],
};

/** Icône SVG du template, décorative : le nom accessible est porté par l'élément parent. */
@Component({
  selector: 'ui-icone',
  host: { class: 'inline-flex shrink-0', 'aria-hidden': 'true' },
  template: `
    <svg
      [attr.width]="taille()"
      [attr.height]="taille()"
      viewBox="0 0 24 24"
      [attr.fill]="nom() === 'etoile' ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
    >
      @for (trace of traces(); track $index) {
        <path [attr.d]="trace" />
      }
    </svg>
  `,
})
export class UiIcone {
  readonly nom = input.required<NomIcone>();
  readonly taille = input(20);

  protected readonly traces = computed(() => TRACES[this.nom()]);
}
