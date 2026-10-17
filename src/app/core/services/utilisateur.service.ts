import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Role } from '../models';
import { UtilisateurConnecte } from '../auth/session.model';

/** Comptes utilisateurs (administration). Le mot de passe n'est jamais renvoyé par l'API. */
@Service()
export class UtilisateurService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);

  lister(): Observable<UtilisateurConnecte[]> {
    return this.http.get<UtilisateurConnecte[]>(`${this.api}/users`, { params: { _sort: 'id' } });
  }

  changerRole(id: number, role: Exclude<Role, 'vendeur'>): Observable<UtilisateurConnecte> {
    return this.http.patch<UtilisateurConnecte>(`${this.api}/users/${id}`, { role });
  }

  changerActif(id: number, actif: boolean): Observable<UtilisateurConnecte> {
    return this.http.patch<UtilisateurConnecte>(`${this.api}/users/${id}`, { actif });
  }
}
