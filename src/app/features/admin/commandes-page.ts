import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { Produit, StatutCommande } from '../../core/models';
import { CommandeGestion, CommandeService } from '../../core/services/commande.service';
import { messageErreur } from '../../core/services/erreurs-api';
import { ProduitService } from '../../core/services/produit.service';
import { ACTIONS_STATUT, transitionsPermises } from '../../core/services/transitions';
import { valeurOu } from '../../shared/ressource';
import { PrixPipe } from '../../shared/format';
import { EntetePanneau } from '../../shared/panneau/panneau';
import {
  ColonneTableau,
  LIBELLES_STATUT,
  NotificationService,
  UiBouton,
  UiCellule,
  UiEtatErreur,
  UiModale,
  UiPuce,
  UiSquelette,
  UiStatut,
  UiTableau,
} from '../../shared/ui';

const STATUTS = Object.entries(LIBELLES_STATUT) as [StatutCommande, string][];

/** Liste de toutes les commandes : recherche par numéro ou client, filtre par statut repris dans l'URL. */
@Component({
  selector: 'app-commandes-page',
  imports: [DatePipe, RouterLink, PrixPipe, EntetePanneau, UiBouton, UiCellule, UiEtatErreur, UiPuce, UiSquelette, UiStatut, UiTableau],
  template: `
    <app-entete-panneau surTitre="Administration" titre="Commandes" />
    <div class="rounded-carte bg-soft p-4 md:p-5" [attr.aria-busy]="commandes.isLoading()">
      <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
        <button uiPuce [actif]="!statutActif()" (click)="filtrer(null)">Toutes</button>
        @for (s of statuts; track s[0]) {
          <button uiPuce [actif]="statutActif() === s[0]" (click)="filtrer(s[0])">{{ s[1] }}</button>
        }
      </div>
      @if (commandes.isLoading()) {
        <div class="flex flex-col gap-2"><ui-squelette forme="ligne" [nombre]="4" /></div>
      } @else if (commandes.error()) {
        <ui-etat-erreur message="Les commandes sont momentanément indisponibles." (reessayer)="commandes.reload()" />
      } @else {
        <ui-tableau legende="Commandes" [lignes]="lignes()" [colonnes]="colonnes" [recherche]="recherche" indication="Numéro ou client" vide="Aucune commande.">
          <ng-template uiCellule="date" let-commande>{{ commande.dateCreation | date: 'd MMM' }}</ng-template>
          <ng-template uiCellule="total" let-commande>{{ commande.total | prix }}</ng-template>
          <ng-template uiCellule="statut" let-commande><ui-statut [statut]="commande.statut" /></ng-template>
          <ng-template uiCellule="actions" let-commande>
            <a uiBouton variante="contour" taille="petit" [routerLink]="[commande.id]" [attr.aria-label]="'Détail de la commande n° ' + commande.id">Détail</a>
          </ng-template>
        </ui-tableau>
      }
    </div>
  `,
})
export class CommandesPage {
  /** Paramètre d'URL `?statut=…`. */
  readonly statut = input<string>();

  private readonly service = inject(CommandeService);
  private readonly router = inject(Router);

  protected readonly statuts = STATUTS;
  protected readonly commandes = rxResource({ stream: () => this.service.listerToutes() });
  protected readonly statutActif = computed(() => STATUTS.find(([s]) => s === this.statut())?.[0] ?? null);
  protected readonly lignes = computed(() => valeurOu(this.commandes, []).filter((c) => !this.statutActif() || c.statut === this.statutActif()));

  protected readonly colonnes: ColonneTableau<CommandeGestion>[] = [
    { cle: 'numero', libelle: 'N°', valeur: (c) => c.id, triable: true },
    { cle: 'date', libelle: 'Date', valeur: (c) => c.dateCreation, triable: true },
    { cle: 'client', libelle: 'Client', valeur: (c) => c.client?.nom ?? '—', triable: true },
    { cle: 'articles', libelle: 'Articles', valeur: (c) => c.lignes.reduce((n, l) => n + l.quantite, 0), triable: true, numerique: true },
    { cle: 'total', libelle: 'Total', valeur: (c) => c.total, triable: true, numerique: true },
    { cle: 'statut', libelle: 'Statut', valeur: (c) => LIBELLES_STATUT[c.statut], triable: true },
    { cle: 'actions', libelle: 'Actions', valeur: () => '' },
  ];
  protected readonly recherche = (c: CommandeGestion) => `${c.id} n° ${c.id} ${c.client?.nom ?? ''}`;

  protected filtrer(statut: StatutCommande | null): void {
    void this.router.navigate([], { queryParams: { statut } });
  }
}

/** Détail d'une commande et changement de statut selon les transitions permises. */
@Component({
  selector: 'app-detail-commande-page',
  imports: [DatePipe, NgOptimizedImage, RouterLink, PrixPipe, EntetePanneau, UiBouton, UiEtatErreur, UiModale, UiSquelette, UiStatut],
  template: `
    @if (detail.isLoading()) {
      <div class="flex flex-col gap-2 pt-16" aria-busy="true"><ui-squelette forme="tuile" [nombre]="2" /></div>
    } @else if (detail.error()) {
      <ui-etat-erreur message="La commande est momentanément indisponible." (reessayer)="detail.reload()" />
    } @else if (detail.value(); as d) {
      @if (d.commande) {
        <app-entete-panneau surTitre="Commandes" [titre]="'Commande n° ' + d.commande.id">
          <ui-statut [statut]="d.commande.statut" />
        </app-entete-panneau>
        <div class="grid gap-3.5 lg:grid-cols-3">
          <section class="rounded-carte bg-soft p-5 lg:col-span-2" aria-labelledby="titre-articles">
            <h2 id="titre-articles" class="mb-3 text-h3">Articles</h2>
            <ul class="flex flex-col gap-2">
              @for (ligne of d.commande.lignes; track ligne.produitId) {
                <li class="flex items-center gap-3 rounded-ligne bg-bg p-2.5">
                  @if (produit(d.produits, ligne.produitId); as p) {
                    <span class="relative size-10 shrink-0 overflow-hidden rounded-mini bg-line">
                      <img [ngSrc]="p.images[0]" alt="" fill class="object-cover" />
                    </span>
                  }
                  <span class="flex-1">{{ produit(d.produits, ligne.produitId)?.nom ?? 'Produit retiré' }} × {{ ligne.quantite }} — {{ ligne.quantite * ligne.prixUnitaire | prix }}</span>
                  <span class="text-sm text-muted tabular-nums">{{ ligne.prixUnitaire | prix }} l'unité</span>
                </li>
              }
            </ul>
            <p class="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span>Total</span><span class="text-h3 tabular-nums">{{ d.commande.total | prix }}</span>
            </p>
          </section>
          <section class="flex flex-col gap-3 rounded-carte bg-soft p-5 text-sm" aria-labelledby="titre-client">
            <h2 id="titre-client" class="text-h3">Client</h2>
            <p>{{ d.commande.client?.nom }}<br /><span class="text-muted">{{ d.commande.client?.email }}</span></p>
            <p class="text-muted">Passée le {{ d.commande.dateCreation | date: 'd MMMM y à HH:mm' }}</p>
            @if (d.commande.adresseLivraison; as a) {
              <p>Livraison : {{ a.nomComplet }}, {{ a.adresse }}, {{ a.codePostal }} {{ a.ville }} · {{ a.telephone }}</p>
            }
            @if (transitions().length) {
              <div class="mt-2 flex flex-col gap-2" role="group" aria-label="Changer le statut">
                @for (statut of transitions(); track statut) {
                  @if (statut === 'annulee') {
                    <button uiBouton variante="contour" type="button" (click)="confirmation.set(true)">{{ actions[statut] }}</button>
                  } @else {
                    <button uiBouton type="button" [chargement]="envoi()" (click)="changer(statut)">{{ actions[statut] }}</button>
                  }
                }
              </div>
            }
          </section>
        </div>
      } @else {
        <app-entete-panneau surTitre="Commandes" titre="Commande introuvable" />
        <a uiBouton variante="contour" routerLink="/admin/commandes">Retour aux commandes</a>
      }
    }

    <ui-modale titre="Annuler la commande" [ouverte]="confirmation()" (ouverteChange)="confirmation.set($event)">
      <p>Voulez-vous vraiment annuler la commande n° {{ id() }} ? Les articles seront remis en stock.</p>
      <div class="flex flex-col gap-2 sm:flex-row-reverse">
        <button uiBouton variante="danger" type="button" [chargement]="envoi()" (click)="changer('annulee')">Oui, annuler</button>
        <button uiBouton variante="contour" type="button" (click)="confirmation.set(false)">Non</button>
      </div>
    </ui-modale>
  `,
})
export class DetailCommandePage {
  readonly id = input.required<string>();

  private readonly service = inject(CommandeService);
  private readonly produits = inject(ProduitService);
  private readonly notifications = inject(NotificationService);

  protected readonly actions = ACTIONS_STATUT;
  protected readonly envoi = signal(false);
  protected readonly confirmation = signal(false);

  protected readonly detail = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) =>
      this.service.listerToutes().pipe(
        map((commandes) => commandes.find((c) => c.id === params) ?? null),
        switchMap((commande) =>
          (commande ? this.produits.parIdentifiants(commande.lignes.map((l) => l.produitId)) : of([] as Produit[])).pipe(
            map((produits) => ({ commande, produits })),
          ),
        ),
      ),
  });

  protected readonly transitions = computed(() => {
    const commande = valeurOu(this.detail, null)?.commande;
    return commande ? transitionsPermises(commande.statut) : [];
  });

  protected produit(produits: readonly Produit[], id: number): Produit | undefined {
    return produits.find((p) => p.id === id);
  }

  protected changer(statut: StatutCommande): void {
    if (this.envoi()) {
      return;
    }
    this.envoi.set(true);
    this.service.changerStatut(Number(this.id()), statut).subscribe({
      next: () => {
        this.envoi.set(false);
        this.confirmation.set(false);
        this.notifications.succes(`La commande n° ${this.id()} est maintenant ${LIBELLES_STATUT[statut]}.`);
        this.detail.reload();
      },
      error: (erreur: unknown) => {
        this.envoi.set(false);
        this.notifications.erreur(messageErreur(erreur, { 409: 'Ce changement de statut n\'est pas permis.' }));
      },
    });
  }
}
