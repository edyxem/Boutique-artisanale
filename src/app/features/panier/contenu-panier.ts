import { NgOptimizedImage } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PanierService } from '../../core/services/panier.service';
import { PrixPipe } from '../../shared/format';
import { NotificationService, UiBouton, UiIcone } from '../../shared/ui';

/** Contenu du panier du template, partagé par le tiroir et la page `/panier`. */
@Component({
  selector: 'app-contenu-panier',
  imports: [NgOptimizedImage, RouterLink, PrixPipe, UiBouton, UiIcone],
  host: { class: 'flex min-h-0 flex-1 flex-col gap-4' },
  template: `
    @if (panier.lignesAffichees().length) {
      <ul class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto" aria-label="Articles du panier">
        @for (ligne of panier.lignesAffichees(); track ligne.produitId) {
          <li
            class="grid grid-cols-1 overflow-hidden motion-safe:animate-entree"
            animate.leave="motion-safe:animate-sortie"
          >
            <div class="flex items-center gap-3 rounded-vignette bg-soft p-2.5">
              <div class="relative size-16 shrink-0 overflow-hidden rounded-champ bg-line">
                <img [ngSrc]="ligne.produit.images[0]" alt="" width="64" height="64" class="size-full object-cover" />
              </div>
              <div class="flex min-w-0 flex-1 flex-col">
                <a [routerLink]="['/catalogue', ligne.produitId]" class="hover:underline">{{ ligne.produit.nom }}</a>
                <span class="text-sm text-muted tabular-nums">{{ ligne.produit.prix | prix }}</span>
                @if (detaille()) {
                  <span class="text-sm tabular-nums">Sous-total : {{ ligne.sousTotal | prix }}</span>
                }
              </div>
              <div class="flex items-center gap-2" role="group" [attr.aria-label]="'Quantité de ' + ligne.produit.nom">
                <button
                  uiBouton
                  variante="icone"
                  type="button"
                  class="bg-bg"
                  [attr.aria-label]="ligne.quantite === 1 ? 'Retirer ' + ligne.produit.nom + ' du panier' : 'Diminuer la quantité de ' + ligne.produit.nom"
                  (click)="diminuer(ligne.produitId, ligne.quantite, ligne.produit.nom)"
                >
                  <ui-icone nom="moins" [taille]="14" />
                </button>
                <span class="grid min-w-5 overflow-hidden text-center tabular-nums">
                  @for (quantite of [ligne.quantite]; track quantite) {
                    <span class="col-start-1 row-start-1 motion-safe:animate-entree">{{ quantite }}</span>
                  }
                </span>
                <button
                  uiBouton
                  variante="icone"
                  type="button"
                  class="bg-bg"
                  [attr.aria-label]="'Augmenter la quantité de ' + ligne.produit.nom"
                  [disabled]="ligne.quantite >= ligne.produit.stock"
                  (click)="panier.changerQuantite(ligne.produitId, ligne.quantite + 1)"
                >
                  <ui-icone nom="plus" [taille]="14" />
                </button>
              </div>
            </div>
          </li>
        }
      </ul>
      <div class="flex flex-col gap-3 border-t border-line pt-4">
        <p class="flex items-baseline justify-between">
          <span>Total</span>
          <span class="text-h2 font-light tabular-nums">{{ panier.total() | prix }}</span>
        </p>
        <p class="text-sm text-muted">Livraison offerte dès 80 € · {{ panier.partArtisans() | prix }} reversés aux artisans</p>
        @if (auth.estConnecte()) {
          <a uiBouton routerLink="/commande" class="w-full">Commander</a>
        } @else {
          <a uiBouton routerLink="/connexion" [queryParams]="{ retour: '/commande' }" class="w-full">Se connecter pour commander</a>
        }
      </div>
    } @else {
      <div class="flex flex-1 flex-col items-start gap-4 py-6">
        <p>Votre panier est vide.</p>
        <a uiBouton variante="contour" routerLink="/catalogue">Découvrir la boutique</a>
      </div>
    }
  `,
})
export class ContenuPanier {
  /** Affiche le sous-total de chaque ligne (page panier). */
  readonly detaille = input(false);

  protected readonly panier = inject(PanierService);
  protected readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  protected diminuer(produitId: number, quantite: number, nom: string): void {
    this.panier.changerQuantite(produitId, quantite - 1);
    if (quantite === 1) {
      this.notifications.succes(`${nom} retiré du panier`);
    }
  }
}
