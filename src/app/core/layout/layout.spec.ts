import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { EnTete } from './en-tete/en-tete';
import { MenuMobile } from './menu-mobile/menu-mobile';
import { NavigationSite } from './navigation';
import { PiedDePage } from './pied-de-page/pied-de-page';

@Component({ template: '<h1>Page</h1>' })
class Page {}

function simulerDialogue(): void {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

describe('Layout du template', () => {
  beforeEach(() => {
    simulerDialogue();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Page, data: { enTete: 'superpose' } },
          { path: 'catalogue', component: Page },
        ]),
      ],
    });
  });

  describe('en-tête', () => {
    it('présente les trois zones : univers à gauche, logo au centre, liens à droite', async () => {
      TestBed.inject(NavigationSite).univers.set([{ libelle: 'Céramique', chemin: '/catalogue', parametres: { categorie: 'ceramique' } }]);
      const fixture = TestBed.createComponent(EnTete);
      await TestBed.inject(Router).navigateByUrl('/catalogue');
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;

      const zones = element.querySelector('header')!.children;
      expect(zones[0].getAttribute('aria-label')).toBe('Univers');
      expect(zones[0].textContent).toContain('Céramique');
      expect(zones[1].getAttribute('aria-label')).toBe('Flowering, accueil');
      expect(zones[1].textContent).toContain('Flowering');
      expect(zones[1].querySelector('sup')!.className).toContain('text-candy');
      expect(zones[2].querySelector('nav')!.getAttribute('aria-label')).toBe('Navigation principale');
      expect(element.className).toContain('bg-bg');
      expect(element.className).toContain('border-line');
    });

    it('se superpose au hero (transparent, texte blanc) sur une route marquée', async () => {
      const fixture = TestBed.createComponent(EnTete);
      await TestBed.inject(Router).navigateByUrl('/');
      fixture.detectChanges();
      expect(fixture.nativeElement.className).toContain('bg-transparent');
      expect(fixture.nativeElement.className).toContain('text-white');

      TestBed.inject(NavigationSite).heroVisible.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.className).toContain('bg-bg');
    });
  });

  describe('menu mobile', () => {
    it('s\'ouvre depuis le burger, anime ses liens en cascade, se ferme avec Échap et rend le focus', () => {
      const fixture = TestBed.createComponent(EnTete);
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const burger = element.querySelector('button[aria-label="Menu"]') as HTMLButtonElement;
      burger.focus();
      burger.click();
      fixture.detectChanges();

      const dialogue = element.querySelector('app-menu-mobile dialog') as HTMLDialogElement;
      expect(dialogue.hasAttribute('open')).toBe(true);
      expect(burger.getAttribute('aria-expanded')).toBe('true');
      const liens = [...dialogue.querySelectorAll('li')] as HTMLElement[];
      expect(liens.length).toBeGreaterThan(1);
      expect(liens[1].style.animationDelay).toBe('40ms');
      expect(dialogue.querySelector('[class*="animate-croix-haut"]')).not.toBeNull();

      dialogue.dispatchEvent(new Event('cancel', { cancelable: true }));
      fixture.detectChanges();
      expect(dialogue.hasAttribute('open')).toBe(false);
      expect(document.activeElement).toBe(burger);
    });

    it('se ferme à la navigation', async () => {
      const fixture = TestBed.createComponent(MenuMobile);
      fixture.componentRef.setInput('ouvert', true);
      fixture.detectChanges();
      await TestBed.inject(Router).navigateByUrl('/catalogue');
      fixture.detectChanges();
      expect(fixture.componentInstance.ouvert()).toBe(false);
    });
  });

  describe('pied de page', () => {
    it('reprend le bloc du template', () => {
      TestBed.inject(NavigationSite).univers.set([{ libelle: 'Céramique', chemin: '/catalogue' }]);
      const fixture = TestBed.createComponent(PiedDePage);
      fixture.detectChanges();
      const texte = (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
      expect(texte).toContain('Flowering');
      expect(texte).toContain('La boutique des artisans indépendants. Objets faits main pour la maison, la table et le quotidien.');
      expect(texte).toContain('Boutique');
      expect(texte).toContain('Céramique');
      expect(texte).toContain('Aide');
      expect(texte).toContain('© 2026 Flowering');
      expect(texte).toContain('Photos : Unsplash');
      const contact = fixture.nativeElement.querySelector('a[href^="mailto:"]') as HTMLAnchorElement;
      expect(contact.getAttribute('href')).toBe('mailto:bonjour@flowering.fr');
      expect(contact.textContent).toContain('Contact : bonjour@flowering.fr');
    });
  });
});
