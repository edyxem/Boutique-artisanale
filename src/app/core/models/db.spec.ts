import db from '../../../../db.json';

const { users, vendeurs, categories, produits, commandes } = db;

const ROLES = ['client', 'vendeur', 'admin'];
const STATUTS_VENDEUR = ['en_attente', 'valide', 'refuse'];
const MOTS_DE_PASSE_DEMO = ['Admin123!', 'Client123!', 'Vendeur123!'];
const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMAT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FORMAT_BCRYPT = /^\$2[ab]\$\d{2}\$.{53}$/;

describe('Données d\'exemple (db.json)', () => {
  describe('api-simulee', () => {
    it('contient les volumes attendus', () => {
      expect(produits.length).toBe(10);
      expect(categories.length).toBe(4);
      expect(vendeurs.length).toBe(2);
      expect(users.length).toBe(4);
      expect(commandes.length).toBe(0);
    });

    it('répartit les utilisateurs par rôle', () => {
      const compter = (role: string) => users.filter((u) => u.role === role).length;
      expect(compter('admin')).toBe(1);
      expect(compter('client')).toBe(1);
      expect(compter('vendeur')).toBe(2);
    });

    it('donne au moins un produit à chaque catégorie et à chaque vendeur', () => {
      for (const categorie of categories) {
        expect(produits.some((p) => p.categorieId === categorie.id)).toBe(true);
      }
      for (const vendeur of vendeurs) {
        expect(produits.some((p) => p.vendeurId === vendeur.id)).toBe(true);
      }
    });

    it('ne stocke aucun mot de passe en clair', () => {
      for (const user of users) {
        expect(user.password).toMatch(FORMAT_BCRYPT);
        expect(MOTS_DE_PASSE_DEMO).not.toContain(user.password);
      }
    });
  });

  describe('modeles-donnees', () => {
    it('respecte le modèle Utilisateur', () => {
      for (const user of users) {
        expect(typeof user.id).toBe('number');
        expect(user.nom.trim()).not.toBe('');
        expect(user.email).toMatch(FORMAT_EMAIL);
        expect(user.password).toMatch(FORMAT_BCRYPT);
        expect(ROLES).toContain(user.role);
        expect(typeof user.actif).toBe('boolean');
      }
    });

    it('a des emails uniques', () => {
      const emails = users.map((u) => u.email);
      expect(new Set(emails).size).toBe(emails.length);
    });

    it('rattache chaque vendeur à un compte vendeur distinct', () => {
      for (const vendeur of vendeurs) {
        const user = users.find((u) => u.id === vendeur.utilisateurId);
        expect(user?.role).toBe('vendeur');
      }
      const utilisateurIds = vendeurs.map((v) => v.utilisateurId);
      expect(new Set(utilisateurIds).size).toBe(utilisateurIds.length);
    });

    it('utilise des statuts de vendeur valides, dont au moins un « valide »', () => {
      for (const vendeur of vendeurs) {
        expect(STATUTS_VENDEUR).toContain(vendeur.statut);
      }
      expect(vendeurs.some((v) => v.statut === 'valide')).toBe(true);
    });

    it('a des slugs de catégorie valides et uniques', () => {
      for (const categorie of categories) {
        expect(categorie.slug).toMatch(FORMAT_SLUG);
      }
      const slugs = categories.map((c) => c.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('respecte le modèle Produit', () => {
      for (const produit of produits) {
        expect(produit.nom.trim()).not.toBe('');
        expect(produit.prix).toBeGreaterThan(0);
        expect(Number.isInteger(produit.stock)).toBe(true);
        expect(produit.stock).toBeGreaterThanOrEqual(0);
        expect(produit.images.length).toBeGreaterThan(0);
        expect(typeof produit.actif).toBe('boolean');
      }
    });

    it('référence des catégories et des vendeurs existants', () => {
      for (const produit of produits) {
        expect(categories.some((c) => c.id === produit.categorieId)).toBe(true);
        expect(vendeurs.some((v) => v.id === produit.vendeurId)).toBe(true);
      }
    });
  });
});
