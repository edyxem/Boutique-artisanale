import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../shared/ui';
import { Application, bouton, demarrerApplication, texte } from '../../testing/application';
import { DonneesApi, donneesExemple } from '../../testing/fausse-api';
import { MESSAGE_CATEGORIE_UTILISEE } from './categories-page';

describe('Administration', () => {
  let app: Application;
  const notifications = () => TestBed.inject(NotificationService).notifications().map((n) => n.texte);
  const lignes = (element: HTMLElement) => [...element.querySelectorAll('main ui-tableau tbody tr')];
  const ligne = (element: HTMLElement, contenu: string) => lignes(element).find((tr) => texte(tr).includes(contenu))!;

  function admin(modifier?: (d: DonneesApi) => void): Application {
    const donnees = donneesExemple();
    modifier?.(donnees);
    app = demarrerApplication({ role: 'admin', donnees });
    return app;
  }

  const demandeLucas = (d: DonneesApi) =>
    d.vendeurs.push({ id: 3, utilisateurId: 2, nomBoutique: 'Les Tissages de Lucas', description: '…', statut: 'en_attente' });

  const commande7 = (statut: string) => (d: DonneesApi) =>
    d.commandes.push({
      id: 7,
      clientId: 2,
      lignes: [{ produitId: 1, quantite: 2, prixUnitaire: 34 }],
      total: 68,
      statut,
      dateCreation: '2026-10-16T10:00:00Z',
      adresseLivraison: { nomComplet: 'Lucas Martin', adresse: '12 rue des Artisans', codePostal: '75011', ville: 'Paris', telephone: '0612345678' },
    });

  describe('navigation et aperçu', () => {
    it('Menu latéral : /admin mène à l\'aperçu, six entrées', async () => {
      const element = await admin().naviguer('/admin');
      expect(app.router.url).toBe('/admin/apercu');
      const menu = element.querySelector('nav[aria-label="Menu d\'administration"]')!;
      expect([...menu.querySelectorAll('a')].map(texte)).toEqual(['Aperçu', 'Produits', 'Commandes', 'Catégories', 'Vendeurs', 'Utilisateurs']);
      expect(texte(menu.querySelector('a[aria-current="page"]'))).toBe('Aperçu');
    });

    it('Accès refusé aux pages d\'administration (vendeur, visiteur)', async () => {
      app = demarrerApplication({ role: 'vendeur' });
      await app.naviguer('/admin/utilisateurs');
      expect(app.router.url).toBe('/acces-refuse');
      TestBed.resetTestingModule();
      app = demarrerApplication();
      await app.naviguer('/admin/utilisateurs');
      expect(app.router.url).toBe('/connexion?retour=%2Fadmin%2Futilisateurs');
    });

    it('animations : tuiles en cascade avec compteurs, lignes de tableau qui entrent (sous motion-safe)', async () => {
      let element = await admin().naviguer('/admin/apercu');
      const tuiles = [...element.querySelectorAll<HTMLElement>('main ui-tuile-stat')];
      expect(tuiles.map((t) => t.style.transitionDelay)).toEqual(['0ms', '60ms', '120ms', '180ms']);
      expect(tuiles.every((t) => t.querySelector('[uicompteur]'))).toBe(true);
      element = await app.naviguer('/admin/produits');
      expect(element.querySelector('main tbody tr')!.className).toContain('motion-safe:animate-entree');
    });

    it('Tuiles du jeu d\'exemple, puis lien vers les demandes en attente', async () => {
      const element = await admin((d) => {
        demandeLucas(d);
        commande7('en_attente')(d);
      }).naviguer('/admin/apercu');
      const valeurs = [...element.querySelectorAll('main ui-tuile-stat [uicompteur]')].map((e) => e.getAttribute('aria-label'));
      expect(valeurs).toEqual(['9', '1', '1', '4']);
      const tuile = [...element.querySelectorAll<HTMLAnchorElement>('main ui-tuile-stat a')][2];
      expect(tuile.getAttribute('href')).toBe('/admin/vendeurs?statut=en_attente');
    });
  });

  describe('catégories', () => {
    it('Création avec slug proposé', async () => {
      const element = await admin().naviguer('/admin/categories/nouvelle');
      const modale = element.querySelector('main ui-modale')!;
      const nom = modale.querySelector<HTMLInputElement>('input[formcontrolname="nom"]')!;
      nom.value = 'Vannerie & Osier';
      nom.dispatchEvent(new Event('input'));
      await app.stabiliser();
      expect(modale.querySelector<HTMLInputElement>('input[formcontrolname="slug"]')!.value).toBe('vannerie-osier');
      modale.querySelector('form')!.dispatchEvent(new Event('submit'));
      const requete = app.http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/categories'));
      expect(requete.request.body).toEqual({ nom: 'Vannerie & Osier', slug: 'vannerie-osier' });
      requete.flush({ id: 5, nom: 'Vannerie & Osier', slug: 'vannerie-osier' });
      await app.stabiliser();
      expect(app.router.url).toBe('/admin/categories');
      expect(notifications()).toContain('La catégorie Vannerie & Osier a été créée.');
    });

    it('Slug déjà utilisé', async () => {
      const element = await admin().naviguer('/admin/categories/nouvelle');
      const modale = element.querySelector('main ui-modale')!;
      for (const [champ, valeur] of [['nom', 'Bois'], ['slug', 'mobilier']]) {
        const saisie = modale.querySelector<HTMLInputElement>(`input[formcontrolname="${champ}"]`)!;
        saisie.value = valeur;
        saisie.dispatchEvent(new Event('input'));
        saisie.dispatchEvent(new Event('blur'));
      }
      modale.querySelector('form')!.dispatchEvent(new Event('submit'));
      await app.stabiliser();
      expect(texte(modale)).toContain('Ce slug est déjà utilisé.');
      app.http.expectNone((r) => r.method === 'POST');
    });

    it('Suppression d\'une catégorie vide, puis d\'une catégorie utilisée', async () => {
      const element = await admin((d) => d.categories.push({ id: 5, nom: 'Vannerie & Osier', slug: 'vannerie-osier' })).naviguer('/admin/categories');
      const vide = bouton(element, 'Supprimer Vannerie & Osier')!;
      vide.click();
      vide.click();
      app.http.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/categories/5')).flush({});
      await app.stabiliser();
      expect(notifications()).toContain('La catégorie Vannerie & Osier a été supprimée.');
      const utilisee = bouton(element, 'Supprimer Mobilier')!;
      utilisee.click();
      utilisee.click();
      app.http.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/categories/2')).flush('', { status: 409, statusText: 'Conflict' });
      await app.stabiliser();
      expect(notifications()).toContain(MESSAGE_CATEGORIE_UTILISEE);
    });
  });

  describe('produits', () => {
    it('Liste de tous les produits, avec leur boutique', async () => {
      const element = await admin().naviguer('/admin/produits');
      expect(lignes(element).length).toBe(10);
      expect(texte(ligne(element, 'Bols en bois tourné'))).toContain('Menuiserie Lebrun');
      expect(texte(ligne(element, 'Bols en bois tourné'))).toContain('Inactif');
    });

    it('Modification du produit d\'un vendeur (champ Boutique)', async () => {
      const element = await admin().naviguer('/admin/produits/10');
      const modale = element.querySelector('main ui-modale')!;
      expect(modale.querySelector('select[formcontrolname="vendeurId"]')).not.toBeNull();
      modale.querySelector<HTMLInputElement>('input[formcontrolname="actif"]')!.click();
      modale.querySelector('form')!.dispatchEvent(new Event('submit'));
      const requete = app.http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/produits/10'));
      expect(requete.request.body.actif).toBe(true);
      expect(requete.request.body.vendeurId).toBe(2);
      requete.flush({ ...requete.request.body, id: 10 });
      await app.stabiliser();
      expect(notifications()).toContain('Le produit Bols en bois tourné a été modifié.');
    });

    it('Suppression par l\'administrateur', async () => {
      const element = await admin().naviguer('/admin/produits');
      const supprimer = bouton(element, 'Supprimer Bougies parfumées')!;
      supprimer.click();
      supprimer.click();
      app.http.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/produits/5')).flush({});
      await app.stabiliser();
      expect(notifications()).toContain('Le produit Bougies parfumées a été supprimé.');
    });
  });

  describe('vendeurs', () => {
    it('Filtrer les demandes en attente (filtre dans l\'URL)', async () => {
      const element = await admin(demandeLucas).naviguer('/admin/vendeurs?statut=en_attente');
      expect(lignes(element).map(texte).length).toBe(1);
      expect(texte(lignes(element)[0])).toContain('Les Tissages de Lucas');
      expect(bouton(element, 'En attente')!.getAttribute('aria-pressed')).toBe('true');
    });

    it('Valider une demande', async () => {
      const element = await admin(demandeLucas).naviguer('/admin/vendeurs');
      bouton(element, 'Valider Les Tissages de Lucas')!.click();
      const requete = app.http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/vendeurs/3'));
      expect(requete.request.body).toEqual({ statut: 'valide' });
      requete.flush({ id: 3, statut: 'valide' });
      await app.stabiliser();
      expect(notifications()).toContain('La boutique Les Tissages de Lucas a été validée.');
    });

    it('Refuser une demande après confirmation', async () => {
      const element = await admin(demandeLucas).naviguer('/admin/vendeurs');
      bouton(element, 'Refuser Les Tissages de Lucas')!.click();
      await app.stabiliser();
      const modale = element.querySelector('main ui-modale dialog')!;
      expect(texte(modale)).toContain('Voulez-vous vraiment refuser la demande de Les Tissages de Lucas ?');
      bouton(modale, 'Confirmer')!.click();
      const requete = app.http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/vendeurs/3'));
      expect(requete.request.body).toEqual({ statut: 'refuse' });
      requete.flush({ id: 3, statut: 'refuse' });
      await app.stabiliser();
      expect(notifications()).toContain('La demande de Les Tissages de Lucas a été refusée.');
    });

    it('Désactiver puis réactiver un vendeur (compte du titulaire)', async () => {
      const element = await admin().naviguer('/admin/vendeurs');
      bouton(element, 'Désactiver Menuiserie Lebrun')!.click();
      await app.stabiliser();
      bouton(element.querySelector('main ui-modale')!, 'Confirmer')!.click();
      const requete = app.http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/users/4'));
      expect(requete.request.body).toEqual({ actif: false });
      app.donnees.users.find((u) => u.id === 4)!['actif'] = false;
      requete.flush({ id: 4, actif: false });
      await app.stabiliser();
      expect(notifications()).toContain('La boutique Menuiserie Lebrun a été désactivée.');

      bouton(element, 'Réactiver Menuiserie Lebrun')!.click();
      const reactivation = app.http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/users/4'));
      expect(reactivation.request.body).toEqual({ actif: true });
      reactivation.flush({ id: 4, actif: true });
      await app.stabiliser();
      expect(notifications()).toContain('La boutique Menuiserie Lebrun a été réactivée.');
    });
  });

  describe('utilisateurs', () => {
    it('Promouvoir un client administrateur', async () => {
      const element = await admin().naviguer('/admin/utilisateurs');
      const select = element.querySelector<HTMLSelectElement>('main select[aria-label="Rôle de Lucas Martin"]')!;
      select.value = 'admin';
      select.dispatchEvent(new Event('change'));
      await app.stabiliser();
      bouton(element.querySelector('main ui-modale')!, 'Confirmer')!.click();
      const requete = app.http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/users/2'));
      expect(requete.request.body).toEqual({ role: 'admin' });
      requete.flush({ id: 2, role: 'admin' });
      await app.stabiliser();
      expect(notifications()).toContain('Le rôle de Lucas Martin a été modifié.');
    });

    it('Désactiver un client', async () => {
      const element = await admin().naviguer('/admin/utilisateurs');
      bouton(element, 'Désactiver Lucas Martin')!.click();
      await app.stabiliser();
      bouton(element.querySelector('main ui-modale')!, 'Confirmer')!.click();
      const requete = app.http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/users/2'));
      expect(requete.request.body).toEqual({ actif: false });
      requete.flush({ id: 2, actif: false });
      await app.stabiliser();
      expect(notifications()).toContain('Le compte de Lucas Martin a été désactivé.');
    });

    it('Protection de son propre compte', async () => {
      const element = await admin().naviguer('/admin/utilisateurs');
      expect(element.querySelector<HTMLSelectElement>('main select[aria-label="Rôle de Mariam Diallo"]')!.disabled).toBe(true);
      expect(bouton(element, 'Désactiver Mariam Diallo')!.disabled).toBe(true);
    });

    it('Rôle d\'un titulaire de boutique : badge sans choix', async () => {
      const element = await admin().naviguer('/admin/utilisateurs');
      const claire = ligne(element, 'Claire Fontaine');
      expect(claire.querySelector('select')).toBeNull();
      expect(texte(claire.querySelector('ui-badge-role'))).toBe('Vendeur');
    });
  });

  describe('commandes', () => {
    it('Filtrer les commandes en attente, la plus récente en premier', async () => {
      const element = await admin((d) => {
        commande7('en_attente')(d);
        d.commandes.push(
          { id: 8, clientId: 2, lignes: [], total: 10, statut: 'en_attente', dateCreation: '2026-10-17T10:00:00Z' },
          { id: 9, clientId: 2, lignes: [], total: 10, statut: 'livree', dateCreation: '2026-10-15T10:00:00Z' },
        );
      }).naviguer('/admin/commandes?statut=en_attente');
      expect(lignes(element).map((tr) => texte(tr.querySelector('td')))).toEqual(['8', '7']);
    });

    it('Consultation du détail', async () => {
      const element = await admin(commande7('en_attente')).naviguer('/admin/commandes/7');
      const main = texte(element.querySelector('main'));
      expect(main).toContain('Lucas Martin');
      expect(main).toContain('client@boutique.fr');
      expect(main).toContain('12 rue des Artisans');
      expect(main).toContain('Tasses empilables Nuage × 2 — 68 €');
      expect(main).toContain('En attente');
    });

    it('Expédier une commande', async () => {
      const element = await admin(commande7('en_attente')).naviguer('/admin/commandes/7');
      bouton(element, 'Marquer comme expédiée')!.click();
      const requete = app.http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/commandes/7'));
      expect(requete.request.body).toEqual({ statut: 'expediee' });
      requete.flush({ id: 7, statut: 'expediee' });
      await app.stabiliser();
      expect(notifications()).toContain('La commande n° 7 est maintenant Expédiée.');
    });

    it('Annulation d\'une commande expédiée, après confirmation', async () => {
      const element = await admin(commande7('expediee')).naviguer('/admin/commandes/7');
      expect(bouton(element, 'Marquer comme livrée')).toBeDefined();
      bouton(element.querySelector('main')!, 'Annuler la commande')!.click();
      await app.stabiliser();
      bouton(element.querySelector('main ui-modale')!, 'Oui, annuler')!.click();
      const requete = app.http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/commandes/7'));
      expect(requete.request.body).toEqual({ statut: 'annulee' });
      requete.flush({ id: 7, statut: 'annulee' });
      await app.stabiliser();
      expect(notifications()).toContain('La commande n° 7 est maintenant Annulée.');
    });

    it('Commande livrée définitive : aucune action proposée', async () => {
      const element = await admin(commande7('livree')).naviguer('/admin/commandes/7');
      expect(element.querySelector('main [aria-label="Changer le statut"]')).toBeNull();
    });

    it('Commande introuvable', async () => {
      const element = await admin().naviguer('/admin/commandes/999');
      expect(texte(element.querySelector('main h1'))).toBe('Commande introuvable');
    });
  });
});
