import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EnTete } from './core/layout/en-tete/en-tete';
import { PiedDePage } from './core/layout/pied-de-page/pied-de-page';
import { TiroirPanier } from './features/panier/tiroir-panier';
import { UiToasts } from './shared/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EnTete, PiedDePage, TiroirPanier, UiToasts],
  host: { class: 'flex min-h-dvh flex-col' },
  template: `
    <a
      href="#contenu-principal"
      (click)="allerAuContenu($event)"
      class="sr-only rounded-full bg-forest px-4 py-2 text-forest-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      Aller au contenu principal
    </a>
    <app-en-tete />
    <main #contenuPrincipal id="contenu-principal" tabindex="-1" class="min-h-dvh flex-1 focus:outline-none">
      <router-outlet />
    </main>
    <app-pied-de-page />
    <app-tiroir-panier />
    <ui-toasts />
  `,
})
export class App {
  private readonly contenuPrincipal = viewChild.required<ElementRef<HTMLElement>>('contenuPrincipal');

  /** Place le focus sur le contenu principal sans laisser le routeur interpréter l'ancre. */
  protected allerAuContenu(evenement: Event): void {
    evenement.preventDefault();
    this.contenuPrincipal().nativeElement.focus();
  }
}
