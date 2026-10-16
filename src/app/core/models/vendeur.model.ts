/** Statut de validation d'un vendeur par l'administrateur. */
export type StatutVendeur = 'en_attente' | 'valide' | 'refuse';

/** Boutique d'un vendeur, rattachée à un utilisateur de rôle `vendeur`. */
export interface Vendeur {
  id: number;
  utilisateurId: number;
  nomBoutique: string;
  description: string;
  statut: StatutVendeur;
}
