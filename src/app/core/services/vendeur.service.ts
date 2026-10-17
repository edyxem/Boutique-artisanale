import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { UtilisateurConnecte } from '../auth/session.model';
import { API_URL } from '../api.config';
import { Utilisateur, Vendeur } from '../models';

/** Vendeur de l'administration, avec le compte de son titulaire. */
export interface VendeurGestion extends Vendeur {
  titulaire: UtilisateurConnecte | null;
}

@Service()
export class VendeurService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  private readonly auth = inject(AuthService);

  /** Demande « Devenir vendeur » : le serveur la rattache au client connecté, au statut `en_attente`. */
  demander(donnees: Pick<Vendeur, 'nomBoutique' | 'description'>): Observable<Vendeur> {
    return this.http.post<Vendeur>(`${this.api}/vendeurs`, donnees);
  }

  /** Boutique (ou demande) de l'utilisateur connecté, ou `null`. */
  maBoutique(): Observable<Vendeur | null> {
    const id = this.auth.utilisateurConnecte()?.id;
    return this.http
      .get<Vendeur[]>(`${this.api}/vendeurs`, { params: { utilisateurId: String(id) } })
      .pipe(map((vendeurs) => vendeurs[0] ?? null));
  }

  /** Tous les vendeurs avec leur titulaire (administration). */
  lister(): Observable<VendeurGestion[]> {
    return forkJoin({
      vendeurs: this.http.get<Vendeur[]>(`${this.api}/vendeurs`, { params: { _sort: 'id' } }),
      utilisateurs: this.http.get<UtilisateurConnecte[]>(`${this.api}/users`),
    }).pipe(
      map(({ vendeurs, utilisateurs }) =>
        vendeurs.map((v) => ({ ...v, titulaire: utilisateurs.find((u) => u.id === v.utilisateurId) ?? null })),
      ),
    );
  }

  valider(id: number): Observable<Vendeur> {
    return this.http.patch<Vendeur>(`${this.api}/vendeurs/${id}`, { statut: 'valide' });
  }

  refuser(id: number): Observable<Vendeur> {
    return this.http.patch<Vendeur>(`${this.api}/vendeurs/${id}`, { statut: 'refuse' });
  }

  /** Vendeurs dont les produits peuvent être vus : statut `valide` et compte utilisateur actif. */
  listerPublics(): Observable<Vendeur[]> {
    return forkJoin({
      vendeurs: this.http.get<Vendeur[]>(`${this.api}/vendeurs`, { params: { statut: 'valide' } }),
      titulaires: this.http.get<Pick<Utilisateur, 'id'>[]>(`${this.api}/users`, { params: { role: 'vendeur', actif: true } }),
    }).pipe(map(({ vendeurs, titulaires }) => vendeurs.filter((v) => titulaires.some((u) => u.id === v.utilisateurId))));
  }
}
