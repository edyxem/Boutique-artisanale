import { NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProduitAffiche } from '../../core/services/produit.service';
import { UiPartage } from '../animations/partage';
import { PrixPipe } from '../format';
import { UiBadgeStock } from '../ui/badges';
import { UiBouton } from '../ui/bouton';
import { UiImageFondu } from '../ui/image-fondu';
import { AjoutPanier } from './ajout-panier';

/** Durée d'affichage de « Ajouté ✓ » dans le bouton après un ajout. */
export const DUREE_CONFIRMATION_AJOUT = 1200;

/** Carte produit du template : photo carrée et badge, nom, « boutique · prix », boutons Ajouter et Détails. */
@Component({
  selector: 'ui-carte-produit',
  imports: [NgOptimizedImage, RouterLink, PrixPipe, UiBadgeStock, UiBouton, UiImageFondu, UiPartage],
  host: { class: 'block' },
  template: `
    <article class="group flex h-full flex-col gap-3 rounded-carte bg-soft p-2 pb-4 text-center" [style.view-transition-name]="'carte-' + produit().id">
      <div class="relative">
      <!-- Raccourci visuel vers la fiche : doublon du bouton « Détails », masqué des technologies d'assistance. -->
      <a
        [routerLink]="['/catalogue', produit().id]"
        class="relative block aspect-square overflow-hidden rounded-vignette bg-line"
        aria-hidden="true"
        tabindex="-1"
      >
        <span class="absolute inset-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-flowering motion-safe:group-hover:scale-104">
        <img
          #photo
          uiImageFondu
          [uiPartage]="'produit-' + produit().id"
          [ngSrc]="produit().images[0]"
          [alt]="produit().nom"
          fill
          [priority]="prioritaire()"
          sizes="(min-width: 1024px) 25vw, (min-width: 820px) 33vw, 50vw"
          class="object-cover"
        />
        </span>
      </a>
      <span class="absolute top-2.5 left-2.5"><ui-badge-stock [stock]="produit().stock" /></span>
      </div>
      <div class="flex flex-1 flex-col gap-0.5 px-2">
        <h3><a [routerLink]="['/catalogue', produit().id]" class="hover:underline hover:underline-offset-4">{{ produit().nom }}</a></h3>
        <p class="text-sm text-muted">{{ produit().vendeur.nomBoutique }} · {{ produit().prix | prix }}</p>
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <button
          uiBouton
          taille="petit"
          type="button"
          [disabled]="produit().stock <= 0"
          [attr.aria-label]="ajoute() ? produit().nom + ' ajouté au panier' : 'Ajouter ' + produit().nom + ' au panier'"
          (click)="ajouter()"
        >
          {{ ajoute() ? 'Ajouté ✓' : 'Ajouter' }}
        </button>
        <!-- Comme le template, « Détails » n'apparaît qu'à partir de 480 px (la photo mène aussi à la fiche). -->
        <span class="hidden sm:contents">
          <a uiBouton variante="contour" taille="petit" [routerLink]="['/catalogue', produit().id]">Détails</a>
        </span>
      </div>
    </article>
  `,
})
export class UiCarteProduit {
  readonly produit = input.required<ProduitAffiche>();
  /** Chargement prioritaire de la photo (cartes visibles dès l'arrivée sur la page). */
  readonly prioritaire = input(false);

  private readonly ajoutPanier = inject(AjoutPanier);
  private readonly photo = viewChild.required<ElementRef<HTMLImageElement>>('photo');
  protected readonly ajoute = signal(false);
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.minuterie));
  }

  protected ajouter(): void {
    const resultat = this.ajoutPanier.ajouter(this.produit(), 1, this.photo().nativeElement);
    if (resultat === 'epuise') {
      return;
    }
    clearTimeout(this.minuterie);
    this.ajoute.set(true);
    this.minuterie = setTimeout(() => this.ajoute.set(false), DUREE_CONFIRMATION_AJOUT);
  }
}
