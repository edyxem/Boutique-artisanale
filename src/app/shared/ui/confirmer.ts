import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';

/** Délai pendant lequel le second clic confirme l'action (template : 3 s). */
export const DELAI_CONFIRMATION = 3000;

/**
 * Bouton de suppression du template : un premier clic l'arme (« Confirmer » pendant 3 s),
 * un second clic dans le délai déclenche `confirme`, sinon il revient à son état initial.
 */
@Component({
  selector: 'button[uiConfirmer]',
  host: {
    type: 'button',
    '[class]': 'classes()',
    '[attr.aria-label]': 'arme() ? "Confirmer la suppression de " + nomCible() : libelle() + " " + nomCible()',
    '(click)': 'clic()',
  },
  template: `
    @if (arme()) {
      Confirmer <span aria-hidden="true">({{ restant() }})</span>
    } @else {
      {{ libelle() }}
    }
    <span class="sr-only" aria-live="polite">
      @if (arme()) {
        Cliquez de nouveau pour confirmer la suppression de {{ nomCible() }}
      }
    </span>
  `,
})
export class UiConfirmer {
  readonly libelle = input('Supprimer');
  readonly nomCible = input.required<string>();
  readonly confirme = output<void>();

  protected readonly arme = signal(false);
  protected readonly restant = signal(3);
  private minuteries: ReturnType<typeof setTimeout>[] = [];

  protected readonly classes = computed(() =>
    this.arme()
      ? 'inline-flex cursor-pointer items-center rounded-full bg-bad px-3 py-1.5 text-sm font-medium text-white motion-safe:transition-colors motion-safe:duration-200'
      : 'inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-sm font-medium text-bad ring-1 ring-inset ring-line hover:ring-bad motion-safe:transition-colors motion-safe:duration-200',
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.desarmer());
  }

  protected clic(): void {
    if (this.arme()) {
      this.desarmer();
      this.confirme.emit();
      return;
    }
    this.arme.set(true);
    this.restant.set(DELAI_CONFIRMATION / 1000);
    for (let seconde = 1; seconde < DELAI_CONFIRMATION / 1000; seconde++) {
      this.minuteries.push(setTimeout(() => this.restant.update((n) => n - 1), seconde * 1000));
    }
    this.minuteries.push(setTimeout(() => this.desarmer(), DELAI_CONFIRMATION));
  }

  private desarmer(): void {
    this.minuteries.forEach(clearTimeout);
    this.minuteries = [];
    this.arme.set(false);
  }
}
