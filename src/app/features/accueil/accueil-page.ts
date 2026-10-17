import { Component, ElementRef, afterRenderEffect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CategorieService } from '../../core/services/categorie.service';
import { ProduitService } from '../../core/services/produit.service';
import { HeroAccueil } from './hero-accueil';
import { BlocPrixJuste } from './prix-juste';
import { BlocEngagement, EtapesFlowering, SelectionProduits, UniversAccueil } from './sections-accueil';

/** Accueil du template : hero, engagement, sélection, prix juste, étapes et univers. */
@Component({
  selector: 'app-accueil-page',
  imports: [HeroAccueil, BlocEngagement, SelectionProduits, BlocPrixJuste, EtapesFlowering, UniversAccueil],
  template: `
    <div class="mx-auto flex max-w-7xl flex-col gap-3 px-3 pt-3 md:px-4">
      <app-hero-accueil />
      <app-bloc-engagement />
      <app-selection-produits [produits]="produits.value() ?? []" />
      <app-bloc-prix-juste />
      <app-etapes-flowering />
      <app-univers-accueil [categories]="categories.value() ?? []" [produits]="produits.value() ?? []" />
    </div>
  `,
})
export class AccueilPage {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);

  private readonly produitService = inject(ProduitService);
  private readonly categorieService = inject(CategorieService);

  protected readonly produits = rxResource({ stream: () => this.produitService.listerVisibles() });
  protected readonly categories = rxResource({ stream: () => this.categorieService.lister() });

  constructor() {
    // Lien « Nos artisans » : la section des étapes reçoit le focus après le défilement vers l'ancre.
    afterRenderEffect(() => {
      if (this.fragment() === 'comment-ca-marche') {
        this.element.querySelector<HTMLElement>('#comment-ca-marche')?.focus({ preventScroll: true });
      }
    });
  }
}
