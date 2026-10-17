import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../api.config';
import { AuthService } from './auth.service';

/**
 * Joint le jeton aux seules requêtes vers l'API de la boutique ;
 * une réponse 401 (hors connexion et inscription) termine la session.
 */
export const jetonInterceptor: HttpInterceptorFn = (requete, suivant) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const versApi = requete.url.startsWith(inject(API_URL));
  const jeton = auth.jeton();
  const avecJeton = versApi && jeton ? requete.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } }) : requete;

  return suivant(avecJeton).pipe(
    catchError((erreur: unknown) => {
      const authentification = /\/(login|register)$/.test(requete.url);
      if (versApi && !authentification && erreur instanceof HttpErrorResponse && erreur.status === 401 && auth.estConnecte()) {
        auth.expirerSession(router.url);
      }
      return throwError(() => erreur);
    }),
  );
};
