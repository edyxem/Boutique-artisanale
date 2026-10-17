import { TestBed } from '@angular/core/testing';
import { jetonFactice, UTILISATEURS } from '../../core/auth/session.testing';
import { CLE_PANIER, PanierService } from '../../core/services/panier.service';
import { PreferencesMouvement } from '../../shared/animations/mouvement-reduit';
import { AjoutPanier } from '../../shared/produits/ajout-panier';
import { NotificationService } from '../../shared/ui';
import { Application, bouton, demarrerApplication, texte } from '../../testing/application';
import { MESSAGE_INDISPONIBLE } from './commande-page';

describe('Panier, commande et Mes commandes', () => {
  let app: Application;

  const lignesTiroir = () => [...document.querySelectorAll('app-tiroir-panier li')];
  const panier = () => TestBed.inject(PanierService);
  const notifications = () => TestBed.inject(NotificationService).notifications().map((n) => n.texte);

  async function ouvrirTiroir(): Promise<HTMLElement> {
    app.element.querySelector<HTMLButtonElement>('header button[data-cible-panier]')!.click();
    return app.stabiliser();
  }

  async function ajouterDepuisCarte(nom: string): Promise<void> {
    bouton(app.element, `Ajouter ${nom} au panier`)!.click();
    await app.stabiliser();
  }

  describe('panier', () => {
    it('Ajout depuis une carte : une ligne et le toast du template', async () => {
      app = demarrerApplication();
      await app.naviguer('/catalogue');
      await ajouterDepuisCarte('Tasses empilables Nuage');
      expect(panier().lignes()).toEqual([{ produitId: 1, quantite: 1 }]);
      expect(notifications()).toContain('Tasses empilables Nuage ajouté au panier');
    });

    it('Ajout d\'un produit déjà présent depuis la fiche', async () => {
      app = demarrerApplication({ panier: [{ produitId: 1, quantite: 1 }] });
      const element = await app.naviguer('/catalogue/1');
      bouton(element, 'Augmenter la quantité')!.click();
      await app.stabiliser();
      bouton(element, 'Ajouter au panier')!.click();
      await app.stabiliser();
      expect(panier().lignes()).toEqual([{ produitId: 1, quantite: 3 }]);
    });

    it('Ajout au-delà du stock : plafonné et message', async () => {
      app = demarrerApplication({ panier: [{ produitId: 7, quantite: 1 }] });
      const element = await app.naviguer('/catalogue/7');
      bouton(element, 'Augmenter la quantité')!.click();
      await app.stabiliser();
      bouton(element, 'Ajouter au panier')!.click();
      await app.stabiliser();
      expect(panier().quantiteDe(7)).toBe(2);
      expect(notifications()).toContain('Stock insuffisant : 2 exemplaires disponibles.');
    });

    it('Tiroir d\'un visiteur : lignes, total, part des artisans, « Se connecter pour commander »', async () => {
      app = demarrerApplication({ panier: [{ produitId: 1, quantite: 2 }, { produitId: 4, quantite: 1 }] });
      await app.naviguer('/catalogue');
      await ouvrirTiroir();
      const tiroir = document.querySelector('app-tiroir-panier dialog')!;
      expect(tiroir.hasAttribute('open')).toBe(true);
      expect(lignesTiroir().length).toBe(2);
      expect(texte(tiroir)).toContain('100 €');
      expect(texte(tiroir)).toContain('Livraison offerte dès 80 € · 72 € reversés aux artisans');
      expect(bouton(tiroir, 'Se connecter pour commander')!.getAttribute('href')).toBe('/connexion?retour=%2Fcommande');
    });

    it('Tiroir vide', async () => {
      app = demarrerApplication();
      await app.naviguer('/catalogue');
      const tiroir = (await ouvrirTiroir()).ownerDocument.querySelector('app-tiroir-panier')!;
      expect(texte(tiroir)).toContain('Votre panier est vide.');
      expect(bouton(tiroir, 'Découvrir la boutique')!.getAttribute('href')).toBe('/catalogue');
    });

    it('Tiroir d\'un client : « Commander » ferme le tiroir et mène à /commande', async () => {
      app = demarrerApplication({ role: 'client', panier: [{ produitId: 1, quantite: 1 }] });
      await app.naviguer('/catalogue');
      await ouvrirTiroir();
      bouton(document.querySelector('app-tiroir-panier')!, 'Commander')!.click();
      await app.stabiliser();
      expect(app.router.url).toBe('/commande');
      expect(panier().tiroirOuvert()).toBe(false);
    });

    it('Quantité bornée dans le panier', async () => {
      app = demarrerApplication({ panier: [{ produitId: 7, quantite: 2 }] });
      await app.naviguer('/catalogue');
      await ouvrirTiroir();
      expect(bouton(document.querySelector('app-tiroir-panier')!, 'Augmenter la quantité de Tabouret haut Lin')!.disabled).toBe(true);
    });

    it('Retirer une ligne', async () => {
      app = demarrerApplication({ panier: [{ produitId: 1, quantite: 1 }, { produitId: 4, quantite: 1 }] });
      await app.naviguer('/catalogue');
      await ouvrirTiroir();
      bouton(document.querySelector('app-tiroir-panier')!, 'Retirer Tasses empilables Nuage du panier')!.click();
      await app.stabiliser();
      expect(panier().lignes()).toEqual([{ produitId: 4, quantite: 1 }]);
      expect(notifications()).toContain('Tasses empilables Nuage retiré du panier');
    });

    it('Calcul du total sur la page panier', async () => {
      app = demarrerApplication({ panier: [{ produitId: 1, quantite: 2 }, { produitId: 4, quantite: 1 }] });
      const main = texte((await app.naviguer('/panier')).querySelector('main'));
      expect(main).toContain('Sous-total : 68 €');
      expect(main).toContain('Sous-total : 32 €');
      expect(main).toMatch(/Total ?100 €/);
    });

    it('Panier vide sur la page panier', async () => {
      app = demarrerApplication();
      const main = (await app.naviguer('/panier')).querySelector('main')!;
      expect(texte(main)).toContain('Votre panier est vide.');
      expect(bouton(main, 'Commander')).toBeUndefined();
    });

    it('Pastille mise à jour, puis masquée', async () => {
      app = demarrerApplication();
      await app.naviguer('/catalogue');
      const sac = () => app.element.querySelector('header button[data-cible-panier]')!;
      await ajouterDepuisCarte('Tasses empilables Nuage');
      const ustensiles = bouton(app.element, 'Ajouter Ustensiles en olivier au panier')!;
      ustensiles.click();
      ustensiles.click();
      await app.stabiliser();
      expect(texte(sac().querySelector('b'))).toBe('3');
      expect(sac().getAttribute('aria-label')).toBe('Panier, 3 articles');
      panier().vider();
      await app.stabiliser();
      expect(sac().querySelector('b')).toBeNull();
      expect(sac().getAttribute('aria-label')).toBe('Panier');
    });

    it('Panier conservé à la connexion puis à la déconnexion', async () => {
      app = demarrerApplication({ panier: [{ produitId: 4, quantite: 1 }] });
      const element = await app.naviguer('/connexion');
      for (const [selecteur, valeur] of [['input[type=email]', 'client@boutique.fr'], ['input[type=password]', 'Client123!']]) {
        const champ = element.querySelector<HTMLInputElement>(`main ${selecteur}`)!;
        champ.value = valeur;
        champ.dispatchEvent(new Event('input'));
      }
      element.querySelector('main form')!.dispatchEvent(new Event('submit'));
      app.http.expectOne('http://localhost:3000/login').flush({ accessToken: jetonFactice(), user: UTILISATEURS.client });
      await app.stabiliser();
      expect(panier().lignes()).toEqual([{ produitId: 4, quantite: 1 }]);
      await app.naviguer('/compte');
      bouton(app.element.querySelector('main')!, 'Se déconnecter')!.click();
      await app.stabiliser();
      expect(JSON.parse(localStorage.getItem(CLE_PANIER)!)).toEqual([{ produitId: 4, quantite: 1 }]);
    });

    it('Ajustement à la restauration à l\'ouverture de /panier', async () => {
      const donnees = (await import('../../testing/fausse-api')).donneesExemple();
      donnees.produits.find((p) => p.id === 6)!['stock'] = 2;
      app = demarrerApplication({ donnees, panier: [{ produitId: 6, quantite: 4 }, { produitId: 10, quantite: 1 }] });
      await app.naviguer('/panier');
      expect(panier().lignes()).toEqual([{ produitId: 6, quantite: 2 }]);
      expect(notifications()).toContain('Votre panier a été mis à jour selon les stocks disponibles.');
    });
  });

  describe('animations du panier', () => {
    it('vol vers le panier demandé à l\'ajout, omis quand le mouvement est réduit', async () => {
      app = demarrerApplication();
      await app.naviguer('/catalogue');
      const vol = vi.spyOn(TestBed.inject(AjoutPanier), 'voler');
      await ajouterDepuisCarte('Tasses empilables Nuage');
      expect(vol).toHaveBeenCalledWith(expect.any(HTMLImageElement));

      const animer = vi.fn();
      vol.mockRestore();
      HTMLElement.prototype.animate = animer as never;
      TestBed.inject(AjoutPanier).voler(app.element.querySelector('main img')!);
      (TestBed.inject(PreferencesMouvement) as unknown as { etat: { set(v: boolean): void } }).etat.set(true);
      TestBed.inject(AjoutPanier).voler(app.element.querySelector('main img')!);
      expect(animer.mock.calls.length).toBeLessThanOrEqual(1);
    });

    it('« Ajouté ✓ » revient à « Ajouter » après 1,2 s', async () => {
      app = demarrerApplication();
      await app.naviguer('/catalogue');
      vi.useFakeTimers();
      bouton(app.element, 'Ajouter Tasses empilables Nuage au panier')!.click();
      app.fixture.detectChanges();
      expect(bouton(app.element, 'Tasses empilables Nuage ajouté au panier')).toBeDefined();
      vi.advanceTimersByTime(1200);
      app.fixture.detectChanges();
      vi.useRealTimers();
      expect(bouton(app.element, 'Ajouter Tasses empilables Nuage au panier')).toBeDefined();
    });

    it('cartes nommées pour la transition de vue du filtrage, lignes de panier animées', async () => {
      app = demarrerApplication({ panier: [{ produitId: 1, quantite: 1 }] });
      const element = await app.naviguer('/catalogue');
      expect(element.querySelector<HTMLElement>('ui-carte-produit article')!.style.getPropertyValue('view-transition-name')).toBe('carte-1');
      await ouvrirTiroir();
      expect(lignesTiroir()[0].className).toContain('motion-safe:animate-entree');
    });
  });

  describe('commande', () => {
    async function remplirLivraison(element: HTMLElement, valeurs: Record<string, string>): Promise<void> {
      for (const [nom, valeur] of Object.entries(valeurs)) {
        const champ = element.querySelector<HTMLInputElement>(`main input[formcontrolname="${nom}"]`)!;
        champ.value = valeur;
        champ.dispatchEvent(new Event('input'));
        champ.dispatchEvent(new Event('blur'));
      }
    }

    const ADRESSE = { adresse: '12 rue des Artisans', codePostal: '75011', ville: 'Paris', telephone: '06 12 34 56 78' };

    async function jusquAuRecapitulatif(): Promise<HTMLElement> {
      const element = await app.naviguer('/commande');
      await remplirLivraison(element, ADRESSE);
      element.querySelector('main form')!.dispatchEvent(new Event('submit'));
      return app.stabiliser();
    }

    it('Panier vide : retour à /panier', async () => {
      app = demarrerApplication({ role: 'client' });
      await app.naviguer('/commande');
      expect(app.router.url).toBe('/panier');
    });

    it('Nom prérempli', async () => {
      app = demarrerApplication({ role: 'client', panier: [{ produitId: 1, quantite: 2 }] });
      const element = await app.naviguer('/commande');
      expect(element.querySelector<HTMLInputElement>('main input[formcontrolname="nomComplet"]')!.value).toBe('Lucas Martin');
    });

    it('Champs invalides : messages, focus, aucune commande', async () => {
      app = demarrerApplication({ role: 'client', panier: [{ produitId: 1, quantite: 2 }] });
      const element = await app.naviguer('/commande');
      await remplirLivraison(element, { codePostal: '750', telephone: '12345' });
      element.querySelector('main form')!.dispatchEvent(new Event('submit'));
      await app.stabiliser();
      const formulaire = texte(element.querySelector('main form'));
      expect(formulaire).toContain('Le code postal doit contenir 5 chiffres.');
      expect(formulaire).toContain('Saisissez un numéro de téléphone valide.');
      expect(formulaire).toContain('Ce champ est obligatoire.');
      expect(document.activeElement).toBe(element.querySelector('main input[formcontrolname="adresse"]'));
      app.http.expectNone('http://localhost:3000/commandes');
    });

    it('Récapitulatif affiché, puis retour à l\'adresse', async () => {
      app = demarrerApplication({ role: 'client', panier: [{ produitId: 1, quantite: 2 }] });
      const element = await jusquAuRecapitulatif();
      const main = texte(element.querySelector('main'));
      expect(main).toContain('Tasses empilables Nuage × 2 — 68 €');
      expect(main).toMatch(/Total ?68 €/);
      expect(main).toContain('12 rue des Artisans, 75011 Paris');
      app.http.expectNone('http://localhost:3000/commandes');
      bouton(element, 'Modifier l\'adresse')!.click();
      await app.stabiliser();
      expect(element.querySelector<HTMLInputElement>('main input[formcontrolname="ville"]')!.value).toBe('Paris');
    });

    it('Commande réussie : panier vidé, toast et confirmation', async () => {
      app = demarrerApplication({ role: 'client', panier: [{ produitId: 1, quantite: 2 }] });
      const element = await jusquAuRecapitulatif();
      bouton(element, 'Confirmer la commande')!.click();
      const requete = app.http.expectOne('http://localhost:3000/commandes');
      expect(requete.request.body.lignes).toEqual([{ produitId: 1, quantite: 2 }]);
      expect(requete.request.headers.get('Authorization')).toMatch(/^Bearer /);
      const commande = { id: 7, clientId: 2, lignes: [{ produitId: 1, quantite: 2, prixUnitaire: 34 }], total: 68, statut: 'en_attente', dateCreation: '2026-10-17T10:00:00Z', adresseLivraison: requete.request.body.adresseLivraison };
      app.donnees.commandes.push(commande);
      requete.flush(commande);
      await app.stabiliser();
      expect(panier().nombreArticles()).toBe(0);
      expect(notifications()).toContain('Commande n° 7 enregistrée');
      expect(app.router.url).toBe('/commande/confirmation/7');
      const main = texte(app.element.querySelector('main'));
      expect(main).toContain('Merci pour votre commande !');
      expect(main).toContain('Commande n° 7');
      expect(main).toContain('68 €');
      expect(bouton(app.element.querySelector('main')!, 'Voir mes commandes')!.getAttribute('href')).toBe('/compte');
      expect(app.element.querySelector('main svg path')!.getAttribute('class')).toContain('motion-safe:animate-trace');
    });

    it('Stock épuisé entre-temps : aucune commande, retour au panier ajusté', async () => {
      const { donneesExemple } = await import('../../testing/fausse-api');
      const donnees = donneesExemple();
      app = demarrerApplication({ role: 'client', donnees, panier: [{ produitId: 7, quantite: 2 }] });
      const element = await jusquAuRecapitulatif();
      donnees.produits.find((p) => p.id === 7)!['stock'] = 1;
      bouton(element, 'Confirmer la commande')!.click();
      app.http.expectOne('http://localhost:3000/commandes').flush({ indisponibles: [{ produitId: 7, disponible: 1 }] }, { status: 409, statusText: 'Conflict' });
      await app.stabiliser();
      expect(app.router.url).toBe('/panier');
      expect(panier().quantiteDe(7)).toBe(1);
      expect(notifications()).toContain(MESSAGE_INDISPONIBLE);
    });

    it('Confirmation d\'une commande d\'un autre client', async () => {
      const { donneesExemple } = await import('../../testing/fausse-api');
      const donnees = donneesExemple();
      donnees.commandes.push({ id: 9, clientId: 4, lignes: [], total: 10, statut: 'en_attente', dateCreation: '2026-10-17T10:00:00Z' });
      app = demarrerApplication({ role: 'client', donnees });
      const element = await app.naviguer('/commande/confirmation/9');
      expect(texte(element.querySelector('main h1'))).toBe('Commande introuvable');
    });

    it('Visiteur qui commande : connexion puis /commande, panier intact', async () => {
      app = demarrerApplication({ panier: [{ produitId: 1, quantite: 2 }] });
      await app.naviguer('/catalogue');
      await ouvrirTiroir();
      bouton(document.querySelector('app-tiroir-panier')!, 'Se connecter pour commander')!.click();
      const element = await app.stabiliser();
      expect(app.router.url).toBe('/connexion?retour=%2Fcommande');
      for (const [selecteur, valeur] of [['input[type=email]', 'client@boutique.fr'], ['input[type=password]', 'Client123!']]) {
        const champ = element.querySelector<HTMLInputElement>(`main ${selecteur}`)!;
        champ.value = valeur;
        champ.dispatchEvent(new Event('input'));
      }
      element.querySelector('main form')!.dispatchEvent(new Event('submit'));
      app.http.expectOne('http://localhost:3000/login').flush({ accessToken: jetonFactice(), user: UTILISATEURS.client });
      await app.stabiliser();
      expect(app.router.url).toBe('/commande');
      expect(panier().lignes()).toEqual([{ produitId: 1, quantite: 2 }]);
    });

    it('Visiteur qui crée un compte pour commander', async () => {
      app = demarrerApplication({ panier: [{ produitId: 4, quantite: 1 }] });
      let element = await app.naviguer('/connexion?retour=%2Fcommande');
      bouton(element, 'Créer un compte')!.click();
      element = await app.stabiliser();
      const champs: [string, string][] = [['input[autocomplete="name"]', 'Awa Koné'], ['input[type=email]', 'awa@exemple.fr']];
      for (const [selecteur, valeur] of champs) {
        const champ = element.querySelector<HTMLInputElement>(`main ${selecteur}`)!;
        champ.value = valeur;
        champ.dispatchEvent(new Event('input'));
      }
      for (const champ of element.querySelectorAll<HTMLInputElement>('main input[type=password]')) {
        champ.value = 'Secret123!';
        champ.dispatchEvent(new Event('input'));
      }
      element.querySelector('main form')!.dispatchEvent(new Event('submit'));
      app.http.expectOne('http://localhost:3000/register').flush({ accessToken: jetonFactice(), user: { id: 5, nom: 'Awa Koné', email: 'awa@exemple.fr', role: 'client', actif: true } });
      await app.stabiliser();
      expect(app.router.url).toBe('/commande');
      expect(panier().lignes()).toEqual([{ produitId: 4, quantite: 1 }]);
    });
  });

  describe('Mes commandes', () => {
    async function avecCommandes() {
      const { donneesExemple } = await import('../../testing/fausse-api');
      const donnees = donneesExemple();
      donnees.commandes.push(
        { id: 7, clientId: 2, lignes: [{ produitId: 1, quantite: 2, prixUnitaire: 34 }, { produitId: 4, quantite: 1, prixUnitaire: 32 }], total: 100, statut: 'en_attente', dateCreation: '2026-10-16T10:00:00Z' },
        { id: 5, clientId: 2, lignes: [{ produitId: 6, quantite: 1, prixUnitaire: 140 }], total: 140, statut: 'expediee', dateCreation: '2026-10-10T10:00:00Z' },
        { id: 6, clientId: 4, lignes: [{ produitId: 2, quantite: 1, prixUnitaire: 58 }], total: 58, statut: 'en_attente', dateCreation: '2026-10-12T10:00:00Z' },
      );
      app = demarrerApplication({ role: 'client', donnees });
      return app.naviguer('/compte');
    }

    const commandes = (element: HTMLElement) => [...element.querySelectorAll('app-mes-commandes li')];

    it('Liste de ses commandes, la plus récente en premier', async () => {
      const element = await avecCommandes();
      const lignes = commandes(element).map(texte);
      expect(lignes.length).toBe(2);
      expect(lignes[0]).toContain('Tasses empilables Nuage × 2, Bougie ambre Forêt');
      expect(lignes[0]).toContain('n° 7 · 16 oct.');
      expect(lignes[0]).toContain('En attente');
      expect(lignes[0]).toContain('100 €');
      expect(lignes[1]).toContain('Expédiée');
      expect(lignes.join(' ')).not.toContain('n° 6');
    });

    it('Aucune commande', async () => {
      app = demarrerApplication({ role: 'client' });
      const element = await app.naviguer('/compte');
      expect(texte(element.querySelector('app-mes-commandes'))).toContain('Vous n\'avez pas encore passé de commande.');
    });

    it('Accès refusé à Mes commandes pour un visiteur', async () => {
      app = demarrerApplication();
      await app.naviguer('/compte');
      expect(app.router.url).toBe('/connexion?retour=%2Fcompte');
    });

    it('Annuler une commande en attente', async () => {
      const element = await avecCommandes();
      bouton(commandes(element)[0], 'Annuler la commande')!.click();
      await app.stabiliser();
      const modale = element.querySelector('app-mes-commandes ui-modale dialog')!;
      expect(modale.hasAttribute('open')).toBe(true);
      expect(texte(modale)).toContain('Voulez-vous vraiment annuler la commande n° 7 ?');
      bouton(modale, 'Oui, annuler')!.click();
      const requete = app.http.expectOne('http://localhost:3000/commandes/7');
      expect(requete.request.body).toEqual({ statut: 'annulee' });
      requete.flush({ id: 7, statut: 'annulee' });
      await app.stabiliser();
      expect(texte(commandes(element)[0])).toContain('Annulée');
      expect(notifications()).toContain('La commande n° 7 a été annulée.');
    });

    it('Renoncer à l\'annulation', async () => {
      const element = await avecCommandes();
      bouton(commandes(element)[0], 'Annuler la commande')!.click();
      await app.stabiliser();
      bouton(element.querySelector('app-mes-commandes ui-modale')!, 'Non')!.click();
      await app.stabiliser();
      app.http.expectNone('http://localhost:3000/commandes/7');
      expect(texte(commandes(element)[0])).toContain('En attente');
    });

    it('Commande expédiée non annulable', async () => {
      const element = await avecCommandes();
      expect(bouton(commandes(element)[1], 'Annuler la commande')).toBeUndefined();
    });
  });
});
