import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { UtilisateurConnecte } from '../../core/auth/session.model';
import { Role } from '../../core/models';
import { messageErreur } from '../../core/services/erreurs-api';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { VendeurService } from '../../core/services/vendeur.service';
import { EntetePanneau } from '../../shared/panneau/panneau';
import { ColonneTableau, NotificationService, UiBadgeRole, UiBouton, UiCellule, UiEtatErreur, UiModale, UiSquelette, UiTableau } from '../../shared/ui';

interface Compte extends UtilisateurConnecte {
  /** Titulaire d'une boutique validée : son rôle se gère depuis la page Vendeurs. */
  titulaire: boolean;
}

type Changement = { type: 'role'; compte: Compte; role: Exclude<Role, 'vendeur'> } | { type: 'desactiver'; compte: Compte };

const LIBELLES_ROLE: Record<Role, string> = { client: 'Client', vendeur: 'Vendeur', admin: 'Admin' };

/** Gestion des comptes : rôle client / admin et activation, avec confirmation. */
@Component({
  selector: 'app-utilisateurs-page',
  imports: [EntetePanneau, UiBadgeRole, UiBouton, UiCellule, UiEtatErreur, UiModale, UiSquelette, UiTableau],
  template: `
    <app-entete-panneau surTitre="Administration" titre="Utilisateurs" />
    <div class="rounded-carte bg-soft p-4 md:p-5" [attr.aria-busy]="comptes.isLoading()">
      @if (comptes.isLoading()) {
        <div class="flex flex-col gap-2"><ui-squelette forme="ligne" [nombre]="4" /></div>
      } @else if (comptes.error()) {
        <ui-etat-erreur message="Les comptes sont momentanément indisponibles." (reessayer)="comptes.reload()" />
      } @else {
        <ui-tableau legende="Utilisateurs" [lignes]="comptes.value() ?? []" [colonnes]="colonnes" [recherche]="recherche" indication="Nom ou e-mail" vide="Aucun compte.">
          <ng-template uiCellule="role" let-compte>
            @if (compte.titulaire || compte.role === 'vendeur') {
              <ui-badge-role [role]="compte.role" />
            } @else {
              <select
                class="rounded-champ bg-bg px-3 py-1.5 text-sm ring-1 ring-inset ring-line focus:ring-ink disabled:opacity-50"
                [attr.aria-label]="'Rôle de ' + compte.nom"
                [disabled]="compte.id === moi()"
                [value]="compte.role"
                (change)="changerRole(compte, $any($event.target))"
              >
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            }
          </ng-template>
          <ng-template uiCellule="actions" let-compte>
            <span class="flex justify-end">
              @if (compte.actif) {
                <button uiBouton variante="contour" taille="petit" type="button" [disabled]="compte.id === moi()" [attr.aria-label]="'Désactiver ' + compte.nom" (click)="aConfirmer.set({ type: 'desactiver', compte })">
                  Désactiver
                </button>
              } @else {
                <button uiBouton taille="petit" type="button" [attr.aria-label]="'Activer ' + compte.nom" (click)="activer(compte)">Activer</button>
              }
            </span>
          </ng-template>
        </ui-tableau>
      }
    </div>

    <ui-modale [titre]="titre()" [ouverte]="!!aConfirmer()" (ouverteChange)="!$event && annuler()">
      <p>{{ question() }}</p>
      <div class="flex flex-col gap-2 sm:flex-row-reverse">
        <button uiBouton type="button" [chargement]="envoi()" (click)="executer()">Confirmer</button>
        <button uiBouton variante="contour" type="button" (click)="annuler()">Annuler</button>
      </div>
    </ui-modale>
  `,
})
export class UtilisateursPage {
  private readonly service = inject(UtilisateurService);
  private readonly vendeurs = inject(VendeurService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);
  protected readonly moi = computed(() => this.auth.utilisateurConnecte()?.id ?? null);

  protected readonly comptes = rxResource({
    stream: () =>
      forkJoin({ utilisateurs: this.service.lister(), vendeurs: this.vendeurs.lister() }).pipe(
        map(({ utilisateurs, vendeurs }) =>
          utilisateurs.map((u) => ({ ...u, titulaire: vendeurs.some((v) => v.utilisateurId === u.id && v.statut === 'valide') })),
        ),
      ),
  });
  protected readonly aConfirmer = signal<Changement | null>(null);
  protected readonly envoi = signal(false);
  private selectEnCours: HTMLSelectElement | null = null;

  protected readonly colonnes: ColonneTableau<Compte>[] = [
    { cle: 'nom', libelle: 'Nom', valeur: (c) => c.nom, triable: true },
    { cle: 'email', libelle: 'E-mail', valeur: (c) => c.email, triable: true },
    { cle: 'role', libelle: 'Rôle', valeur: (c) => LIBELLES_ROLE[c.role], triable: true },
    { cle: 'actif', libelle: 'Compte', valeur: (c) => (c.actif ? 'Actif' : 'Désactivé'), triable: true },
    { cle: 'actions', libelle: 'Actions', valeur: () => '' },
  ];
  protected readonly recherche = (c: Compte) => `${c.nom} ${c.email}`;

  protected readonly titre = computed(() => (this.aConfirmer()?.type === 'role' ? 'Changer le rôle' : 'Désactiver le compte'));
  protected readonly question = computed(() => {
    const c = this.aConfirmer();
    if (!c) {
      return '';
    }
    return c.type === 'role'
      ? `Donner le rôle « ${LIBELLES_ROLE[c.role]} » à ${c.compte.nom} ?`
      : `Voulez-vous vraiment désactiver le compte de ${c.compte.nom} ? Il ne pourra plus se connecter.`;
  });

  protected changerRole(compte: Compte, select: HTMLSelectElement): void {
    this.selectEnCours = select;
    this.aConfirmer.set({ type: 'role', compte, role: select.value as Exclude<Role, 'vendeur'> });
  }

  /** Renoncer : la liste déroulante revient au rôle actuel. */
  protected annuler(): void {
    const c = this.aConfirmer();
    if (c?.type === 'role' && this.selectEnCours) {
      this.selectEnCours.value = c.compte.role;
    }
    this.selectEnCours = null;
    this.aConfirmer.set(null);
  }

  protected activer(compte: Compte): void {
    this.service.changerActif(compte.id, true).subscribe({
      next: () => {
        this.notifications.succes(`Le compte de ${compte.nom} a été réactivé.`);
        this.comptes.reload();
      },
      error: (erreur: unknown) => this.notifications.erreur(messageErreur(erreur)),
    });
  }

  protected executer(): void {
    const c = this.aConfirmer();
    if (!c || this.envoi()) {
      return;
    }
    this.envoi.set(true);
    const requete = c.type === 'role' ? this.service.changerRole(c.compte.id, c.role) : this.service.changerActif(c.compte.id, false);
    requete.subscribe({
      next: () => {
        this.envoi.set(false);
        this.selectEnCours = null;
        this.aConfirmer.set(null);
        this.notifications.succes(c.type === 'role' ? `Le rôle de ${c.compte.nom} a été modifié.` : `Le compte de ${c.compte.nom} a été désactivé.`);
        this.comptes.reload();
      },
      error: (erreur: unknown) => {
        this.envoi.set(false);
        this.notifications.erreur(messageErreur(erreur, { 403: 'Vous ne pouvez pas modifier votre propre compte.', 409: 'Le rôle vendeur se gère depuis la page Vendeurs.' }));
      },
    });
  }
}
