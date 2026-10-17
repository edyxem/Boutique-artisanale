import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { API_URL } from '../api.config';
import { Utilisateur, Vendeur } from '../models';

@Service()
export class VendeurService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);

  /** Vendeurs dont les produits peuvent être vus : statut `valide` et compte utilisateur actif. */
  listerPublics(): Observable<Vendeur[]> {
    return forkJoin({
      vendeurs: this.http.get<Vendeur[]>(`${this.api}/vendeurs`, { params: { statut: 'valide' } }),
      titulaires: this.http.get<Pick<Utilisateur, 'id'>[]>(`${this.api}/users`, { params: { role: 'vendeur', actif: true } }),
    }).pipe(map(({ vendeurs, titulaires }) => vendeurs.filter((v) => titulaires.some((u) => u.id === v.utilisateurId))));
  }
}
