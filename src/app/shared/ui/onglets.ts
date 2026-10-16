import { Component, ElementRef, computed, input, model, viewChildren } from '@angular/core';

export interface Onglet {
  cle: string;
  libelle: string;
  /** Identifiant du panneau contrôlé par l'onglet. */
  panneau: string;
}

/** Onglets du template (pilule `--soft`, indicateur qui glisse), modèle d'accessibilité WAI-ARIA. */
@Component({
  selector: 'ui-onglets',
  template: `
    <div role="tablist" [attr.aria-label]="libelle()" class="relative grid auto-cols-fr grid-flow-col rounded-full bg-soft p-1">
      <span
        class="absolute inset-y-1 left-1 rounded-full bg-bg motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-flowering"
        [style.width]="'calc((100% - 0.5rem) / ' + onglets().length + ')'"
        [style.transform]="'translateX(' + indexSelection() * 100 + '%)'"
        aria-hidden="true"
      ></span>
      @for (onglet of onglets(); track onglet.cle; let i = $index) {
        <button
          #bouton
          type="button"
          role="tab"
          class="relative cursor-pointer rounded-full px-4 py-2 text-bouton"
          [class.text-ink]="onglet.cle === selection()"
          [class.text-muted]="onglet.cle !== selection()"
          [id]="'onglet-' + onglet.cle"
          [attr.aria-selected]="onglet.cle === selection()"
          [attr.aria-controls]="onglet.panneau"
          [attr.tabindex]="onglet.cle === selection() ? 0 : -1"
          (click)="choisir(i)"
          (keydown)="clavier($event, i)"
        >
          {{ onglet.libelle }}
        </button>
      }
    </div>
  `,
})
export class UiOnglets {
  readonly onglets = input.required<Onglet[]>();
  readonly libelle = input.required<string>();
  readonly selection = model.required<string>();

  private readonly boutons = viewChildren<ElementRef<HTMLButtonElement>>('bouton');

  protected readonly indexSelection = computed(() =>
    Math.max(
      0,
      this.onglets().findIndex((onglet) => onglet.cle === this.selection()),
    ),
  );

  choisir(index: number): void {
    this.selection.set(this.onglets()[index].cle);
  }

  clavier(evenement: KeyboardEvent, index: number): void {
    const nombre = this.onglets().length;
    const cibles: Record<string, number> = {
      ArrowRight: (index + 1) % nombre,
      ArrowLeft: (index - 1 + nombre) % nombre,
      Home: 0,
      End: nombre - 1,
    };
    const cible = cibles[evenement.key];
    if (cible === undefined) {
      return;
    }
    evenement.preventDefault();
    this.choisir(cible);
    this.boutons()[cible]?.nativeElement.focus();
  }
}
