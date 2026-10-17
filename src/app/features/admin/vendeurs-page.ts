import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { StatutVendeur } from '../../core/models';
import { messageErreur } from '../../core/services/erreurs-api';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { VendeurGestion, VendeurService } from '../../core/services/vendeur.service';
import { EntetePanneau } from '../../shared/panneau/panneau';
import { ColonneTableau, NotificationService, UiBouton, UiCellule, UiEtatErreur, UiModale, UiPuce, UiSquelette, UiTableau } from '../../shared/ui';

const STATUTS: { valeur: StatutVendeur; libelle: string; point: string }[] = [
  { valeur: 'en_attente', libelle: 'En attente', point: 'bg-warn' },
  { valeur: 'valide', libelle: 'Validée', point: 'bg-ok' },
  { valeur: 'refuse', libelle: 'Refusée', point: 'bg-bad' },
];

type Action = 'refuser' | 'desactiver';

/** Gestion des vendeurs : demandes à valider ou refuser, boutiques à désactiver ou réactiver. */
@Component({
  selector: 'app-vendeurs-page',
  imports: [EntetePanneau, UiBouton, UiCellule, UiEtatErreur, UiModale, UiPuce, UiSquelette, UiTableau],
  template: `
    <app-entete-panneau surTitre="Administration" titre="Vendeurs" />
    <div class="rounded-carte bg-soft p-4 md:p-5" [attr.aria-busy]="vendeurs.isLoading()">
      <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
        <button uiPuce [actif]="!statutActif()" (click)="filtrer(null)">Tous</button>
        @for (s of statuts; track s.valeur) {
          <button uiPuce [actif]="statutActif() === s.valeur" (click)="filtrer(s.valeur)">{{ s.libelle }}</button>
        }
      </div>
      @if (vendeurs.isLoading()) {
        <div class="flex flex-col gap-2"><ui-squelette forme="ligne" [nombre]="3" /></div>
      } @else if (vendeurs.error()) {
        <ui-etat-erreur message="Les vendeurs sont momentanément indisponibles." (reessayer)="vendeurs.reload()" />
      } @else {
        <ui-tableau legende="Vendeurs" [lignes]="lignes()" [colonnes]="colonnes" [recherche]="recherche" indication="Boutique ou titulaire" vide="Aucun vendeur.">
          <ng-template uiCellule="statut" let-vendeur>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-bg px-2.5 py-1 text-sm">
              <span class="size-1.5 rounded-full" [class]="point(vendeur.statut)"></span>{{ libelle(vendeur.statut) }}
            </span>
          </ng-template>
          <ng-template uiCellule="actions" let-vendeur>
            <span class="flex justify-end gap-2">
              @if (vendeur.statut === 'en_attente') {
                <button uiBouton taille="petit" type="button" [attr.aria-label]="'Valider ' + vendeur.nomBoutique" (click)="valider(vendeur)">Valider</button>
                <button uiBouton variante="contour" taille="petit" type="button" [attr.aria-label]="'Refuser ' + vendeur.nomBoutique" (click)="confirmer('refuser', vendeur)">Refuser</button>
              } @else if (vendeur.statut === 'valide' && vendeur.titulaire?.actif) {
                <button uiBouton variante="contour" taille="petit" type="button" [attr.aria-label]="'Désactiver ' + vendeur.nomBoutique" (click)="confirmer('desactiver', vendeur)">Désactiver</button>
              } @else if (vendeur.statut === 'valide') {
                <button uiBouton taille="petit" type="button" [attr.aria-label]="'Réactiver ' + vendeur.nomBoutique" (click)="reactiver(vendeur)">Réactiver</button>
              }
            </span>
          </ng-template>
        </ui-tableau>
      }
    </div>

    <ui-modale [titre]="titreConfirmation()" [ouverte]="!!aConfirmer()" (ouverteChange)="!$event && aConfirmer.set(null)">
      <p>{{ questionConfirmation() }}</p>
      <div class="flex flex-col gap-2 sm:flex-row-reverse">
        <button uiBouton variante="danger" type="button" [chargement]="envoi()" (click)="executer()">Confirmer</button>
        <button uiBouton variante="contour" type="button" (click)="aConfirmer.set(null)">Annuler</button>
      </div>
    </ui-modale>
  `,
})
export class VendeursPage {
  /** Paramètre d'URL `?statut=…`. */
  readonly statut = input<string>();

  private readonly service = inject(VendeurService);
  private readonly utilisateurs = inject(UtilisateurService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly statuts = STATUTS;
  protected readonly vendeurs = rxResource({ stream: () => this.service.lister() });
  protected readonly aConfirmer = signal<{ action: Action; vendeur: VendeurGestion } | null>(null);
  protected readonly envoi = signal(false);

  protected readonly statutActif = computed(() => STATUTS.find((s) => s.valeur === this.statut())?.valeur ?? null);
  protected readonly lignes = computed(() => (this.vendeurs.value() ?? []).filter((v) => !this.statutActif() || v.statut === this.statutActif()));

  protected readonly colonnes: ColonneTableau<VendeurGestion>[] = [
    { cle: 'boutique', libelle: 'Boutique', valeur: (v) => v.nomBoutique, triable: true },
    { cle: 'titulaire', libelle: 'Titulaire', valeur: (v) => v.titulaire?.nom ?? '—', triable: true },
    { cle: 'email', libelle: 'E-mail', valeur: (v) => v.titulaire?.email ?? '—' },
    { cle: 'statut', libelle: 'Statut', valeur: (v) => v.statut, triable: true },
    { cle: 'compte', libelle: 'Compte', valeur: (v) => (v.titulaire?.actif ? 'Actif' : 'Désactivé') },
    { cle: 'actions', libelle: 'Actions', valeur: () => '' },
  ];
  protected readonly recherche = (v: VendeurGestion) => `${v.nomBoutique} ${v.titulaire?.nom ?? ''}`;

  protected readonly titreConfirmation = computed(() => {
    const c = this.aConfirmer();
    return c?.action === 'refuser' ? 'Refuser la demande' : 'Désactiver la boutique';
  });
  protected readonly questionConfirmation = computed(() => {
    const c = this.aConfirmer();
    if (!c) {
      return '';
    }
    return c.action === 'refuser'
      ? `Voulez-vous vraiment refuser la demande de ${c.vendeur.nomBoutique} ?`
      : `Voulez-vous vraiment désactiver ${c.vendeur.nomBoutique} ? Ses produits ne seront plus visibles et son titulaire ne pourra plus se connecter.`;
  });

  protected libelle(statut: StatutVendeur): string {
    return STATUTS.find((s) => s.valeur === statut)?.libelle ?? statut;
  }

  protected point(statut: StatutVendeur): string {
    return STATUTS.find((s) => s.valeur === statut)?.point ?? 'bg-line';
  }

  protected filtrer(statut: StatutVendeur | null): void {
    void this.router.navigate([], { queryParams: { statut } });
  }

  protected confirmer(action: Action, vendeur: VendeurGestion): void {
    this.aConfirmer.set({ action, vendeur });
  }

  protected valider(vendeur: VendeurGestion): void {
    this.agir(this.service.valider(vendeur.id), `La boutique ${vendeur.nomBoutique} a été validée.`);
  }

  protected reactiver(vendeur: VendeurGestion): void {
    this.agir(this.utilisateurs.changerActif(vendeur.utilisateurId, true), `La boutique ${vendeur.nomBoutique} a été réactivée.`);
  }

  protected executer(): void {
    const c = this.aConfirmer();
    if (!c || this.envoi()) {
      return;
    }
    if (c.action === 'refuser') {
      this.agir(this.service.refuser(c.vendeur.id), `La demande de ${c.vendeur.nomBoutique} a été refusée.`);
    } else {
      this.agir(this.utilisateurs.changerActif(c.vendeur.utilisateurId, false), `La boutique ${c.vendeur.nomBoutique} a été désactivée.`);
    }
  }

  private agir(requete: Observable<unknown>, succes: string): void {
    this.envoi.set(true);
    requete.subscribe({
      next: () => {
        this.envoi.set(false);
        this.aConfirmer.set(null);
        this.notifications.succes(succes);
        this.vendeurs.reload();
      },
      error: (erreur: unknown) => {
        this.envoi.set(false);
        this.notifications.erreur(messageErreur(erreur));
      },
    });
  }
}
