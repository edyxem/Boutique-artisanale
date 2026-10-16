/** Rôle d'un utilisateur sur la boutique. */
export type Role = 'client' | 'vendeur' | 'admin';

/**
 * Utilisateur de la boutique.
 * Dans l'API simulée, le mot de passe est stocké (haché) dans le champ `password`
 * imposé par json-server-auth ; la correspondance sera faite par le service d'authentification.
 */
export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  motDePasse: string;
  role: Role;
  actif: boolean;
}
