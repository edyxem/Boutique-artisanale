import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiCompteur } from './compteur';
import { PreferencesMouvement } from './mouvement-reduit';
import { UiPartage } from './partage';
import { UiReveler } from './reveler';

/** IntersectionObserver simulé : on déclenche les entrées à la main. */
class FauxObservateur {
  static instances: FauxObservateur[] = [];
  readonly elements = new Set<Element>();
  constructor(private readonly rappel: IntersectionObserverCallback) {
    FauxObservateur.instances.push(this);
  }
  observe(element: Element) {
    this.elements.add(element);
  }
  unobserve(element: Element) {
    this.elements.delete(element);
  }
  disconnect() {}
  declencher(element: Element, visible = true) {
    this.rappel([{ target: element, isIntersecting: visible } as IntersectionObserverEntry], this as never);
  }
}

describe('Animations', () => {
  describe('uiReveler', () => {
    @Component({
      imports: [UiReveler],
      template: `
        @for (carte of cartes; track carte; let i = $index) {
          <article [uiReveler]="i">{{ carte }}</article>
        }
      `,
    })
    class Grille {
      cartes = Array.from({ length: 8 }, (_, i) => `Carte ${i + 1}`);
    }

    beforeEach(() => {
      FauxObservateur.instances = [];
      vi.stubGlobal('IntersectionObserver', FauxObservateur);
    });
    afterEach(() => vi.unstubAllGlobals());

    it('révèle une grille en cascade (0 à 420 ms) une seule fois', () => {
      const fixture = TestBed.createComponent(Grille);
      fixture.detectChanges();
      const cartes = [...fixture.nativeElement.querySelectorAll('article')] as HTMLElement[];
      expect(cartes.map((c) => c.style.transitionDelay)).toEqual(['0ms', '60ms', '120ms', '180ms', '240ms', '300ms', '360ms', '420ms']);
      expect(cartes[0].className).toContain('motion-safe:opacity-0');

      const observateur = FauxObservateur.instances[0];
      cartes.forEach((carte) => observateur.declencher(carte));
      fixture.detectChanges();
      expect(cartes.every((c) => c.hasAttribute('data-revele'))).toBe(true);
      expect(observateur.elements.size).toBe(0); // plus observées : pas de seconde révélation
    });
  });

  describe('uiCompteur', () => {
    @Component({
      imports: [UiCompteur],
      template: `<span uiCompteur [valeur]="valeur()"></span>`,
    })
    class Tuile {
      valeur = signal(9);
    }

    afterEach(() => vi.unstubAllGlobals());

    it('défile de 0 à 9 en 300 ms et annonce 9 dès l\'affichage', () => {
      const images: FrameRequestCallback[] = [];
      vi.stubGlobal('requestAnimationFrame', (rappel: FrameRequestCallback) => images.push(rappel));
      vi.stubGlobal('IntersectionObserver', undefined);
      const fixture = TestBed.createComponent(Tuile);
      fixture.detectChanges();
      const element = fixture.nativeElement.querySelector('span') as HTMLElement;
      const debut = performance.now();

      expect(element.getAttribute('aria-label')).toBe('9');
      expect(element.textContent).toBe('0');
      // Angular programme aussi des images : on exécute toutes celles en attente à chaque étape.
      const executer = (instant: number) => images.splice(0).forEach((rappel) => rappel(instant));
      executer(debut + 150);
      expect(Number(element.textContent)).toBeGreaterThan(0);
      expect(Number(element.textContent)).toBeLessThan(9);
      executer(debut + 400);
      expect(element.textContent).toBe('9');
    });

    it('affiche directement la valeur finale quand le mouvement est réduit', () => {
      vi.stubGlobal('IntersectionObserver', undefined);
      TestBed.overrideProvider(PreferencesMouvement, { useValue: { reduit: signal(true) } });
      const fixture = TestBed.createComponent(Tuile);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span').textContent).toBe('9');
    });
  });

  describe('uiPartage', () => {
    @Component({
      imports: [UiPartage],
      template: `<img uiPartage="produit-12" alt="Tasses" />`,
    })
    class Photo {}

    it('pose le nom de transition de vue partagé', () => {
      const fixture = TestBed.createComponent(Photo);
      fixture.detectChanges();
      const image = fixture.nativeElement.querySelector('img') as HTMLElement;
      expect(image.style.getPropertyValue('view-transition-name')).toBe('produit-12');
    });
  });

  describe('PreferencesMouvement', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('suit la préférence système de réduction des animations', () => {
      let ecouteur: ((e: { matches: boolean }) => void) | undefined;
      vi.stubGlobal('matchMedia', () => ({
        matches: false,
        addEventListener: (_: string, rappel: (e: { matches: boolean }) => void) => (ecouteur = rappel),
      }));
      const preferences = TestBed.inject(PreferencesMouvement);
      expect(preferences.reduit()).toBe(false);
      ecouteur?.({ matches: true });
      expect(preferences.reduit()).toBe(true);
    });
  });
});
