import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { formaterPrix } from '../../shared/format';
import { donneesExemple, fausseApi } from '../../testing/fausse-api';
import { enregistrerSession } from '../auth/session.testing';
import { Produit } from '../models';
import { CommandeService } from './commande.service';
import { CLE_PANIER, PanierService } from './panier.service';
import { ProduitAffiche, ProduitService } from './produit.service';
import { VendeurService } from './vendeur.service';
import { estVisible } from './visibilite';

const produit = (champs: Partial<Produit> = {}): Produit => ({
  id: 1, nom: 'Tasses', description: '', prix: 34, stock: 5, images: [], categorieId: 1, vendeurId: 1, actif: true, ...champs,
});

describe('Services du parcours d\'achat', () => {
  it('formate les prix comme le template', () => {
    expect(formaterPrix(34).replace(/\s/g, ' ')).toBe('34 €');
    expect(formaterPrix(39.9).replace(/\s/g, ' ')).toBe('39,90 €');
  });

  describe('estVisible', () => {
    const publics = [{ id: 1 }];

    it('Produit inactif masqué', () => {
      expect(estVisible(produit({ actif: false }), publics)).toBe(false);
      expect(estVisible(produit(), publics)).toBe(true);
    });

    it('Vendeur non validé masqué (absent des vendeurs publics)', () => {
      expect(estVisible(produit({ vendeurId: 2 }), publics)).toBe(false);
    });
  });

  describe('lectures', () => {
    function api(modifier?: (d: ReturnType<typeof donneesExemple>) => void) {
      const donnees = donneesExemple();
      modifier?.(donnees);
      TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([fausseApi(donnees)])), provideHttpClientTesting()] });
    }

    it('VendeurService ne garde que les vendeurs validés dont le compte est actif (Vendeur désactivé masqué)', async () => {
      api((d) => {
        d.users.find((u) => u.id === 4)!['actif'] = false;
        d.vendeurs.push({ id: 3, utilisateurId: 3, nomBoutique: 'En attente', description: '', statut: 'en_attente' });
      });
      const vendeurs = await firstValueFrom(TestBed.inject(VendeurService).listerPublics());
      expect(vendeurs.map((v) => v.id)).toEqual([1]);
    });

    it('Données d\'exemple : 9 produits visibles avec catégorie et boutique', async () => {
      api();
      const produits = await firstValueFrom(TestBed.inject(ProduitService).listerVisibles());
      expect(produits.length).toBe(9);
      expect(produits.some((p) => p.id === 10)).toBe(false);
      expect(produits[0].categorie?.nom).toBe('Céramique');
      expect(produits[0].vendeur.nomBoutique).toBe('Atelier Grès & Sel');
    });

    it('trouverVisible renvoie null pour un produit inexistant ou masqué', async () => {
      api();
      const service = TestBed.inject(ProduitService);
      expect(await firstValueFrom(service.trouverVisible(9999))).toBeNull();
      expect(await firstValueFrom(service.trouverVisible(10))).toBeNull();
      expect((await firstValueFrom(service.trouverVisible(1)))?.nom).toBe('Tasses empilables Nuage');
    });
  });

  describe('PanierService', () => {
    const vase = { ...produit({ id: 7, nom: 'Tabouret haut Lin', prix: 165, stock: 2 }) } as ProduitAffiche;
    const tasses = { ...produit({ id: 1, nom: 'Tasses empilables Nuage', prix: 34, stock: 18 }) } as ProduitAffiche;
    const bougie = { ...produit({ id: 4, nom: 'Bougie ambre Forêt', prix: 32, stock: 24 }) } as ProduitAffiche;

    function panier(lignes?: unknown): PanierService {
      localStorage.clear();
      if (lignes) {
        localStorage.setItem(CLE_PANIER, JSON.stringify(lignes));
      }
      TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([fausseApi(donneesExemple())])), provideHttpClientTesting()] });
      return TestBed.inject(PanierService);
    }

    it('cumule les ajouts d\'un même produit sur une seule ligne', () => {
      const service = panier();
      service.ajouter(tasses);
      expect(service.ajouter(tasses, 2)).toBe('ajoute');
      expect(service.lignes()).toEqual([{ produitId: 1, quantite: 3 }]);
    });

    it('plafonne au stock et refuse un produit épuisé', () => {
      const service = panier();
      service.ajouter(vase);
      expect(service.ajouter(vase, 3)).toBe('plafonne');
      expect(service.quantiteDe(7)).toBe(2);
      expect(service.ajouter({ ...vase, id: 3, stock: 0 })).toBe('epuise');
      service.changerQuantite(7, 5);
      expect(service.quantiteDe(7)).toBe(2);
    });

    it('calcule articles, total et part des artisans ; retire une ligne', () => {
      const service = panier();
      service.ajouter(tasses, 2);
      service.ajouter(bougie);
      expect(service.nombreArticles()).toBe(3);
      expect(service.total()).toBe(100);
      expect(service.partArtisans()).toBe(72);
      service.retirer(1);
      expect(service.nombreArticles()).toBe(1);
    });

    it('Panier retrouvé après rechargement', () => {
      const service = panier([{ produitId: 1, quantite: 2 }]);
      expect(service.lignes()).toEqual([{ produitId: 1, quantite: 2 }]);
      service.ajouter(bougie);
      TestBed.tick();
      expect(JSON.parse(localStorage.getItem(CLE_PANIER)!)).toEqual([{ produitId: 1, quantite: 2 }, { produitId: 4, quantite: 1 }]);
    });

    it('Ajustement à la restauration : produit masqué retiré, quantité ramenée au stock', async () => {
      const service = panier([{ produitId: 6, quantite: 9 }, { produitId: 10, quantite: 1 }, { produitId: 1, quantite: 2 }]);
      const ajuste = await firstValueFrom(service.synchroniser());
      expect(ajuste).toBe(true);
      expect(service.lignes()).toEqual([{ produitId: 6, quantite: 7 }, { produitId: 1, quantite: 2 }]);
      expect(service.lignesAffichees()[0].produit.nom).toBe('Tabouret de comptoir en frêne');
    });
  });

  describe('CommandeService', () => {
    beforeEach(() => {
      localStorage.clear();
      enregistrerSession('client');
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    });

    it('envoie seulement produits et quantités, et traduit 409 en stock insuffisant', () => {
      const http = TestBed.inject(HttpTestingController);
      let erreur: unknown;
      TestBed.inject(CommandeService)
        .creer([{ produitId: 1, quantite: 2 }], { nomComplet: 'L', adresse: 'a', codePostal: '75011', ville: 'Paris', telephone: '0612345678' })
        .subscribe({ error: (e) => (erreur = e) });
      const requete = http.expectOne('http://localhost:3000/commandes');
      expect(requete.request.body.lignes).toEqual([{ produitId: 1, quantite: 2 }]);
      requete.flush({ indisponibles: [] }, { status: 409, statusText: 'Conflict' });
      expect(erreur).toBe('stock');
    });

    it('liste les commandes de l\'utilisateur connecté, les plus récentes d\'abord', () => {
      const http = TestBed.inject(HttpTestingController);
      TestBed.inject(CommandeService).listerMiennes().subscribe();
      const requete = http.expectOne((r) => r.url === 'http://localhost:3000/commandes');
      expect(requete.request.params.get('clientId')).toBe('2');
      expect(requete.request.params.get('_order')).toBe('desc');
      requete.flush([]);
    });
  });
});
