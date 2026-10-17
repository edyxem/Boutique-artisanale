/** Ligne d'une commande : un produit, sa quantité et son prix au moment de l'achat. */
export interface LigneCommande {
  produitId: number;
  quantite: number;
  prixUnitaire: number;
}

/** Adresse de livraison saisie au moment de la commande. */
export interface AdresseLivraison {
  nomComplet: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
}

/** Statut d'avancement d'une commande. */
export type StatutCommande = 'en_attente' | 'expediee' | 'livree' | 'annulee';

/** Commande passée par un client. */
export interface Commande {
  id: number;
  clientId: number;
  lignes: LigneCommande[];
  total: number;
  adresseLivraison: AdresseLivraison;
  statut: StatutCommande;
  /** Date de création au format ISO 8601. */
  dateCreation: string;
}
