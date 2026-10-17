import { Component, inject } from '@angular/core';
import { MESSAGE_PANIER_AJUSTE } from '../../core/layout/demarrage';
import { PanierService } from '../../core/services/panier.service';
import { NotificationService } from '../../shared/ui';
import { ContenuPanier } from './contenu-panier';

/** Page `/panier` : le contenu du tiroir en page complète, avec les sous-totaux. */
@Component({
  selector: 'app-panier-page',
  imports: [ContenuPanier],
  template: `
    <section class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 md:py-12">
      <div class="flex flex-col gap-1">
        <p class="text-eyebrow text-muted">Boutique</p>
        <h1>Panier</h1>
      </div>
      <app-contenu-panier [detaille]="true" />
    </section>
  `,
})
export class PanierPage {
  constructor() {
    const notifications = inject(NotificationService);
    inject(PanierService)
      .synchroniser()
      .subscribe({ next: (ajuste) => ajuste && notifications.succes(MESSAGE_PANIER_AJUSTE), error: () => undefined });
  }
}
