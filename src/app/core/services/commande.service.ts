import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { API_URL } from '../api.config';
import { AuthService } from '../auth/auth.service';
import { AdresseLivraison, Commande } from '../models';
import { LignePanier } from './panier.service';

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

  annuler(id: number): Observable<Commande> {
    return this.http.patch<Commande>(`${this.api}/commandes/${id}`, { statut: 'annulee' });
  }
}
