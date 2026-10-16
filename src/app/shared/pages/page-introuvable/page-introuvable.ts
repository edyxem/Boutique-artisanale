import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-introuvable',
  imports: [RouterLink],
  template: `
    <h1 class="mb-4 text-3xl font-bold text-stone-900">Page introuvable</h1>
    <p class="mb-6 text-stone-700">La page que vous cherchez n'existe pas ou a été déplacée.</p>
    <a
      routerLink="/catalogue"
      class="font-semibold text-emerald-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
    >
      Retour au catalogue
    </a>
  `,
})
export class PageIntrouvable {}
