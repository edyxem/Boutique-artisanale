/** Produit artisanal mis en vente par un vendeur. */
export interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  stock: number;
  /** URL des images du produit. */
  images: string[];
  categorieId: number;
  vendeurId: number;
  actif: boolean;
}
