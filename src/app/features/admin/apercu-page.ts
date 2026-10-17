import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { EntetePanneau } from '../../shared/panneau/panneau';
import { UiEtatErreur, UiReveler, UiSquelette, UiTuileStat } from '../../shared/ui';

/** Aperçu de l'administration : quatre tuiles qui mènent aux listes correspondantes. */
@Component({
  selector: 'app-apercu-page',
  imports: [EntetePanneau, UiEtatErreur, UiReveler, UiSquelette, UiTuileStat],
  template: `
    <app-entete-panneau surTitre="Administration" titre="Aperçu" />
    @if (compteurs.isLoading()) {
      <div class="grid grid-cols-2 gap-3.5 lg:grid-cols-4" aria-busy="true"><ui-squelette forme="tuile" [nombre]="4" /></div>
    } @else if (compteurs.error()) {
      <ui-etat-erreur message="L'aperçu est momentanément indisponible." (reessayer)="compteurs.reload()" />
    } @else if (compteurs.value(); as c) {
      <div class="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <ui-tuile-stat uiReveler="0" libelle="Produits actifs" [valeur]="c.produits" sousTexte="en vente" lien="/admin/produits" />
        <ui-tuile-stat uiReveler="1" libelle="Commandes en attente" [valeur]="c.commandes" sousTexte="à expédier" lien="/admin/commandes" [parametres]="{ statut: 'en_attente' }" />
        <ui-tuile-stat uiReveler="2" libelle="Demandes de vendeur" [valeur]="c.demandes" sousTexte="en attente" lien="/admin/vendeurs" [parametres]="{ statut: 'en_attente' }" />
        <ui-tuile-stat uiReveler="3" libelle="Utilisateurs" [valeur]="c.utilisateurs" sousTexte="comptes" lien="/admin/utilisateurs" />
      </div>
    }
  `,
})
export class ApercuPage {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);

  protected readonly compteurs = rxResource({
    stream: () =>
      forkJoin({
        produits: this.http.get<unknown[]>(`${this.api}/produits`, { params: { actif: true } }),
        commandes: this.http.get<unknown[]>(`${this.api}/commandes`, { params: { statut: 'en_attente' } }),
        demandes: this.http.get<unknown[]>(`${this.api}/vendeurs`, { params: { statut: 'en_attente' } }),
        utilisateurs: this.http.get<unknown[]>(`${this.api}/users`),
      }).pipe(
        map((listes) => ({
          produits: listes.produits.length,
          commandes: listes.commandes.length,
          demandes: listes.demandes.length,
          utilisateurs: listes.utilisateurs.length,
        })),
      ),
  });
}
