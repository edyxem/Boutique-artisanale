import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { jetonInterceptor } from './core/auth/jeton.interceptor';
import { enregistrerSession, jetonFactice, UTILISATEURS } from './core/auth/session.testing';
import { Role } from './core/models';
import { TitreStrategy } from './core/titre.strategy';
import { NotificationService } from './shared/ui';

describe('Application : routes, accès et authentification', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;
  let http: HttpTestingController;

  function demarrer(role?: Role): void {
    localStorage.clear();
    if (role) {
      enregistrerSession(role);
    }
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([jetonInterceptor])),
        provideHttpClientTesting(),
        { provide: TitleStrategy, useClass: TitreStrategy },
      ],
    });
    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
  }

  async function naviguer(url: string): Promise<HTMLElement> {
    await router.navigateByUrl(url);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  async function stabiliser(): Promise<HTMLElement> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const titre = (element: HTMLElement) => element.querySelector('main h1')?.textContent?.trim();
  const liensNavigation = (element: HTMLElement) =>
    [...element.querySelectorAll('nav[aria-label="Navigation principale"] a')].map((a) => a.textContent?.trim());

  function saisir(element: HTMLElement, selecteur: string, valeur: string): void {
    const champ = element.querySelector<HTMLInputElement>(selecteur)!;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    champ.dispatchEvent(new Event('blur'));
  }

  function soumettre(element: HTMLElement): void {
    element.querySelector('main form')!.dispatchEvent(new Event('submit'));
  }

  describe('routes des sections', () => {
    it('Accueil : / s\'affiche sans redirection, titre « Accueil | Flowering »', async () => {
      demarrer();
      const element = await naviguer('/');
      expect(router.url).toBe('/');
      expect(titre(element)).toBe('L\'objet juste, fait par des mains qui ont un nom.');
      expect(TestBed.inject(Title).getTitle()).toBe('Accueil | Flowering');
    });

    it('URL inconnue : page introuvable dans le layout', async () => {
      demarrer();
      const element = await naviguer('/une-page-qui-n-existe-pas');
      expect(titre(element)).toBe('Page introuvable');
      const retour = [...element.querySelectorAll('main a')].find((a) => a.textContent?.trim() === 'Retour au catalogue');
      expect(retour?.getAttribute('href')).toBe('/catalogue');
      expect(element.querySelector('header')).not.toBeNull();
      expect(element.querySelector('footer')).not.toBeNull();
    });

    it('Contenu de la page « Accès refusé »', async () => {
      demarrer('client');
      const element = await naviguer('/acces-refuse');
      expect(titre(element)).toBe('Accès refusé');
      expect(element.querySelector('main a')?.textContent?.trim()).toBe('Retour au catalogue');
    });
  });

  describe('règles d\'accès', () => {
    it('Sections publiques', async () => {
      demarrer();
      for (const url of ['/', '/catalogue', '/panier']) {
        await naviguer(url);
        expect(router.url).toBe(url);
      }
    });

    it('Accès autorisés', async () => {
      for (const [role, urls] of [['client', ['/compte', '/commande']], ['vendeur', ['/vendeur']], ['admin', ['/admin']]] as const) {
        TestBed.resetTestingModule();
        demarrer(role);
        for (const url of urls) {
          await naviguer(url);
          expect(router.url).toBe(url);
        }
      }
    });

    it('Accès refusé aux visiteurs : connexion avec retour et message', async () => {
      demarrer();
      for (const url of ['/compte', '/commande', '/vendeur', '/admin/produits']) {
        const element = await naviguer(url);
        expect(router.url).toBe(`/connexion?retour=${encodeURIComponent(url)}`);
        expect(element.textContent).toContain('Connectez-vous pour accéder à cette page.');
      }
    });

    it('Accès refusé à l\'espace vendeur (client, administrateur)', async () => {
      for (const role of ['client', 'admin'] as const) {
        TestBed.resetTestingModule();
        demarrer(role);
        await naviguer('/vendeur');
        expect(router.url).toBe('/acces-refuse');
      }
    });

    it('Accès refusé à l\'administration (client, vendeur)', async () => {
      for (const role of ['client', 'vendeur'] as const) {
        TestBed.resetTestingModule();
        demarrer(role);
        await naviguer('/admin');
        expect(router.url).toBe('/acces-refuse');
      }
    });
  });

  describe('menu et bouton de compte', () => {
    it('Menu d\'un visiteur', async () => {
      demarrer();
      const element = await naviguer('/catalogue');
      expect(liensNavigation(element)).toEqual(['Boutique', 'Nos artisans']);
      expect(element.querySelector('header a[aria-label="Panier"]')).not.toBeNull();
      expect(element.querySelector('header')!.textContent).toContain('Connexion');
    });

    it('Menu d\'un vendeur', async () => {
      demarrer('vendeur');
      const element = await naviguer('/catalogue');
      expect(liensNavigation(element)).toEqual(['Boutique', 'Nos artisans', 'Espace vendeur']);
    });

    it('Menu d\'un administrateur', async () => {
      demarrer('admin');
      const element = await naviguer('/catalogue');
      expect(liensNavigation(element)).toEqual(['Boutique', 'Nos artisans', 'Admin']);
    });

    it('Lien courant signalé', async () => {
      demarrer();
      const element = await naviguer('/catalogue');
      const courants = [...element.querySelectorAll('nav[aria-label="Navigation principale"] a[aria-current="page"]')];
      expect(courants.map((a) => a.textContent?.trim())).toEqual(['Boutique']);
    });

    it('Logo vers l\'accueil', async () => {
      demarrer();
      const element = await naviguer('/catalogue');
      element.querySelector<HTMLAnchorElement>('header a[aria-label="Flowering, accueil"]')!.click();
      await stabiliser();
      expect(router.url).toBe('/');
    });

    it('Bouton d\'un visiteur : connexion avec la page courante en retour', async () => {
      demarrer();
      const element = await naviguer('/panier');
      const bouton = [...element.querySelectorAll('header a')].find((a) => a.textContent?.trim() === 'Connexion')!;
      expect(bouton.getAttribute('href')).toBe('/connexion?retour=%2Fpanier');
    });

    it('Bouton après connexion : prénom vers /compte', async () => {
      demarrer('admin');
      const element = await naviguer('/catalogue');
      const entete = element.querySelector('header')!;
      const bouton = [...entete.querySelectorAll('a')].find((a) => a.textContent?.trim() === 'Mariam');
      expect(bouton?.getAttribute('href')).toBe('/compte');
      expect(entete.textContent).not.toContain('Connexion');
    });
  });

  describe('connexion', () => {
    async function seConnecter(retour: string | null, compte: Role, reponse: 'ok' | number = 'ok') {
      demarrer();
      const element = await naviguer(retour ? `/connexion?retour=${encodeURIComponent(retour)}` : '/connexion');
      saisir(element, 'main input[type=email]', UTILISATEURS[compte].email);
      saisir(element, 'main input[type=password]', 'MotDePasse1!');
      soumettre(element);
      const requete = http.expectOne('http://localhost:3000/login');
      if (reponse === 'ok') {
        requete.flush({ accessToken: jetonFactice(), user: UTILISATEURS[compte] });
      } else if (reponse === 0) {
        requete.error(new ProgressEvent('error'), { status: 0 });
      } else {
        requete.flush('erreur', { status: reponse, statusText: 'Erreur' });
      }
      return stabiliser();
    }

    it('Connexion réussie : client connecté et redirigé vers /catalogue', async () => {
      await seConnecter(null, 'client');
      expect(router.url).toBe('/catalogue');
      expect(fixture.nativeElement.querySelector('header').textContent).toContain('Lucas');
    });

    it('Identifiants incorrects : message et mot de passe effacé', async () => {
      const element = await seConnecter(null, 'client', 400);
      expect(router.url).toBe('/connexion');
      expect(element.querySelector('main [role="alert"]')?.textContent).toContain('Email ou mot de passe incorrect.');
      expect(element.querySelector<HTMLInputElement>('main input[type=password]')!.value).toBe('');
    });

    it('Compte désactivé avec le bon mot de passe (interface)', async () => {
      const element = await seConnecter(null, 'client', 403);
      expect(element.querySelector('main [role="alert"]')?.textContent).toContain('Ce compte est désactivé. Contactez l\'administrateur.');
    });

    it('API indisponible', async () => {
      const element = await seConnecter(null, 'client', 0);
      expect(element.querySelector('main [role="alert"]')?.textContent).toContain('Le serveur ne répond pas. Réessayez plus tard.');
    });

    it('Champs requis : aucune requête, deux messages', async () => {
      demarrer();
      const element = await naviguer('/connexion');
      soumettre(element);
      await stabiliser();
      http.expectNone('http://localhost:3000/login');
      const messages = [...element.querySelectorAll('main ui-champ p')].map((p) => p.textContent?.trim());
      expect(messages).toEqual(['Ce champ est obligatoire.', 'Ce champ est obligatoire.']);
    });

    it('Retour à la page demandée', async () => {
      await seConnecter('/admin/produits', 'admin');
      expect(router.url).toBe('/admin/produits');
    });

    it('Retour externe ignoré', async () => {
      await seConnecter('//site-malveillant.example', 'client');
      expect(router.url).toBe('/catalogue');
      TestBed.resetTestingModule();
      await seConnecter('https://site-malveillant.example', 'client');
      expect(router.url).toBe('/catalogue');
    });

    it('Retour vers une page d\'un autre rôle', async () => {
      await seConnecter('/admin', 'client');
      expect(router.url).toBe('/acces-refuse');
    });

    it('Onglets et retour conservé', async () => {
      demarrer();
      const element = await naviguer('/connexion?retour=%2Fcommande');
      const onglet = [...element.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((b) => b.textContent?.trim() === 'Créer un compte')!;
      onglet.click();
      const apres = await stabiliser();
      expect(router.url).toBe('/inscription?retour=%2Fcommande');
      expect(apres.querySelector('main h1')?.textContent?.trim()).toBe('Créer un compte');
      expect(apres.querySelectorAll('main input').length).toBe(4);
    });

    it('Session expirée : message de reconnexion', async () => {
      demarrer();
      const element = await naviguer('/connexion?retour=%2Fcompte&expire=1');
      expect(element.textContent).toContain('Votre session a expiré. Veuillez vous reconnecter.');
    });
  });

  describe('inscription', () => {
    async function remplir(email: string): Promise<HTMLElement> {
      demarrer();
      const element = await naviguer('/inscription');
      saisir(element, 'main input[autocomplete="name"]', 'Awa Koné');
      saisir(element, 'main input[type=email]', email);
      const motsDePasse = element.querySelectorAll<HTMLInputElement>('main input[type=password]');
      for (const champ of motsDePasse) {
        champ.value = 'Secret123!';
        champ.dispatchEvent(new Event('input'));
      }
      soumettre(element);
      return element;
    }

    it('Inscription réussie : connecté, redirigé et accueilli', async () => {
      await remplir('awa@exemple.fr');
      const succes = vi.spyOn(TestBed.inject(NotificationService), 'succes');
      const requete = http.expectOne('http://localhost:3000/register');
      expect(requete.request.body).toEqual({ nom: 'Awa Koné', email: 'awa@exemple.fr', password: 'Secret123!' });
      requete.flush({ accessToken: jetonFactice(), user: { id: 5, nom: 'Awa Koné', email: 'awa@exemple.fr', role: 'client', actif: true } });
      await stabiliser();
      expect(router.url).toBe('/catalogue');
      expect(succes).toHaveBeenCalledWith('Bienvenue Awa Koné, votre compte a été créé.');
      expect(fixture.nativeElement.querySelector('header').textContent).toContain('Awa');
    });

    it('Email déjà utilisé : message, nom et e-mail conservés', async () => {
      const element = await remplir('client@boutique.fr');
      http.expectOne('http://localhost:3000/register').flush('Email already exists', { status: 400, statusText: 'Bad Request' });
      await stabiliser();
      expect(element.querySelector('main [role="alert"]')?.textContent).toContain('Un compte existe déjà avec cet email.');
      expect(element.querySelector<HTMLInputElement>('main input[autocomplete="name"]')!.value).toBe('Awa Koné');
      expect(element.querySelector<HTMLInputElement>('main input[type=email]')!.value).toBe('client@boutique.fr');
    });

    it('Champs vides : aucune requête, messages et focus sur le premier champ', async () => {
      demarrer();
      const element = await naviguer('/inscription');
      soumettre(element);
      await stabiliser();
      http.expectNone('http://localhost:3000/register');
      const messages = [...element.querySelectorAll('main ui-champ p')].map((p) => p.textContent?.trim());
      expect(messages).toEqual(Array(4).fill('Ce champ est obligatoire.'));
      expect(document.activeElement).toBe(element.querySelector('main input[autocomplete="name"]'));
    });

    it('Valeurs invalides', async () => {
      demarrer();
      const element = await naviguer('/inscription');
      saisir(element, 'main input[type=email]', 'awa@');
      const [motDePasse, confirmation] = element.querySelectorAll<HTMLInputElement>('main input[type=password]');
      motDePasse.value = 'abc';
      motDePasse.dispatchEvent(new Event('input'));
      motDePasse.dispatchEvent(new Event('blur'));
      confirmation.value = 'abd';
      confirmation.dispatchEvent(new Event('input'));
      confirmation.dispatchEvent(new Event('blur'));
      const apres = await stabiliser();
      const texte = apres.querySelector('main form')!.textContent!;
      expect(texte).toContain('Saisissez une adresse email valide.');
      expect(texte).toContain('Le mot de passe doit contenir au moins 6 caractères.');
      expect(texte).toContain('Les mots de passe ne correspondent pas.');
    });
  });

  describe('espace client', () => {
    it('En-tête de l\'espace client', async () => {
      demarrer('client');
      const element = await naviguer('/compte');
      expect(titre(element)).toBe('Bonjour Lucas');
      expect(element.querySelector('main')!.textContent).toContain('client@boutique.fr');
      expect([...element.querySelectorAll('main button')].some((b) => b.textContent?.trim() === 'Se déconnecter')).toBe(true);
    });

    it('Déconnexion : visiteur sur /catalogue, y compris après rechargement', async () => {
      demarrer('client');
      const element = await naviguer('/compte');
      [...element.querySelectorAll<HTMLButtonElement>('main button')].find((b) => b.textContent?.trim() === 'Se déconnecter')!.click();
      await stabiliser();
      expect(router.url).toBe('/catalogue');
      expect(fixture.nativeElement.querySelector('header').textContent).toContain('Connexion');
      expect(localStorage.length).toBe(0);
    });
  });
});
