import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBouton } from '../../ui';

@Component({
  selector: 'app-page-introuvable',
  imports: [RouterLink, UiBouton],
  template: `
    <section class="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-14 md:py-20">
      <p class="text-eyebrow text-muted">Erreur 404</p>
      <h1>Page introuvable</h1>
      <p class="text-muted">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <a uiBouton routerLink="/catalogue">Retour au catalogue</a>
    </section>
  `,
})
export class PageIntrouvable {}
