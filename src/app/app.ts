import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EnTete } from './core/layout/en-tete/en-tete';
import { PiedDePage } from './core/layout/pied-de-page/pied-de-page';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EnTete, PiedDePage],
  host: { class: 'flex min-h-dvh flex-col' },
  template: `
    <a
      href="#contenu-principal"
      (click)="allerAuContenu($event)"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded focus:bg-emerald-800 focus:px-4 focus:py-2 focus:text-white"
    >
      Aller au contenu principal
    </a>
    <app-en-tete />
    <main
      #contenuPrincipal
      id="contenu-principal"
      tabindex="-1"
      class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 focus:outline-none"
    >
      <router-outlet />
    </main>
    <app-pied-de-page />
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
