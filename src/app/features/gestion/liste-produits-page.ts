import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink, RouterOutlet } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { messageErreur } from '../../core/services/erreurs-api';
import { ProduitGestion, ProduitService } from '../../core/services/produit.service';
import { VendeurService } from '../../core/services/vendeur.service';
import { valeurOu } from '../../shared/ressource';
import { PrixPipe } from '../../shared/format';
import { EntetePanneau } from '../../shared/panneau/panneau';
import { RechargementListe } from '../../shared/panneau/rechargement';
import { ColonneTableau, NotificationService, UiBouton, UiCellule, UiConfirmer, UiEtatErreur, UiSquelette, UiTableau } from '../../shared/ui';

export type ModeGestion = 'vendeur' | 'admin';

export const MESSAGE_PRODUIT_COMMANDE = 'Ce produit figure dans des commandes : désactivez-le plutôt.';

/**
 * Liste des produits en tableau : ceux de la boutique du vendeur connecté (`mode: 'vendeur'`)
 * ou tous les produits avec leur boutique (`mode: 'admin'`). L'édition s'ouvre en modale (routes enfants).
 */
@Component({
  selector: 'app-liste-produits-page',
  imports: [NgOptimizedImage, RouterLink, RouterOutlet, PrixPipe, EntetePanneau, UiBouton, UiCellule, UiConfirmer, UiEtatErreur, UiSquelette, UiTableau],
  providers: [RechargementListe],
  template: `
    <app-entete-panneau [surTitre]="mode() === 'admin' ? 'Administration' : 'Espace vendeur'" [titre]="mode() === 'admin' ? 'Produits' : 'Mes produits'">
      <a uiBouton routerLink="nouveau">Nouveau produit</a>
    </app-entete-panneau>
    <div class="rounded-carte bg-soft p-4 md:p-5" [attr.aria-busy]="produits.isLoading()">
      @if (produits.isLoading()) {
        <div class="flex flex-col gap-2"><ui-squelette forme="ligne" [nombre]="5" /></div>
      } @else if (produits.error()) {
        <ui-etat-erreur message="Les produits sont momentanément indisponibles." (reessayer)="produits.reload()" />
      } @else {
        @if (mode() === 'admin') {
          <div class="mb-4 flex flex-col gap-1.5 sm:max-w-xs">
            <label for="filtre-boutique" class="text-sm text-muted">Boutique</label>
            <select id="filtre-boutique" class="rounded-champ bg-bg px-3.5 py-2.5 ring-1 ring-inset ring-line focus:ring-ink" (change)="boutique.set(+$any($event.target).value)">
              <option value="0">Toutes les boutiques</option>
              @for (b of boutiques(); track b.id) {
                <option [value]="b.id">{{ b.nom }}</option>
              }
            </select>
          </div>
        }
        <ui-tableau
          [legende]="mode() === 'admin' ? 'Produits de toutes les boutiques' : 'Mes produits'"
          [lignes]="lignes()"
          [colonnes]="colonnes()"
          [recherche]="rechercheNom"
          indication="Nom du produit"
          vide="Aucun produit."
        >
          <ng-template uiCellule="photo" let-produit>
            <span class="relative block size-10 overflow-hidden rounded-mini bg-line">
              <img [ngSrc]="produit.images[0]" alt="" fill class="object-cover" />
            </span>
          </ng-template>
          <ng-template uiCellule="prix" let-produit>{{ produit.prix | prix }}</ng-template>
          <ng-template uiCellule="actions" let-produit>
            <span class="flex justify-end gap-2">
              <a uiBouton variante="contour" taille="petit" [routerLink]="[produit.id]" [attr.aria-label]="'Modifier ' + produit.nom">Modifier</a>
              <button uiConfirmer [nomCible]="produit.nom" (confirme)="supprimer(produit)"></button>
            </span>
          </ng-template>
        </ui-tableau>
      }
    </div>
    <router-outlet />
  `,
})
export class ListeProduitsPage {
  readonly mode = input<ModeGestion>('vendeur');

  private readonly produitService = inject(ProduitService);
  private readonly vendeurService = inject(VendeurService);
  private readonly notifications = inject(NotificationService);
  private readonly rechargement = inject(RechargementListe);

  protected readonly boutique = signal(0);

  protected readonly produits = rxResource({
    params: () => ({ mode: this.mode(), version: this.rechargement.version() }),
    stream: ({ params }) =>
      params.mode === 'admin'
        ? this.produitService.listerTous()
        : this.vendeurService.maBoutique().pipe(switchMap((b) => (b ? this.produitService.listerTous(b.id) : of([])))),
  });

  protected readonly boutiques = computed(() => {
    const vues = new Map<number, string>();
    for (const p of valeurOu(this.produits, [])) {
      if (p.vendeur) {
        vues.set(p.vendeur.id, p.vendeur.nomBoutique);
      }
    }
    return [...vues].map(([id, nom]) => ({ id, nom }));
  });

  protected readonly lignes = computed(() => {
    const boutique = this.boutique();
    return valeurOu(this.produits, []).filter((p) => !boutique || p.vendeurId === boutique);
  });

  protected readonly colonnes = computed<ColonneTableau<ProduitGestion>[]>(() => [
    { cle: 'photo', libelle: 'Photo', valeur: () => '' },
    { cle: 'nom', libelle: 'Nom', valeur: (p) => p.nom, triable: true },
    ...(this.mode() === 'admin' ? [{ cle: 'boutique', libelle: 'Boutique', valeur: (p: ProduitGestion) => p.vendeur?.nomBoutique ?? '—', triable: true }] : []),
    { cle: 'categorie', libelle: 'Catégorie', valeur: (p) => p.categorie?.nom ?? '—', triable: true },
    { cle: 'prix', libelle: 'Prix', valeur: (p) => p.prix, triable: true, numerique: true },
    { cle: 'stock', libelle: 'Stock', valeur: (p) => p.stock, triable: true, numerique: true },
    { cle: 'etat', libelle: 'État', valeur: (p) => (p.actif ? 'Actif' : 'Inactif'), triable: true },
    { cle: 'actions', libelle: 'Actions', valeur: () => '' },
  ]);

  protected readonly rechercheNom = (produit: ProduitGestion) => produit.nom;

  protected supprimer(produit: ProduitGestion): void {
    this.produitService.supprimer(produit.id).subscribe({
      next: () => {
        this.notifications.succes(`Le produit ${produit.nom} a été supprimé.`);
        this.rechargement.recharger();
      },
      error: (erreur: unknown) => this.notifications.erreur(messageErreur(erreur, { 409: MESSAGE_PRODUIT_COMMANDE })),
    });
  }
}
