import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { CommandeService, Vente } from '../../core/services/commande.service';
import { ProduitService } from '../../core/services/produit.service';
import { VendeurService } from '../../core/services/vendeur.service';
import { valeurOu } from '../../shared/ressource';
import { PrixPipe } from '../../shared/format';
import { EntetePanneau } from '../../shared/panneau/panneau';
import { ColonneTableau, UiCellule, UiEtatErreur, UiSquelette, UiStatut, UiTableau, UiTuileStat } from '../../shared/ui';

interface VenteAffichee extends Vente {
  produit: string;
}

/** Ventes du vendeur : chaque ligne de commande portant sur l'un de ses produits, et le total hors annulations. */
@Component({
  selector: 'app-mes-ventes-page',
  imports: [DatePipe, PrixPipe, EntetePanneau, UiCellule, UiEtatErreur, UiSquelette, UiStatut, UiTableau, UiTuileStat],
  template: `
    <app-entete-panneau surTitre="Espace vendeur" titre="Mes ventes" />
    @if (ventes.isLoading()) {
      <div class="flex flex-col gap-2" aria-busy="true"><ui-squelette forme="ligne" [nombre]="4" /></div>
    } @else if (ventes.error()) {
      <ui-etat-erreur message="Vos ventes sont momentanément indisponibles." (reessayer)="ventes.reload()" />
    } @else {
      <div class="mb-3.5 grid gap-3.5 sm:grid-cols-2">
        <ui-tuile-stat libelle="Total des ventes" [valeur]="total()" format="euro" sousTexte="hors commandes annulées" />
        <ui-tuile-stat libelle="Articles vendus" [valeur]="articles()" sousTexte="hors commandes annulées" />
      </div>
      <div class="rounded-carte bg-soft p-4 md:p-5">
        <ui-tableau legende="Mes ventes" [lignes]="ventes.value() ?? []" [colonnes]="colonnes" vide="Aucune vente pour le moment.">
          <ng-template uiCellule="date" let-vente>{{ vente.dateCreation | date: 'd MMM' }}</ng-template>
          <ng-template uiCellule="montant" let-vente>{{ vente.montant | prix }}</ng-template>
          <ng-template uiCellule="statut" let-vente><ui-statut [statut]="vente.statut" /></ng-template>
        </ui-tableau>
      </div>
    }
  `,
})
export class MesVentesPage {
  private readonly vendeurs = inject(VendeurService);
  private readonly produits = inject(ProduitService);
  private readonly commandes = inject(CommandeService);

  protected readonly ventes = rxResource({
    stream: () =>
      this.vendeurs.maBoutique().pipe(
        switchMap((boutique) => (boutique ? this.produits.listerTous(boutique.id) : of([]))),
        switchMap((produits) =>
          forkJoin({ produits: of(produits), ventes: this.commandes.ventes(produits.map((p) => p.id)) }),
        ),
        map(({ produits, ventes }): VenteAffichee[] =>
          ventes.map((vente) => ({ ...vente, produit: produits.find((p) => p.id === vente.produitId)?.nom ?? '—' })),
        ),
      ),
  });

  private readonly retenues = computed(() => valeurOu(this.ventes, []).filter((v) => v.statut !== 'annulee'));
  protected readonly total = computed(() => this.retenues().reduce((somme, v) => somme + v.montant, 0));
  protected readonly articles = computed(() => this.retenues().reduce((somme, v) => somme + v.quantite, 0));

  protected readonly colonnes: ColonneTableau<VenteAffichee>[] = [
    { cle: 'commande', libelle: 'Commande', valeur: (v) => `n° ${v.commandeId}` },
    { cle: 'date', libelle: 'Date', valeur: (v) => v.dateCreation, triable: true },
    { cle: 'produit', libelle: 'Produit', valeur: (v) => v.produit, triable: true },
    { cle: 'quantite', libelle: 'Quantité', valeur: (v) => v.quantite, triable: true, numerique: true },
    { cle: 'montant', libelle: 'Montant', valeur: (v) => v.montant, triable: true, numerique: true },
    { cle: 'statut', libelle: 'Statut', valeur: (v) => v.statut },
  ];
}
