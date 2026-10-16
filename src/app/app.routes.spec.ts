import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { TitreStrategy } from './core/titre.strategy';

describe('Routes de l\'application', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), { provide: TitleStrategy, useClass: TitreStrategy }],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
  });

  async function naviguer(url: string): Promise<HTMLElement> {
    await router.navigateByUrl(url);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const sections = [
    { url: '/catalogue', titre: 'Catalogue' },
    { url: '/panier', titre: 'Panier' },
    { url: '/commande', titre: 'Commande' },
    { url: '/compte', titre: 'Mon compte' },
    { url: '/vendeur', titre: 'Espace vendeur' },
    { url: '/admin', titre: 'Administration' },
  ];

  for (const { url, titre } of sections) {
    it(`affiche la page provisoire de ${url}`, async () => {
      const element = await naviguer(url);

      expect(element.querySelector('main h1')?.textContent?.trim()).toBe(titre);
      expect(TestBed.inject(Title).getTitle()).toBe(`${titre} | FLOWERING`);
    });
  }

  it('redirige l\'accueil vers le catalogue', async () => {
    await naviguer('/');

    expect(router.url).toBe('/catalogue');
  });

  it('laisse temporairement les sections accessibles à tous', async () => {
    for (const url of ['/compte', '/commande', '/vendeur', '/admin']) {
      await naviguer(url);
      expect(router.url).toBe(url);
    }
  });

  it('affiche la page introuvable dans le layout pour une URL inconnue', async () => {
    const element = await naviguer('/une-page-qui-n-existe-pas');

    expect(element.querySelector('main h1')?.textContent?.trim()).toBe('Page introuvable');
    const retour = Array.from(element.querySelectorAll('main a')).find(
      (a) => a.textContent?.trim() === 'Retour au catalogue',
    );
    expect(retour?.getAttribute('href')).toBe('/catalogue');
    expect(element.querySelector('header')).not.toBeNull();
    expect(element.querySelector('footer')).not.toBeNull();
  });

  it('signale uniquement le lien de la section courante', async () => {
    const element = await naviguer('/panier');

    const courants = Array.from(element.querySelectorAll('nav a[aria-current="page"]'));
    expect(courants.map((a) => a.textContent?.trim())).toEqual(['Panier']);
  });

  it('ramène au catalogue via le nom de la boutique', async () => {
    const element = await naviguer('/admin');
    const nom = element.querySelector<HTMLAnchorElement>('header a');
    expect(nom?.textContent?.trim()).toBe('FLOWERING');

    nom?.click();
    await fixture.whenStable();

    expect(router.url).toBe('/catalogue');
  });
});
