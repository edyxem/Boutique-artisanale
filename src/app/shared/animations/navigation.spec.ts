import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet, ViewTransitionInfo } from '@angular/router';
import { FocusTitre, ignorerTransitionSiMouvementReduit } from './focus-titre';
import { PreferencesMouvement } from './mouvement-reduit';

@Component({ template: '<h1>Boutique</h1>' })
class Catalogue {}

@Component({ template: '<h1>Panier</h1>' })
class Panier {}

@Component({ imports: [RouterOutlet], template: '<main><router-outlet /></main>' })
class Coquille {}

describe('Navigation animée', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'catalogue', component: Catalogue },
          { path: 'panier', component: Panier },
        ]),
      ],
    });
  });

  it('place le focus sur le titre principal de la nouvelle page', async () => {
    const fixture = TestBed.createComponent(Coquille);
    TestBed.inject(FocusTitre).demarrer();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/catalogue');
    await fixture.whenStable();
    await router.navigateByUrl('/panier');
    await fixture.whenStable();

    const titre = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(titre.textContent).toBe('Panier');
    expect(titre.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(titre);
  });

  it('ignore la transition de vue quand le mouvement est réduit, la joue sinon', () => {
    const transition = { skipTransition: vi.fn() };
    const info = { transition } as unknown as ViewTransitionInfo;

    TestBed.overrideProvider(PreferencesMouvement, { useValue: { reduit: signal(false) } });
    TestBed.runInInjectionContext(() => ignorerTransitionSiMouvementReduit(info));
    expect(transition.skipTransition).not.toHaveBeenCalled();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PreferencesMouvement, useValue: { reduit: signal(true) } }] });
    TestBed.runInInjectionContext(() => ignorerTransitionSiMouvementReduit(info));
    expect(transition.skipTransition).toHaveBeenCalled();
  });
});
