import { Component, DestroyRef, effect, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { PanierService } from '../../core/services/panier.service';
import { MESSAGE_PANIER_AJUSTE } from '../../core/layout/demarrage';
import { NotificationService, UiTiroir } from '../../shared/ui';
import { ContenuPanier } from './contenu-panier';

/** Tiroir du panier ouvert depuis l'en-tête ; il se ferme dès qu'une navigation commence. */
@Component({
  selector: 'app-tiroir-panier',
  imports: [ContenuPanier, UiTiroir],
  template: `
    <ui-tiroir titre="Panier" [(ouverte)]="panier.tiroirOuvert">
      @if (panier.tiroirOuvert()) {
        <app-contenu-panier />
      }
    </ui-tiroir>
  `,
})
export class TiroirPanier {
  protected readonly panier = inject(PanierService);
  private readonly notifications = inject(NotificationService);

  constructor() {
    const abonnement = inject(Router)
      .events.pipe(filter((evenement) => evenement instanceof NavigationStart))
      .subscribe(() => this.panier.tiroirOuvert.set(false));
    inject(DestroyRef).onDestroy(() => abonnement.unsubscribe());

    // À chaque ouverture, prix et stocks sont relus.
    effect(() => {
      if (this.panier.tiroirOuvert()) {
        this.panier.synchroniser().subscribe({
          next: (ajuste) => ajuste && this.notifications.succes(MESSAGE_PANIER_AJUSTE),
          error: () => undefined,
        });
      }
    });
  }
}
