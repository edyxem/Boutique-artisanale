import { NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AdresseLivraison } from '../../core/models';
import { CommandeService, ErreurCommande } from '../../core/services/commande.service';
import { PanierService } from '../../core/services/panier.service';
import { PrixPipe } from '../../shared/format';
import { NotificationService, UiBouton, UiChamp, UiFormulaire, UiSaisie } from '../../shared/ui';

export const MESSAGE_INDISPONIBLE = 'Certains produits ne sont plus disponibles dans la quantité demandée. Vérifiez votre panier.';

/** On ne commande pas un panier vide : retour à `/panier`. */
export const panierNonVideGuard: CanActivateFn = () =>
  inject(PanierService).nombreArticles() > 0 || inject(Router).createUrlTree(['/panier']);

/** Commande en deux étapes (livraison, récapitulatif), dans le style des panneaux de connexion du template. */
@Component({
  selector: 'app-commande-page',
  imports: [NgOptimizedImage, ReactiveFormsModule, PrixPipe, UiBouton, UiChamp, UiFormulaire, UiSaisie],
  template: `
    <section class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 md:py-12">
      <div class="flex flex-col gap-1">
        <p class="text-eyebrow text-muted">Étape {{ etape() === 'livraison' ? 1 : 2 }} sur 2</p>
        <h1>Commande</h1>
      </div>
      <div class="rounded-bloc bg-soft px-5 py-8 md:px-10">
        @if (etape() === 'livraison') {
          <form uiFormulaire [formGroup]="livraison" (ngSubmit)="continuer()" class="flex flex-col gap-4 motion-safe:animate-entree" aria-labelledby="titre-livraison">
            <h2 id="titre-livraison" class="text-h3">Adresse de livraison</h2>
            <ui-champ libelle="Nom complet" [controle]="livraison.controls.nomComplet">
              <input uiSaisie formControlName="nomComplet" autocomplete="name" />
            </ui-champ>
            <ui-champ libelle="Adresse" [controle]="livraison.controls.adresse">
              <input uiSaisie formControlName="adresse" autocomplete="street-address" />
            </ui-champ>
            <div class="grid gap-4 sm:grid-cols-2">
              <ui-champ libelle="Code postal" [controle]="livraison.controls.codePostal" [messages]="{ pattern: 'Le code postal doit contenir 5 chiffres.' }">
                <input uiSaisie formControlName="codePostal" inputmode="numeric" autocomplete="postal-code" />
              </ui-champ>
              <ui-champ libelle="Ville" [controle]="livraison.controls.ville">
                <input uiSaisie formControlName="ville" autocomplete="address-level2" />
              </ui-champ>
            </div>
            <ui-champ libelle="Téléphone" [controle]="livraison.controls.telephone" [messages]="{ pattern: 'Saisissez un numéro de téléphone valide.' }">
              <input uiSaisie type="tel" formControlName="telephone" autocomplete="tel" />
            </ui-champ>
            <button uiBouton type="submit" class="mt-2 w-full">Continuer</button>
          </form>
        } @else {
          <div class="flex flex-col gap-5 motion-safe:animate-entree-droite">
            <h2 class="text-h3">Récapitulatif</h2>
            <ul class="flex flex-col gap-2" aria-label="Articles commandés">
              @for (ligne of panier.lignesAffichees(); track ligne.produitId) {
                <li class="flex items-center gap-3 rounded-vignette bg-bg p-2.5">
                  <span class="relative size-12 shrink-0 overflow-hidden rounded-champ bg-line">
                    <img [ngSrc]="ligne.produit.images[0]" alt="" width="48" height="48" class="size-full object-cover" />
                  </span>
                  <span class="flex-1">{{ ligne.produit.nom }} × {{ ligne.quantite }} — {{ ligne.sousTotal | prix }}</span>
                  <span class="text-sm text-muted tabular-nums">{{ ligne.produit.prix | prix }} l'unité</span>
                </li>
              }
            </ul>
            <p class="flex items-baseline justify-between border-t border-line pt-4">
              <span>Total</span>
              <span class="text-h2 font-light tabular-nums">{{ panier.total() | prix }}</span>
            </p>
            <div class="rounded-vignette bg-bg p-4 text-sm">
              <p class="text-muted">Livraison à</p>
              <p>{{ adresse().nomComplet }}</p>
              <p>{{ adresse().adresse }}, {{ adresse().codePostal }} {{ adresse().ville }}</p>
              <p>{{ adresse().telephone }}</p>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row-reverse">
              <button uiBouton type="button" class="sm:flex-1" [chargement]="envoi()" (click)="confirmer()">Confirmer la commande</button>
              <button uiBouton variante="contour" type="button" (click)="etape.set('livraison')">Modifier l'adresse</button>
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class CommandePage {
  protected readonly panier = inject(PanierService);
  private readonly commandes = inject(CommandeService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  protected readonly etape = signal<'livraison' | 'recapitulatif'>('livraison');
  protected readonly envoi = signal(false);

  protected readonly livraison = inject(NonNullableFormBuilder).group({
    nomComplet: [inject(AuthService).utilisateurConnecte()?.nom ?? '', Validators.required],
    adresse: ['', Validators.required],
    codePostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    ville: ['', Validators.required],
    telephone: ['', [Validators.required, Validators.pattern(/^0\d(\s?\d{2}){4}$/)]],
  });
  protected readonly adresse = signal<AdresseLivraison>(this.livraison.getRawValue());

  constructor() {
    // Prix et stocks à jour pour le récapitulatif.
    this.panier.synchroniser().subscribe({ error: () => undefined });
  }

  protected continuer(): void {
    if (this.livraison.invalid) {
      return;
    }
    this.adresse.set(this.livraison.getRawValue());
    this.etape.set('recapitulatif');
  }

  protected confirmer(): void {
    if (this.envoi()) {
      return;
    }
    this.envoi.set(true);
    this.commandes.creer(this.panier.lignes(), this.adresse()).subscribe({
      next: (commande) => {
        this.panier.vider();
        this.notifications.succes(`Commande n° ${commande.id} enregistrée`);
        void this.router.navigate(['/commande/confirmation', commande.id]);
      },
      error: (erreur: ErreurCommande) => {
        this.envoi.set(false);
        if (erreur === 'stock') {
          this.panier.synchroniser().subscribe({ error: () => undefined });
          this.notifications.erreur(MESSAGE_INDISPONIBLE);
          void this.router.navigateByUrl('/panier');
        } else {
          this.notifications.erreur('La commande n\'a pas pu être enregistrée. Réessayez.');
        }
      },
    });
  }
}
