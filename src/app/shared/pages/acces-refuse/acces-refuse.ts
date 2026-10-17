import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBouton } from '../../ui';

@Component({
  selector: 'app-acces-refuse',
  imports: [RouterLink, UiBouton],
  template: `
    <section class="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-14 md:py-20">
      <p class="text-eyebrow text-muted">Erreur 403</p>
      <h1>Accès refusé</h1>
      <p class="text-muted">Votre compte n'a pas les droits nécessaires pour ouvrir cette page.</p>
      <a uiBouton routerLink="/catalogue">Retour au catalogue</a>
    </section>
  `,
})
export class AccesRefuse {}
