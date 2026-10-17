import { Produit, Vendeur } from '../models';

/**
 * Règle de visibilité du catalogue : un produit est en vente s'il est actif et si son vendeur
 * fait partie des vendeurs publics (statut `valide` et compte utilisateur actif).
 */
export function estVisible(produit: Produit, vendeursPublics: readonly Pick<Vendeur, 'id'>[]): boolean {
  return produit.actif && vendeursPublics.some((vendeur) => vendeur.id === produit.vendeurId);
}
