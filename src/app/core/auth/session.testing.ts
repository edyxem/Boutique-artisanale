import { Role } from '../models';
import { CLE_SESSION } from './auth.service';
import { Session, UtilisateurConnecte } from './session.model';

/** Utilisateurs des tests, calqués sur les comptes de démonstration. */
export const UTILISATEURS: Record<Role, UtilisateurConnecte> = {
  admin: { id: 1, nom: 'Mariam Diallo', email: 'admin@boutique.fr', role: 'admin', actif: true },
  client: { id: 2, nom: 'Lucas Martin', email: 'client@boutique.fr', role: 'client', actif: true },
  vendeur: { id: 3, nom: 'Claire Fontaine', email: 'vendeur1@boutique.fr', role: 'vendeur', actif: true },
};

/** Jeton JWT factice (non signé) qui expire dans `secondes` secondes. */
export function jetonFactice(secondes = 3600, sub = 2): string {
  const encoder = (objet: object) => btoa(JSON.stringify(objet)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encoder({ alg: 'HS256', typ: 'JWT' })}.${encoder({ sub: String(sub), exp: Math.floor(Date.now() / 1000) + secondes })}.signature`;
}

/** Enregistre une session dans le navigateur, avant la création d'AuthService. */
export function enregistrerSession(role: Role, secondes = 3600): Session {
  const utilisateur = UTILISATEURS[role];
  const session: Session = { jeton: jetonFactice(secondes, utilisateur.id), utilisateur };
  localStorage.setItem(CLE_SESSION, JSON.stringify(session));
  return session;
}
