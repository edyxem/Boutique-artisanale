import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('Layout (App)', () => {
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  });

  it('entoure chaque page d\'un en-tête, d\'un contenu principal et d\'un pied de page uniques', () => {
    expect(element.querySelectorAll('header').length).toBe(1);
    expect(element.querySelectorAll('main').length).toBe(1);
    expect(element.querySelectorAll('footer').length).toBe(1);
    expect(element.querySelector('main router-outlet')).not.toBeNull();
  });

  it('affiche le nom de la boutique et une mention de copyright dans le pied de page', () => {
    const texte = element.querySelector('footer')?.textContent ?? '';
    expect(texte).toContain('FLOWERING');
    expect(texte).toContain('©');
  });

  it('présente les liens de toutes les sections dans la navigation principale', () => {
    const nav = element.querySelector('nav[aria-label="Navigation principale"]');
    const libelles = Array.from(nav?.querySelectorAll('a') ?? []).map((a) => a.textContent?.trim());
    expect(libelles).toEqual([
      'Catalogue',
      'Panier',
      'Commande',
      'Mon compte',
      'Espace vendeur',
      'Administration',
    ]);
  });

  it('place le focus sur le contenu principal via le lien d\'évitement', () => {
    const premierLien = element.querySelector('a');
    expect(premierLien?.textContent?.trim()).toBe('Aller au contenu principal');

    premierLien?.click();

    expect(document.activeElement).toBe(element.querySelector('main'));
  });
});
