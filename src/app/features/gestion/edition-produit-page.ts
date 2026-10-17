import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, map, of } from 'rxjs';
import { CategorieService } from '../../core/services/categorie.service';
import { messageErreur } from '../../core/services/erreurs-api';
import { DonneesProduit, ProduitService } from '../../core/services/produit.service';
import { VendeurService } from '../../core/services/vendeur.service';
import { RechargementListe } from '../../shared/panneau/rechargement';
import { ProduitFormulaire } from '../../shared/produits/produit-formulaire';
import { NotificationService, UiModale, UiSquelette } from '../../shared/ui';
import { ModeGestion } from './liste-produits-page';

/** Création ou modification d'un produit, en modale au-dessus de la liste (comme le template). */
@Component({
  selector: 'app-edition-produit-page',
  imports: [ProduitFormulaire, UiModale, UiSquelette],
  template: `
    <ui-modale [titre]="id() ? 'Modifier le produit' : 'Nouveau produit'" [ouverte]="true" (ouverteChange)="!$event && fermer()">
      @if (donnees.isLoading()) {
        <ui-squelette forme="tuile" />
      } @else if (introuvable()) {
        <p class="text-h3">Produit introuvable</p>
        <p class="text-muted">Ce produit n'existe pas ou n'appartient pas à votre boutique.</p>
      } @else if (donnees.value(); as d) {
        <app-produit-formulaire
          [produit]="d.produit"
          [categories]="d.categories"
          [boutiques]="mode() === 'admin' ? d.boutiques : null"
          [envoi]="envoi()"
          (enregistrer)="enregistrer($event)"
        />
      }
    </ui-modale>
  `,
})
export class EditionProduitPage {
  /** Paramètre `:id` (absent en création) et mode de la section. */
  readonly id = input<string>();
  readonly mode = input<ModeGestion>('vendeur');

  private readonly produits = inject(ProduitService);
  private readonly categories = inject(CategorieService);
  private readonly vendeurs = inject(VendeurService);
  private readonly notifications = inject(NotificationService);
  private readonly rechargement = inject(RechargementListe);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly envoi = signal(false);

  protected readonly donnees = rxResource({
    params: () => ({ id: this.id() ? Number(this.id()) : null, mode: this.mode() }),
    stream: ({ params }) =>
      forkJoin({
        produit: params.id ? this.produits.trouver(params.id) : of(null),
        categories: this.categories.lister(),
        boutique: params.mode === 'vendeur' ? this.vendeurs.maBoutique() : of(null),
        boutiques: params.mode === 'admin' ? this.vendeurs.lister().pipe(map((v) => v.filter((b) => b.statut === 'valide'))) : of([]),
      }),
  });

  /** En modification : produit inexistant, ou produit d'une autre boutique pour un vendeur. */
  protected readonly introuvable = computed(() => {
    const d = this.donnees.value();
    if (!d || !this.id()) {
      return false;
    }
    return !d.produit || (this.mode() === 'vendeur' && d.produit.vendeurId !== d.boutique?.id);
  });

  protected enregistrer(produit: DonneesProduit): void {
    const d = this.donnees.value();
    const donnees = this.mode() === 'vendeur' ? { ...produit, vendeurId: d?.boutique?.id ?? produit.vendeurId } : produit;
    const id = this.id() ? Number(this.id()) : null;
    this.envoi.set(true);
    (id ? this.produits.modifier(id, donnees) : this.produits.creer(donnees)).subscribe({
      next: (enregistre) => {
        this.envoi.set(false);
        this.notifications.succes(`Le produit ${enregistre.nom} a été ${id ? 'modifié' : 'créé'}.`);
        this.rechargement.recharger();
        this.fermer();
      },
      error: (erreur: unknown) => {
        this.envoi.set(false);
        this.notifications.erreur(messageErreur(erreur));
      },
    });
  }

  protected fermer(): void {
    void this.router.navigate(['..'], { relativeTo: this.route });
  }
}
