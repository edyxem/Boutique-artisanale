import { HttpErrorResponse, HttpInterceptorFn, HttpParams, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import db from '../../../db.json';

type Enregistrement = Record<string, unknown> & { id: number };
export type DonneesApi = Record<'users' | 'vendeurs' | 'categories' | 'produits' | 'commandes', Enregistrement[]>;

/** Copie fraîche du jeu de données d'exemple, modifiable par un test. */
export function donneesExemple(): DonneesApi {
  return structuredClone(db) as unknown as DonneesApi;
}

function filtrer(liste: Enregistrement[], params: HttpParams): Enregistrement[] {
  let resultat = liste.filter((element) =>
    params
      .keys()
      .filter((cle) => !cle.startsWith('_'))
      .every((cle) => params.getAll(cle)!.some((valeur) => String(element[cle]) === valeur)),
  );
  const tri = params.get('_sort');
  if (tri) {
    const sens = params.get('_order') === 'desc' ? -1 : 1;
    resultat = [...resultat].sort((a, b) => (String(a[tri]) < String(b[tri]) ? -sens : String(a[tri]) > String(b[tri]) ? sens : 0));
  }
  return resultat;
}

/**
 * Intercepteur de test : répond aux GET de l'API à partir de `donnees` (mot de passe retiré des utilisateurs),
 * laisse passer les autres requêtes (à traiter avec HttpTestingController).
 */
export function fausseApi(donnees: DonneesApi, base = 'http://localhost:3000'): HttpInterceptorFn {
  return (requete, suivant) => {
    if (requete.method !== 'GET' || !requete.url.startsWith(base)) {
      return suivant(requete);
    }
    const [ressource, id] = requete.url.slice(base.length + 1).split('/') as [keyof DonneesApi, string | undefined];
    const liste = (donnees[ressource] ?? []).map((element) => {
      const { password, ...reste } = element;
      void password;
      return reste as Enregistrement;
    });
    if (id !== undefined) {
      const element = liste.find((e) => e.id === Number(id));
      return element
        ? of(new HttpResponse({ status: 200, body: element }))
        : throwError(() => new HttpErrorResponse({ status: 404, url: requete.url }));
    }
    return of(new HttpResponse({ status: 200, body: filtrer(liste, requete.params) }));
  };
}
