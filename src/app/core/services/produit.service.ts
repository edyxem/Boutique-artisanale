import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { API_URL } from '../api.config';
import { Categorie, Produit, Vendeur } from '../models';
import { CategorieService } from './categorie.service';
import { VendeurService } from './vendeur.service';
import { estVisible } from './visibilite';

/** Produit prêt à afficher, avec sa catégorie et sa boutique. */
export interface ProduitAffiche extends Produit {
  categorie: Categorie | null;
  vendeur: Vendeur;
}

@Service()
export class ProduitService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  private readonly categories = inject(CategorieService);
  private readonly vendeurs = inject(VendeurService);

  /** Produits visibles dans le catalogue, triés par identifiant. */
  listerVisibles(): Observable<ProduitAffiche[]> {
    return forkJoin({
      produits: this.http.get<Produit[]>(`${this.api}/produits`, { params: { actif: true, _sort: 'id' } }),
      categories: this.categories.lister(),
      vendeurs: this.vendeurs.listerPublics(),
    }).pipe(
      map(({ produits, categories, vendeurs }) =>
        produits
          .filter((produit) => estVisible(produit, vendeurs))
          .map((produit) => ({
            ...produit,
            categorie: categories.find((c) => c.id === produit.categorieId) ?? null,
            vendeur: vendeurs.find((v) => v.id === produit.vendeurId)!,
          })),
      ),
    );
  }

  /** Un produit visible, ou `null` s'il n'existe pas ou n'est pas en vente. */
  trouverVisible(id: number): Observable<ProduitAffiche | null> {
    return this.listerVisibles().pipe(map((produits) => produits.find((p) => p.id === id) ?? null));
  }

  /** Produits par identifiants, visibles ou non (vignettes des commandes passées). */
  parIdentifiants(ids: readonly number[]): Observable<Produit[]> {
    if (!ids.length) {
      return of([]);
    }
    return this.http
      .get<Produit[]>(`${this.api}/produits`, { params: { id: [...new Set(ids)].map(String) } })
      .pipe(catchError(() => of([])));
  }
}
