/** Produit artisanal mis en vente par un vendeur. */
export interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  stock: number;
  /** Chemins des photos du produit dans la bibliothèque du site (`/images/…`). */
  images: string[];
  categorieId: number;
  vendeurId: number;
  actif: boolean;
}
