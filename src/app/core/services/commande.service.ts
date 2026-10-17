import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { UtilisateurConnecte } from '../auth/session.model';
import { API_URL } from '../api.config';
import { AuthService } from '../auth/auth.service';
import { AdresseLivraison, Commande, StatutCommande } from '../models';
import { LignePanier } from './panier.service';

/** Commande de l'administration, avec son client. */
export interface CommandeGestion extends Commande {
  client: UtilisateurConnecte | null;
}

/** Vente d'un vendeur : une ligne de commande portant sur l'un de ses produits. */
export interface Vente {
  commandeId: number;
  dateCreation: string;
  statut: StatutCommande;
  produitId: number;
  quantite: number;
  montant: number;
}

/** Erreur de création : stock insuffisant (409) ou API indisponible. */
export type ErreurCommande = 'stock' | 'serveur';

@Service()
export class CommandeService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  private readonly auth = inject(AuthService);

  /** Le serveur relit prix et stocks, fixe client, total, statut et date, puis décrémente les stocks. */
  creer(lignes: readonly LignePanier[], adresseLivraison: AdresseLivraison): Observable<Commande> {
    const corps = { lignes: lignes.map(({ produitId, quantite }) => ({ produitId, quantite })), adresseLivraison };
    return this.http
      .post<Commande>(`${this.api}/commandes`, corps)
      .pipe(catchError((erreur: unknown) => throwError(() => (erreur instanceof HttpErrorResponse && erreur.status === 409 ? 'stock' : 'serveur') satisfies ErreurCommande)));
  }

  /** Commandes de l'utilisateur connecté, de la plus récente à la plus ancienne. */
  listerMiennes(): Observable<Commande[]> {
    const id = this.auth.utilisateurConnecte()?.id;
    return this.http.get<Commande[]>(`${this.api}/commandes`, {
      params: { clientId: String(id), _sort: 'dateCreation', _order: 'desc' },
    });
  }

  /** Une commande, ou `null` si elle n'existe pas. */
  trouver(id: number): Observable<Commande | null> {
    return this.http.get<Commande>(`${this.api}/commandes/${id}`).pipe(catchError(() => of(null)));
  }

  /** Toutes les commandes avec leur client, de la plus récente à la plus ancienne (administration). */
  listerToutes(): Observable<CommandeGestion[]> {
    return forkJoin({
      commandes: this.http.get<Commande[]>(`${this.api}/commandes`, { params: { _sort: 'dateCreation', _order: 'desc' } }),
      utilisateurs: this.http.get<UtilisateurConnecte[]>(`${this.api}/users`),
    }).pipe(
      map(({ commandes, utilisateurs }) => commandes.map((c) => ({ ...c, client: utilisateurs.find((u) => u.id === c.clientId) ?? null }))),
    );
  }

  changerStatut(id: number, statut: StatutCommande): Observable<Commande> {
    return this.http.patch<Commande>(`${this.api}/commandes/${id}`, { statut });
  }

  /** Lignes de commande portant sur les produits donnés (ventes d'un vendeur), les plus récentes d'abord. */
  ventes(produitIds: readonly number[]): Observable<Vente[]> {
    return this.http.get<Commande[]>(`${this.api}/commandes`, { params: { _sort: 'dateCreation', _order: 'desc' } }).pipe(
      map((commandes) =>
        commandes.flatMap((c) =>
          c.lignes
            .filter((l) => produitIds.includes(l.produitId))
            .map((l) => ({
              commandeId: c.id,
              dateCreation: c.dateCreation,
              statut: c.statut,
              produitId: l.produitId,
              quantite: l.quantite,
              montant: l.quantite * l.prixUnitaire,
            })),
        ),
      ),
    );
  }

  annuler(id: number): Observable<Commande> {
    return this.http.patch<Commande>(`${this.api}/commandes/${id}`, { statut: 'annulee' });
  }
}
