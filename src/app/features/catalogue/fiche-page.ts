import { NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, inject, input, linkedSignal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ResolveFn, RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ProduitService } from '../../core/services/produit.service';
import { PrixPipe } from '../../shared/format';
import { AjoutPanier } from '../../shared/produits/ajout-panier';
import { valeurOu } from '../../shared/ressource';
import { UiBouton, UiEtatErreur, UiIcone, UiImageFondu, UiPartage, UiSquelette } from '../../shared/ui';

/** Titre du document : nom du produit visible, sinon « Produit introuvable ». */
export const titreProduitResolver: ResolveFn<string> = (route) =>
  inject(ProduitService)
    .trouverVisible(Number(route.paramMap.get('id')))
    .pipe(
      map((produit) => produit?.nom ?? 'Produit introuvable'),
      // API injoignable : la navigation aboutit quand même, la fiche affiche son message d'erreur.
      catchError(() => of('Boutique')),
    );

/** Fiche produit : la modale du template devenue une page à part entière. */
@Component({
  selector: 'app-fiche-page',
  imports: [NgOptimizedImage, RouterLink, PrixPipe, UiBouton, UiEtatErreur, UiIcone, UiImageFondu, UiPartage, UiSquelette],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-6 md:py-10" [attr.aria-busy]="produit.isLoading()">
      @if (produit.isLoading()) {
        <div class="grid gap-6 md:grid-cols-2"><ui-squelette forme="tuile" [nombre]="2" /></div>
      } @else if (produit.error()) {
        <ui-etat-erreur message="Le catalogue est momentanément indisponible." (reessayer)="produit.reload()" />
      } @else if (produit.value(); as p) {
        <article class="grid gap-6 rounded-bloc bg-bg md:grid-cols-2 md:gap-10">
          <div class="relative aspect-portrait overflow-hidden rounded-photo bg-line">
            <img
              #photo
              uiImageFondu
              [uiPartage]="'produit-' + p.id"
              [ngSrc]="p.images[0]"
              [alt]="p.nom"
              fill
              priority
              sizes="(min-width: 820px) 50vw, 100vw"
              class="object-cover"
            />
          </div>
          <div class="flex flex-col justify-center gap-5 motion-safe:animate-entree">
            <p class="text-eyebrow text-muted">{{ p.categorie?.nom }} · {{ p.vendeur.nomBoutique }}</p>
            <h1>{{ p.nom }}</h1>
            <p class="text-muted">{{ p.description }}</p>
            <dl class="flex flex-col gap-1.5">
              <div class="flex justify-between gap-4 rounded-champ bg-soft px-3 py-2.5 text-sm">
                <dt class="text-muted">Boutique</dt>
                <dd>{{ p.vendeur.nomBoutique }}</dd>
              </div>
              <div class="flex justify-between gap-4 rounded-champ bg-soft px-3 py-2.5 text-sm">
                <dt class="text-muted">Disponibilité</dt>
                <dd>{{ p.stock > 0 ? p.stock + ' en stock' : 'Épuisé' }}</dd>
              </div>
            </dl>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <p class="text-prix font-light tabular-nums">{{ p.prix | prix }}</p>
              @if (p.stock > 0) {
                <div class="flex items-center gap-3" role="group" aria-label="Quantité">
                  <button uiBouton variante="icone" type="button" aria-label="Diminuer la quantité" [disabled]="quantite() <= 1" (click)="quantite.set(quantite() - 1)">
                    <ui-icone nom="moins" [taille]="14" />
                  </button>
                  <output class="min-w-6 text-center tabular-nums" aria-live="polite">{{ quantite() }}</output>
                  <button uiBouton variante="icone" type="button" aria-label="Augmenter la quantité" [disabled]="quantite() >= p.stock" (click)="quantite.set(quantite() + 1)">
                    <ui-icone nom="plus" [taille]="14" />
                  </button>
                </div>
              }
            </div>
            <button uiBouton type="button" class="w-full" [disabled]="p.stock <= 0" (click)="ajouter()">
              {{ p.stock > 0 ? 'Ajouter au panier' : 'Épuisé' }}
            </button>
            <p class="text-eyebrow text-muted">Livraison sous 3 à 5 jours · Retours gratuits 30 jours</p>
          </div>
        </article>
      } @else {
        <div class="flex flex-col items-start gap-5 py-8">
          <p class="text-eyebrow text-muted">Boutique</p>
          <h1>Produit introuvable</h1>
          <p class="text-muted">Ce produit n'existe pas ou n'est plus en vente.</p>
          <a uiBouton routerLink="/catalogue">Retour au catalogue</a>
        </div>
      }
    </section>
  `,
})
export class FichePage {
  /** Paramètre de route `:id`. */
  readonly id = input.required<string>();

  private readonly produitService = inject(ProduitService);
  private readonly ajoutPanier = inject(AjoutPanier);
  private readonly photo = viewChild<ElementRef<HTMLImageElement>>('photo');

  protected readonly produit = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.produitService.trouverVisible(params),
  });

  /** Quantité choisie, remise à 1 à chaque changement de produit. */
  protected readonly quantite = linkedSignal({ source: () => valeurOu(this.produit, null)?.id, computation: () => 1 });

  protected ajouter(): void {
    const produit = this.produit.value();
    if (produit) {
      this.ajoutPanier.ajouter(produit, this.quantite(), this.photo()?.nativeElement);
    }
  }
}
