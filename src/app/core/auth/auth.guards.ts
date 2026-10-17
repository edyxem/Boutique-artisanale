import { inject } from '@angular/core';
import { CanMatchFn, RedirectCommand, Router } from '@angular/router';
import { Role } from '../models';
import { AuthService } from './auth.service';

/** Chemin de retour accepté après connexion : un chemin interne (hors pages d'authentification), sinon le catalogue. */
export function retourSur(valeur: string | null | undefined): string {
  const interne = !!valeur && valeur.startsWith('/') && !valeur.startsWith('//') && !valeur.startsWith('/\\');
  if (!valeur || !interne || /^\/(connexion|inscription)(\?|$)/.test(valeur)) {
    return '/catalogue';
  }
  return valeur;
}

/**
 * Garde `canMatch` : un visiteur est envoyé à la connexion (avec l'URL demandée en retour),
 * un utilisateur d'un autre rôle à la page « Accès refusé ». Le code de la section n'est pas téléchargé.
 */
export function exigerRole(role?: Role): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.estConnecte()) {
      const demandee = router.currentNavigation()?.extractedUrl.toString() ?? '/';
      const connexion = router.createUrlTree(['/connexion'], { queryParams: { retour: demandee } });
      // Le motif passe par l'état de navigation : l'URL reste /connexion?retour=…
      return new RedirectCommand(connexion, { state: { accesProtege: true } });
    }
    if (role && auth.role() !== role) {
      return router.createUrlTree(['/acces-refuse']);
    }
    return true;
  };
}

export const authGuard = exigerRole();
export const vendeurGuard = exigerRole('vendeur');
export const adminGuard = exigerRole('admin');
