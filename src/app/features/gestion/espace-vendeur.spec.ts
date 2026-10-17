import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { messageErreur } from '../../core/services/erreurs-api';
import { transitionsPermises } from '../../core/services/transitions';
import { slugifier } from '../../shared/format-slug';
import { NotificationService } from '../../shared/ui';
import { Application, bouton, demarrerApplication, texte } from '../../testing/application';
import { donneesExemple } from '../../testing/fausse-api';
import { MESSAGE_DEMANDE_ENVOYEE } from '../devenir-vendeur/devenir-artisan-page';
import { MESSAGE_PRODUIT_COMMANDE } from './liste-produits-page';

describe('Espace vendeur', () => {
  let app: Application;
  const notifications = () => TestBed.inject(NotificationService).notifications().map((n) => n.texte);
  const lignes = (element: HTMLElement) => [...element.querySelectorAll('main ui-tableau tbody tr')];
  const colonne = (element: HTMLElement, index: number) => lignes(element).map((tr) => texte(tr.querySelectorAll('td')[index]));

  function saisir(element: ParentNode, selecteur: string, valeur: string): void {
    const champ = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(selecteur)!;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    champ.dispatchEvent(new Event('blur'));
  }

  describe('utilitaires', () => {
    it('slugifier : « Vannerie & Osier » → « vannerie-osier »', () => {
      expect(slugifier('Vannerie & Osier')).toBe('vannerie-osier');
      expect(slugifier('  Céramique  ')).toBe('ceramique');
    });

    it('transitionsPermises suit la même table que le serveur', () => {
      expect(transitionsPermises('en_attente')).toEqual(['expediee', 'annulee']);
      expect(transitionsPermises('expediee')).toEqual(['livree', 'annulee']);
      expect(transitionsPermises('livree')).toEqual([]);
      expect(transitionsPermises('annulee')).toEqual([]);
    });

    it('messageErreur traduit 403, 409 et l\'absence de serveur', () => {
      const erreur = (status: number) => new HttpErrorResponse({ status });
      expect(messageErreur(erreur(409), { 409: 'Conflit' })).toBe('Conflit');
      expect(messageErreur(erreur(403), { 403: 'Interdit' })).toBe('Interdit');
      expect(messageErreur(erreur(0))).toBe('Le serveur ne répond pas. Réessayez plus tard.');
      expect(messageErreur(erreur(500))).toBe('L\'enregistrement a échoué. Réessayez.');
    });
  });

  describe('Devenir artisan', () => {
    it('Demande envoyée : vendeur en attente, rôle client conservé, toast', async () => {
      app = demarrerApplication({ role: 'client' });
      const element = await app.naviguer('/devenir-vendeur');
      saisir(element, 'main input[formcontrolname="nomBoutique"]', 'Les Tissages de Lucas');
      saisir(element, 'main textarea[formcontrolname="description"]', 'Tissages faits main en lin et en laine.');
      element.querySelector('main form')!.dispatchEvent(new Event('submit'));
      const requete = app.http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/vendeurs'));
      expect(requete.request.body).toEqual({ nomBoutique: 'Les Tissages de Lucas', description: 'Tissages faits main en lin et en laine.' });
      requete.flush({ id: 3, utilisateurId: 2, nomBoutique: 'Les Tissages de Lucas', description: '…', statut: 'en_attente' });
      await app.stabiliser();
      expect(notifications()).toContain(MESSAGE_DEMANDE_ENVOYEE);
      expect(texte(element.querySelector('main'))).toContain('Votre demande pour Les Tissages de Lucas est en cours d\'examen.');
      expect(element.querySelector('header')!.textContent).toContain('Lucas');
    });

    it('Nom de boutique déjà pris', async () => {
      app = demarrerApplication({ role: 'client' });
      const element = await app.naviguer('/devenir-vendeur');
      saisir(element, 'main input[formcontrolname="nomBoutique"]', 'atelier grès & sel');
      saisir(element, 'main textarea[formcontrolname="description"]', 'Une description suffisamment longue.');
      element.querySelector('main form')!.dispatchEvent(new Event('submit'));
      app.http.expectOne((r) => r.method === 'POST').flush('Nom de boutique déjà utilisé', { status: 409, statusText: 'Conflict' });
      await app.stabiliser();
      expect(texte(element.querySelector('main [role="alert"]'))).toBe('Ce nom de boutique est déjà utilisé.');
    });

    it('Champs invalides', async () => {
      app = demarrerApplication({ role: 'client' });
      const element = await app.naviguer('/devenir-vendeur');
      saisir(element, 'main input[formcontrolname="nomBoutique"]', 'AB');
      saisir(element, 'main textarea[formcontrolname="description"]', 'Trop court');
      element.querySelector('main form')!.dispatchEvent(new Event('submit'));
      await app.stabiliser();
      const formulaire = texte(element.querySelector('main form'));
      expect(formulaire).toContain('Le nom doit contenir entre 3 et 60 caractères.');
      expect(formulaire).toContain('La description doit contenir entre 20 et 500 caractères.');
      app.http.expectNone((r) => r.method === 'POST');
    });

    it('Demande en attente : état affiché, pas de formulaire', async () => {
      const donnees = donneesExemple();
      donnees.vendeurs.push({ id: 3, utilisateurId: 2, nomBoutique: 'Les Tissages de Lucas', description: '…', statut: 'en_attente' });
      app = demarrerApplication({ role: 'client', donnees });
      const element = await app.naviguer('/devenir-vendeur');
      expect(texte(element.querySelector('main'))).toContain('Votre demande pour Les Tissages de Lucas est en cours d\'examen.');
      expect(element.querySelector('main form')).toBeNull();
    });

    it('Accès refusé à la demande (visiteur, vendeur, administrateur)', async () => {
      app = demarrerApplication();
      await app.naviguer('/devenir-vendeur');
      expect(app.router.url).toBe('/connexion?retour=%2Fdevenir-vendeur');
      for (const role of ['vendeur', 'admin'] as const) {
        TestBed.resetTestingModule();
        app = demarrerApplication({ role });
        await app.naviguer('/devenir-vendeur');
        expect(app.router.url).toBe('/acces-refuse');
      }
    });

    it('Liens selon le rôle', async () => {
      app = demarrerApplication({ role: 'client' });
      let element = await app.naviguer('/compte');
      expect(bouton(element.querySelector('main')!, 'Devenir artisan')!.getAttribute('href')).toBe('/devenir-vendeur');
      expect(bouton(element.querySelector('footer')!, 'Devenir artisan')!.getAttribute('href')).toBe('/devenir-vendeur');
      TestBed.resetTestingModule();
      app = demarrerApplication({ role: 'vendeur' });
      element = await app.naviguer('/compte');
      expect(bouton(element.querySelector('main')!, 'Devenir artisan')).toBeUndefined();
      expect(bouton(element.querySelector('footer')!, 'Devenir artisan')!.getAttribute('href')).toBe('/devenir-vendeur');
    });
  });

  describe('Mes produits', () => {
    it('Seulement ses produits, menu de l\'espace vendeur', async () => {
      app = demarrerApplication({ role: 'vendeur' });
      const element = await app.naviguer('/vendeur');
      expect(app.router.url).toBe('/vendeur/produits');
      expect(colonne(element, 1)).toEqual(['Tasses empilables Nuage', 'Set de bols Sable', 'Mugs mouchetés', 'Bougie ambre Forêt', 'Bougies parfumées']);
      const menu = element.querySelector('nav[aria-label="Menu de l\'espace vendeur"]')!;
      expect([...menu.querySelectorAll('a')].map(texte)).toEqual(['Mes produits', 'Mes ventes']);
      expect(menu.querySelector('a[aria-current="page"]')!.textContent).toContain('Mes produits');
    });

    it('Recherche et tri', async () => {
      app = demarrerApplication({ role: 'vendeur' });
      const element = await app.naviguer('/vendeur/produits');
      saisir(element, 'main input[type=search]', 'mugs');
      await app.stabiliser();
      expect(colonne(element, 1)).toEqual(['Mugs mouchetés']);
      saisir(element, 'main input[type=search]', '');
      const prix = [...element.querySelectorAll('main th')].find((th) => texte(th).startsWith('Prix'))!;
      prix.querySelector('button')!.click();
      prix.querySelector('button')!.click();
      await app.stabiliser();
      expect(colonne(element, 1)[0]).toBe('Set de bols Sable');
    });

    it('Accès refusé à la liste pour un client', async () => {
      app = demarrerApplication({ role: 'client' });
      await app.naviguer('/vendeur/produits');
      expect(app.router.url).toBe('/acces-refuse');
    });

    it('Création d\'un produit avec une photo de la bibliothèque (aperçu immédiat)', async () => {
      app = demarrerApplication({ role: 'vendeur' });
      const element = await app.naviguer('/vendeur/produits/nouveau');
      const modale = element.querySelector('main ui-modale dialog')!;
      expect(modale.hasAttribute('open')).toBe(true);
      saisir(modale, 'input[formcontrolname="nom"]', 'Chaise Fil');
      saisir(modale, 'textarea[formcontrolname="description"]', 'Assise en rotin naturel et piètement en acier.');
      saisir(modale, 'input[formcontrolname="prix"]', '260');
      saisir(modale, 'input[formcontrolname="stock"]', '6');
      const categorie = modale.querySelector<HTMLSelectElement>('select[formcontrolname="categorieId"]')!;
      categorie.selectedIndex = 2;
      categorie.dispatchEvent(new Event('change'));
      const photo = [...modale.querySelectorAll('fieldset label')].find((l) => l.querySelector('img')!.getAttribute('src')!.includes('produit-chaise-fil'))!;
      photo.querySelector<HTMLInputElement>('input[type=radio]')!.click();
      await app.stabiliser();
      expect(modale.querySelector('img[alt="Aperçu de la photo choisie"]')!.getAttribute('src')).toContain('produit-chaise-fil');
      modale.querySelector('form')!.dispatchEvent(new Event('submit'));
      const requete = app.http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/produits'));
      expect(requete.request.body).toEqual(expect.objectContaining({ nom: 'Chaise Fil', prix: 260, stock: 6, categorieId: 2, vendeurId: 1, images: ['/images/produit-chaise-fil.jpg'], actif: true }));
      requete.flush({ ...requete.request.body, id: 11 });
      await app.stabiliser();
      expect(app.router.url).toBe('/vendeur/produits');
      expect(notifications()).toContain('Le produit Chaise Fil a été créé.');
    });

    it('Modification pré-remplie', async () => {
      app = demarrerApplication({ role: 'vendeur' });
      const element = await app.naviguer('/vendeur/produits/1');
      const modale = element.querySelector('main ui-modale dialog')!;
      expect(modale.querySelector<HTMLInputElement>('input[formcontrolname="nom"]')!.value).toBe('Tasses empilables Nuage');
      saisir(modale, 'input[formcontrolname="stock"]', '15');
      modale.querySelector('form')!.dispatchEvent(new Event('submit'));
      const requete = app.http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/produits/1'));
      expect(requete.request.body.stock).toBe(15);
      requete.flush({ ...requete.request.body, id: 1 });
      await app.stabiliser();
      expect(notifications()).toContain('Le produit Tasses empilables Nuage a été modifié.');
    });

    it('Erreur d\'enregistrement : la modale reste ouverte avec ses valeurs', async () => {
      app = demarrerApplication({ role: 'vendeur' });
      const element = await app.naviguer('/vendeur/produits/1');
      element.querySelector('main ui-modale form')!.dispatchEvent(new Event('submit'));
      app.http.expectOne((r) => r.method === 'PATCH').flush('', { status: 500, statusText: 'Erreur' });
      await app.stabiliser();
      expect(app.router.url).toBe('/vendeur/produits/1');
      expect(element.querySelector<HTMLInputElement>('main ui-modale input[formcontrolname="nom"]')!.value).toBe('Tasses empilables Nuage');
      expect(notifications()).toContain('L\'enregistrement a échoué. Réessayez.');
    });

    it('Valeurs invalides : rien n\'est enregistré', async () => {
      app = demarrerApplication({ role: 'vendeur' });
      const element = await app.naviguer('/vendeur/produits/nouveau');
      const modale = element.querySelector('main ui-modale')!;
      saisir(modale, 'input[formcontrolname="prix"]', '-3');
      saisir(modale, 'input[formcontrolname="stock"]', '2.5');
      modale.querySelector('form')!.dispatchEvent(new Event('submit'));
      await app.stabiliser();
      const texteModale = texte(modale);
      expect(texteModale).toContain('Le prix doit être supérieur à 0.');
      expect(texteModale).toContain('Le stock doit être un nombre entier positif.');
      expect(texteModale).toContain('Choisissez au moins une photo.');
      app.http.expectNone((r) => r.method === 'POST');
    });

    it('Ouverture du produit d\'un autre vendeur : « Produit introuvable »', async () => {
      app = demarrerApplication({ role: 'vendeur' });
      const element = await app.naviguer('/vendeur/produits/6');
      expect(texte(element.querySelector('main ui-modale'))).toContain('Produit introuvable');
      expect(element.querySelector('main ui-modale form')).toBeNull();
    });

    it('Suppression confirmée en deux clics, puis abandonnée', async () => {
      app = demarrerApplication({ role: 'vendeur' });
      const element = await app.naviguer('/vendeur/produits');
      const supprimer = bouton(element, 'Supprimer Bougies parfumées')!;
      supprimer.click();
      await app.stabiliser();
      expect(supprimer.getAttribute('aria-label')).toBe('Confirmer la suppression de Bougies parfumées');
      supprimer.click();
      app.http.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/produits/5')).flush({});
      await app.stabiliser();
      expect(notifications()).toContain('Le produit Bougies parfumées a été supprimé.');

      vi.useFakeTimers();
      const autre = bouton(element, 'Supprimer Mugs mouchetés')!;
      autre.click();
      vi.advanceTimersByTime(3000);
      vi.useRealTimers();
      app.http.expectNone((r) => r.method === 'DELETE' && r.url.endsWith('/produits/3'));
    });

    it('Suppression d\'un produit commandé refusée', async () => {
      app = demarrerApplication({ role: 'vendeur' });
      const element = await app.naviguer('/vendeur/produits');
      const supprimer = bouton(element, 'Supprimer Tasses empilables Nuage')!;
      supprimer.click();
      supprimer.click();
      app.http.expectOne((r) => r.method === 'DELETE').flush('', { status: 409, statusText: 'Conflict' });
      await app.stabiliser();
      expect(notifications()).toContain(MESSAGE_PRODUIT_COMMANDE);
    });
  });

  describe('Mes ventes', () => {
    function avecVentes(): Promise<HTMLElement> {
      const donnees = donneesExemple();
      donnees.commandes.push(
        { id: 7, clientId: 2, lignes: [{ produitId: 1, quantite: 2, prixUnitaire: 34 }, { produitId: 6, quantite: 1, prixUnitaire: 140 }], total: 208, statut: 'livree', dateCreation: '2026-10-16T10:00:00Z' },
        { id: 8, clientId: 2, lignes: [{ produitId: 4, quantite: 1, prixUnitaire: 32 }], total: 32, statut: 'annulee', dateCreation: '2026-10-17T10:00:00Z' },
      );
      app = demarrerApplication({ role: 'vendeur', donnees });
      return app.naviguer('/vendeur/ventes');
    }

    it('Ventes d\'une commande partagée : seulement ses lignes', async () => {
      const element = await avecVentes();
      const produits = colonne(element, 2);
      expect(produits).toContain('Tasses empilables Nuage');
      expect(produits).not.toContain('Tabouret de comptoir en frêne');
      const tasses = lignes(element).find((tr) => texte(tr).includes('Tasses empilables Nuage'))!;
      expect(texte(tasses)).toContain('68 €');
    });

    it('Total hors annulations', async () => {
      const element = await avecVentes();
      expect(element.querySelector('main ui-tuile-stat [uicompteur]')!.getAttribute('aria-label')?.replace(/\s/g, ' ')).toBe('68 €');
    });

    it('Aucune vente', async () => {
      app = demarrerApplication({ role: 'vendeur' });
      const element = await app.naviguer('/vendeur/ventes');
      expect(texte(element.querySelector('main'))).toContain('Aucune vente pour le moment.');
    });
  });
});
