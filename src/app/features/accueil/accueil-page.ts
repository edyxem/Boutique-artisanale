import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBouton } from '../../shared/ui';

/** Accueil provisoire : la page du template est construite par le parcours d'achat. */
@Component({
  selector: 'app-accueil-page',
  imports: [RouterLink, UiBouton],
  template: `
    <section class="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-14 md:py-20">
      <p class="text-eyebrow text-muted">Flowering</p>
      <h1>L'objet juste, fait par des mains qui ont un nom.</h1>
      <a uiBouton routerLink="/catalogue">Découvrir la boutique</a>
      <p id="comment-ca-marche" tabindex="-1" class="text-muted">Comment fonctionne Flowering : bientôt sur cette page.</p>
    </section>
  `,
})
export class AccueilPage {}
