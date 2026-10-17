import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { RouterLink } from '@angular/router';
import { UiBouton } from '../../shared/ui';
import { MesCommandes } from './mes-commandes';

/** Espace client du template : salutation, e-mail et déconnexion. */
@Component({
  selector: 'app-compte-page',
  imports: [MesCommandes, RouterLink, UiBouton],
  template: `
    <section class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:py-14">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div class="flex flex-col gap-2">
          <p class="text-eyebrow text-muted">Mon compte</p>
          <h1>Bonjour {{ auth.prenom() }}</h1>
          <p class="text-muted">{{ auth.utilisateurConnecte()?.email }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          @if (auth.role() === 'client') {
            <a uiBouton variante="contour" taille="petit" routerLink="/devenir-vendeur">Devenir artisan</a>
          }
          <button uiBouton variante="contour" taille="petit" type="button" (click)="auth.deconnexion()">Se déconnecter</button>
        </div>
      </div>
      <app-mes-commandes />
    </section>
  `,
})
export class ComptePage {
  protected readonly auth = inject(AuthService);
}
