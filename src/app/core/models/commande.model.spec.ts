import { AdresseLivraison, Commande } from './commande.model';

const adresse: AdresseLivraison = {
  nomComplet: 'Lucas Martin',
  adresse: '12 rue des Artisans',
  codePostal: '75011',
  ville: 'Paris',
  telephone: '06 12 34 56 78',
};

describe('Modèle Commande', () => {
  it('accepte une commande conforme (Commande conforme acceptée par le typage)', () => {
    const commande: Commande = {
      id: 1,
      clientId: 2,
      lignes: [{ produitId: 1, quantite: 2, prixUnitaire: 15 }],
      total: 30,
      adresseLivraison: adresse,
      statut: 'en_attente',
      dateCreation: '2026-10-16T10:00:00.000Z',
    };

    expect(commande.total).toBe(30);
  });

  it('refuse un statut inconnu (Statut inconnu refusé par le typage)', () => {
    const commande: Commande = {
      id: 1,
      clientId: 2,
      lignes: [],
      total: 0,
      adresseLivraison: adresse,
      // @ts-expect-error « payee » n'est pas un StatutCommande
      statut: 'payee',
      dateCreation: '2026-10-16T10:00:00.000Z',
    };

    expect(commande.statut).toBe('payee');
  });
});
