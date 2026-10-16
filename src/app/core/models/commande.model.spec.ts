import { Commande } from './commande.model';

describe('Modèle Commande', () => {
  it('accepte une commande conforme', () => {
    const commande: Commande = {
      id: 1,
      clientId: 2,
      lignes: [{ produitId: 1, quantite: 2, prixUnitaire: 15 }],
      total: 30,
      adresseLivraison: '12 rue des Artisans, 75011 Paris',
      statut: 'en_attente',
      dateCreation: '2026-10-16T10:00:00.000Z',
    };

    expect(commande.total).toBe(30);
  });

  it('refuse un statut inconnu', () => {
    const commande: Commande = {
      id: 1,
      clientId: 2,
      lignes: [],
      total: 0,
      adresseLivraison: '12 rue des Artisans, 75011 Paris',
      // @ts-expect-error « payee » n'est pas un StatutCommande
      statut: 'payee',
      dateCreation: '2026-10-16T10:00:00.000Z',
    };

    expect(commande.statut).toBe('payee');
  });
});
