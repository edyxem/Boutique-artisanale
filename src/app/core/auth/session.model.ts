import { Utilisateur } from '../models';

/** Utilisateur connecté : jamais de mot de passe en session. */
export type UtilisateurConnecte = Omit<Utilisateur, 'motDePasse'>;

/** Session conservée dans le navigateur. */
export interface Session {
  jeton: string;
  utilisateur: UtilisateurConnecte;
}

/** Réponse de `POST /login` et `POST /register` (json-server-auth). */
export interface ReponseAuth {
  accessToken: string;
  user: UtilisateurConnecte;
}

/** Erreurs d'authentification traduites pour l'interface. */
export type ErreurAuth = 'identifiants' | 'compte-desactive' | 'email-existant' | 'serveur';

export const MESSAGES_ERREUR_AUTH: Record<ErreurAuth, string> = {
  identifiants: 'Email ou mot de passe incorrect.',
  'compte-desactive': 'Ce compte est désactivé. Contactez l\'administrateur.',
  'email-existant': 'Un compte existe déjà avec cet email.',
  serveur: 'Le serveur ne répond pas. Réessayez plus tard.',
};
