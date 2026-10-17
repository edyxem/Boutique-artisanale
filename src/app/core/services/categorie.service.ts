import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Categorie } from '../models';

@Service()
export class CategorieService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);

  creer(donnees: Omit<Categorie, 'id'>): Observable<Categorie> {
    return this.http.post<Categorie>(`${this.api}/categories`, donnees);
  }

  modifier(id: number, donnees: Omit<Categorie, 'id'>): Observable<Categorie> {
    return this.http.patch<Categorie>(`${this.api}/categories/${id}`, donnees);
  }

  supprimer(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/categories/${id}`);
  }

  lister(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.api}/categories`, { params: { _sort: 'id' } });
  }
}
