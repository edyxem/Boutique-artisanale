import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CommandeService } from '../../core/services/commande.service';
import { PrixPipe } from '../../shared/format';
import { UiBouton, UiSquelette } from '../../shared/ui';

/** Confirmation d'une commande de l'utilisateur connecté (coche dessinée à l'arrivée). */
@Component({
  selector: 'app-confirmation-commande-page',
  imports: [RouterLink, PrixPipe, UiBouton, UiSquelette],
  template: `
    <section class="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-14 text-center md:py-20" [attr.aria-busy]="commande.isLoading()">
      @if (commande.isLoading()) {
        <ui-squelette forme="tuile" />
      } @else if (mienne(); as c) {
        <svg viewBox="0 0 52 52" class="size-16 text-forest" aria-hidden="true">
          <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="2" class="opacity-20" />
          <path
            d="M15 27l7 7 15-16"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            pathLength="1"
            stroke-dasharray="1"
            class="motion-safe:animate-trace"
          />
        </svg>
        <p class="text-eyebrow text-muted">Commande n° {{ c.id }}</p>
        <h1>Merci pour votre commande !</h1>
        <p class="text-muted">Total : <span class="tabular-nums">{{ c.total | prix }}</span>. Vous suivrez son avancement depuis votre espace client.</p>
        <a uiBouton routerLink="/compte">Voir mes commandes</a>
      } @else {
        <h1>Commande introuvable</h1>
        <a uiBouton variante="contour" routerLink="/compte">Voir mes commandes</a>
      }
    </section>
  `,
})
export class ConfirmationCommandePage {
  /** Paramètre de route `:id`. */
  readonly id = input.required<string>();

  private readonly commandes = inject(CommandeService);
  private readonly auth = inject(AuthService);

  protected readonly commande = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.commandes.trouver(params),
  });

  /** La commande n'est montrée qu'à son auteur. */
  protected readonly mienne = computed(() => {
    const commande = this.commande.value();
    return commande && commande.clientId === this.auth.utilisateurConnecte()?.id ? commande : null;
  });
}
