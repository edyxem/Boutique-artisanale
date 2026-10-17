import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Categorie } from '../models';

@Service()
export class CategorieService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);

  lister(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.api}/categories`, { params: { _sort: 'id' } });
  }
}
