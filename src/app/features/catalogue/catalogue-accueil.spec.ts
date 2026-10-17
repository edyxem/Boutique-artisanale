import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { NavigationSite } from '../../core/layout/navigation';
import { Application, bouton, demarrerApplication, texte } from '../../testing/application';
import { CataloguePage } from './catalogue-page';
import { SimulateurPrix } from '../accueil/prix-juste';

describe('Catalogue et accueil', () => {
  let app: Application;

  const cartes = (element: HTMLElement) => [...element.querySelectorAll('main ui-carte-produit')];
  const noms = (element: HTMLElement) => cartes(element).map((c) => texte(c.querySelector('h3')));

  async function rechercher(valeur: string): Promise<HTMLElement> {
    const champ = app.element.querySelector<HTMLInputElement>('#recherche-catalogue')!;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    return app.stabiliser();
  }

  describe('catalogue', () => {
    it('Données d\'exemple : 9 cartes, titre « Toutes les créations »', async () => {
      app = demarrerApplication();
      const element = await app.naviguer('/catalogue');
      expect(cartes(element).length).toBe(9);
      expect(texte(element.querySelector('main h1'))).toBe('Toutes les créations');
      expect(noms(element)).not.toContain('Bols en bois tourné');
    });

    it('Contenu d\'une carte', async () => {
      app = demarrerApplication();
      const carte = cartes(await app.naviguer('/catalogue'))[0];
      expect(carte.querySelector('img')!.getAttribute('alt')).toBe('Tasses empilables Nuage');
      expect(texte(carte.querySelector('ui-badge-stock'))).toBe('En stock');
      expect(texte(carte)).toContain('Atelier Grès & Sel · 34 €');
      expect(bouton(carte, 'Détails')!.getAttribute('href')).toBe('/catalogue/1');
    });

    it('Stock bas : « Plus que 2 »', async () => {
      app = demarrerApplication();
      const carte = cartes(await app.naviguer('/catalogue')).find((c) => texte(c.querySelector('h3')) === 'Tabouret haut Lin')!;
      expect(texte(carte.querySelector('ui-badge-stock'))).toBe('Plus que 2');
    });

    it('Filtrer par univers', async () => {
      app = demarrerApplication();
      const element = await app.naviguer('/catalogue');
      bouton(element, 'Mobilier')!.click();
      await app.stabiliser();
      expect(app.router.url).toBe('/catalogue?categorie=mobilier');
      expect(texte(element.querySelector('main h1'))).toBe('Mobilier');
      expect(noms(element)).toEqual(['Tabouret de comptoir en frêne', 'Tabouret haut Lin']);
    });

    it('Filtre conservé au rechargement', async () => {
      app = demarrerApplication();
      const element = await app.naviguer('/catalogue?categorie=maison');
      expect(bouton(element, 'Maison')!.getAttribute('aria-pressed')).toBe('true');
      expect(noms(element)).toEqual(['Bougie ambre Forêt', 'Bougies parfumées']);
    });

    it('Catégorie inconnue', async () => {
      app = demarrerApplication();
      const element = await app.naviguer('/catalogue?categorie=inconnue');
      expect(cartes(element).length).toBe(9);
      expect(bouton(element, 'Tout')!.getAttribute('aria-pressed')).toBe('true');
      expect(texte(element.querySelector('main h1'))).toBe('Toutes les créations');
    });

    it('Recherche insensible aux accents, reportée dans l\'URL', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      app = demarrerApplication();
      await app.naviguer('/catalogue');
      const element = await rechercher('frene');
      expect(noms(element)).toEqual(['Tabouret de comptoir en frêne']);
      vi.advanceTimersByTime(200);
      await app.stabiliser();
      vi.useRealTimers();
      expect(app.router.url).toBe('/catalogue?q=frene');
      expect(document.activeElement).not.toBe(element.querySelector('main h1'));
    });

    it('Recherche sur la boutique', async () => {
      app = demarrerApplication();
      await app.naviguer('/catalogue');
      expect(noms(await rechercher('lebrun')).length).toBe(4);
    });

    it('Recherche combinée au filtre', async () => {
      app = demarrerApplication();
      await app.naviguer('/catalogue?categorie=cuisine');
      expect(noms(await rechercher('olivier'))).toEqual(['Ustensiles en olivier']);
    });

    it('Aucun résultat, puis « Effacer les filtres »', async () => {
      app = demarrerApplication();
      await app.naviguer('/catalogue?categorie=cuisine');
      const element = await rechercher('téléviseur');
      expect(texte(element.querySelector('main'))).toContain('Aucun résultat');
      expect(texte(element.querySelector('main'))).toContain('Rien ne correspond à « téléviseur ».');
      bouton(element, 'Effacer les filtres')!.click();
      await app.stabiliser();
      expect(app.router.url).toBe('/catalogue');
      expect(cartes(element).length).toBe(9);
    });

    it('Épuisé dans la grille et sur la fiche', async () => {
      app = demarrerApplication();
      let element = await app.naviguer('/catalogue');
      const carte = cartes(element).find((c) => texte(c.querySelector('h3')) === 'Mugs mouchetés')!;
      expect(texte(carte.querySelector('ui-badge-stock'))).toBe('Épuisé');
      expect(bouton(carte, 'Ajouter Mugs mouchetés au panier')!.disabled).toBe(true);
      element = await app.naviguer('/catalogue/3');
      expect(texte(element.querySelector('main dl'))).toContain('Épuisé');
      expect(bouton(element.querySelector('main')!, 'Épuisé')!.disabled).toBe(true);
    });

    it('Univers de l\'en-tête et du pied de page', async () => {
      app = demarrerApplication();
      TestBed.inject(NavigationSite).univers.set(
        ['Céramique', 'Mobilier', 'Cuisine', 'Maison'].map((nom) => ({
          libelle: nom,
          chemin: '/catalogue',
          parametres: { categorie: nom.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') },
        })),
      );
      const element = await app.naviguer('/catalogue');
      expect([...element.querySelectorAll('nav[aria-label="Univers"] a')].map(texte)).toEqual(['Céramique', 'Mobilier', 'Cuisine']);
      expect([...element.querySelectorAll('footer nav[aria-labelledby="pied-boutique"] a')].map(texte)).toEqual(['Céramique', 'Mobilier', 'Cuisine', 'Maison']);
      expect(bouton(element.querySelector('header')!, 'Cuisine')!.getAttribute('href')).toBe('/catalogue?categorie=cuisine');
    });
  });

  describe('chargement', () => {
    it('API indisponible : message et « Réessayer »', async () => {
      TestBed.configureTestingModule({ providers: [provideRouter([], withComponentInputBinding()), provideHttpClient(), provideHttpClientTesting()] });
      const fixture = TestBed.createComponent(CataloguePage);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
      const http = TestBed.inject(HttpTestingController);
      http.expectOne((r) => r.url.endsWith('/produits')).error(new ProgressEvent('error'), { status: 0 });
      for (const requete of http.match(() => true)) {
        if (!requete.cancelled) {
          requete.flush([]);
        }
      }
      await fixture.whenStable();
      fixture.detectChanges();
      expect(texte(fixture.nativeElement)).toContain('Le catalogue est momentanément indisponible.');
      expect(bouton(fixture.nativeElement, 'Réessayer')).toBeDefined();
    });
  });

  describe('fiche produit', () => {
    it('Consultation d\'une fiche', async () => {
      app = demarrerApplication();
      const element = await app.naviguer('/catalogue/1');
      const main = texte(element.querySelector('main'));
      expect(texte(element.querySelector('main h1'))).toBe('Tasses empilables Nuage');
      expect(main).toContain('Céramique · Atelier Grès & Sel');
      expect(main).toContain('18 en stock');
      expect(main).toContain('34 €');
      expect(main).toContain('Livraison sous 3 à 5 jours · Retours gratuits 30 jours');
      expect(TestBed.inject(Title).getTitle()).toBe('Tasses empilables Nuage | Flowering');
    });

    it('Produit inexistant ou masqué', async () => {
      app = demarrerApplication();
      for (const url of ['/catalogue/9999', '/catalogue/10']) {
        const element = await app.naviguer(url);
        expect(texte(element.querySelector('main h1'))).toBe('Produit introuvable');
        expect(bouton(element.querySelector('main')!, 'Retour au catalogue')!.getAttribute('href')).toBe('/catalogue');
      }
    });

    it('Photo partagée entre la carte et la fiche (transition de vue)', async () => {
      app = demarrerApplication();
      let element = await app.naviguer('/catalogue');
      expect(cartes(element)[0].querySelector('img')!.style.getPropertyValue('view-transition-name')).toBe('produit-1');
      element = await app.naviguer('/catalogue/1');
      expect(element.querySelector<HTMLElement>('main img')!.style.getPropertyValue('view-transition-name')).toBe('produit-1');
    });
  });

  describe('accueil', () => {
    it('Contenu du hero', async () => {
      app = demarrerApplication();
      const element = await app.naviguer('/');
      expect(texte(element.querySelector('main h1'))).toBe('L\'objet juste, fait par des mains qui ont un nom.');
      expect(texte(element.querySelector('main'))).toContain('4,9');
      expect(bouton(element.querySelector('main')!, 'Découvrir la boutique')!.getAttribute('href')).toBe('/catalogue');
    });

    it('En-tête au défilement : superposé sur le hero, normal ensuite', async () => {
      const observateurs: IntersectionObserverCallback[] = [];
      vi.stubGlobal('IntersectionObserver', class {
        constructor(rappel: IntersectionObserverCallback) { observateurs.push(rappel); }
        observe() {}
        unobserve() {}
        disconnect() {}
      });
      app = demarrerApplication();
      const element = await app.naviguer('/');
      const entete = element.querySelector('app-en-tete')!;
      expect(entete.className).toContain('text-white');
      const heroVu = observateurs.at(-1)!;
      heroVu([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
      await app.stabiliser();
      expect(entete.className).toContain('bg-bg');
      heroVu([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      await app.stabiliser();
      expect(entete.className).toContain('bg-transparent');
      vi.unstubAllGlobals();
    });

    it('Bloc engagement', async () => {
      app = demarrerApplication();
      const bloc = (await app.naviguer('/')).querySelector('app-bloc-engagement')!;
      expect(texte(bloc)).toContain('Chez Flowering, nous réunissons des artisans qui façonnent des objets du quotidien faits pour durer des années.');
      expect(bloc.querySelectorAll('img').length).toBe(3);
      expect(bouton(bloc, 'Voir les créations')!.getAttribute('href')).toBe('/catalogue');
    });

    it('Sélection du jeu d\'exemple', async () => {
      app = demarrerApplication();
      const selection = (await app.naviguer('/')).querySelector('app-selection-produits')!;
      expect(texte(selection)).toContain('Art de la table');
      const produits = [...selection.querySelectorAll('ui-carte-produit h3')].map(texte);
      expect(produits.length).toBe(7);
      expect(produits[0]).toBe('Tasses empilables Nuage');
      expect(produits).not.toContain('Bols en bois tourné');
      expect(bouton(selection, 'Explorer')!.getAttribute('href')).toBe('/catalogue?categorie=ceramique');
    });

    it('Lien « Nos artisans » : défilement et focus sur les étapes', async () => {
      app = demarrerApplication();
      const element = await app.naviguer('/catalogue');
      bouton(element.querySelector('header')!, 'Nos artisans')!.click();
      await app.stabiliser();
      expect(app.router.url).toBe('/#comment-ca-marche');
      expect(document.activeElement?.id).toBe('comment-ca-marche');
      expect(texte(document.activeElement)).toContain('Des ateliers sélectionnés');
    });

    it('animations du hero, du bloc engagement et du « 72 % », toutes sous motion-safe', async () => {
      app = demarrerApplication();
      const element = await app.naviguer('/');
      expect(element.querySelector('app-hero-accueil h1')!.className).toContain('motion-safe:animate-entree');
      const pilules = [...element.querySelectorAll('app-bloc-engagement span.rounded-full')];
      expect(pilules.length).toBe(3);
      pilules.forEach((pilule) => expect(pilule.className).toContain('motion-safe:scale-x-0'));
      expect(element.querySelector('app-bloc-prix-juste [uicompteur]')!.getAttribute('aria-label')).toBe('72');
      const classes = [...element.querySelectorAll('main [class]')].flatMap((e) => (e.getAttribute('class') ?? '').split(/\s+/));
      expect(classes.filter((c) => /(^|:)animate-/.test(c) && !c.includes('motion-safe:'))).toEqual([]);
    });

    it('Tuiles du jeu d\'exemple', async () => {
      app = demarrerApplication();
      const univers = (await app.naviguer('/')).querySelector('app-univers-accueil')!;
      expect([...univers.querySelectorAll('li')].map((li) => [...li.querySelectorAll('strong, small')].map(texte).join(' '))).toEqual([
        'Céramique 3 créations',
        'Mobilier 2 créations',
        'Cuisine 2 créations',
        'Maison 2 créations',
      ]);
      expect(univers.querySelectorAll('a')[2].getAttribute('href')).toBe('/catalogue?categorie=mobilier');
    });
  });

  describe('simulateur', () => {
    it('Valeur par défaut, puis déplacement du curseur', () => {
      const fixture = TestBed.createComponent(SimulateurPrix);
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      expect(texte(element)).toContain('120 €');
      const parts = () => [...element.querySelectorAll('dl > div')].map((d) => `${texte(d.querySelector('dt'))} ${texte(d.querySelector('dd'))}`);
      expect(parts()).toEqual(['Artisan 86 €', 'Livraison & emballage 17 €', 'Boutique 17 €']);
      expect(texte(element)).toContain('86 € versés à l\'atelier sous 7 jours');

      const curseur = element.querySelector<HTMLInputElement>('input[type=range]')!;
      curseur.value = '300';
      curseur.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(texte(element)).toContain('300 €');
      expect(parts()[0]).toBe('Artisan 216 €');
      expect(texte(element)).toContain('216 € versés à l\'atelier sous 7 jours');
      expect(curseur.getAttribute('aria-valuetext')?.replace(/\s/g, ' ')).toBe('300 €');
    });
  });
});
