import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { App } from '../app';
import { routes } from '../app.routes';
import { jetonInterceptor } from '../core/auth/jeton.interceptor';
import { enregistrerSession } from '../core/auth/session.testing';
import { Role } from '../core/models';
import { CLE_PANIER, LignePanier } from '../core/services/panier.service';
import { TitreStrategy } from '../core/titre.strategy';
import { DonneesApi, donneesExemple, fausseApi } from './fausse-api';

registerLocaleData(localeFr);

export interface Application {
  fixture: ComponentFixture<App>;
  router: Router;
  http: HttpTestingController;
  donnees: DonneesApi;
  element: HTMLElement;
  naviguer(url: string): Promise<HTMLElement>;
  stabiliser(): Promise<HTMLElement>;
}

/** jsdom n'implémente pas showModal()/close() : simulation minimale pour les modales et tiroirs. */
export function simulerDialogues(): void {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

/**
 * Application complète pour les tests : routes réelles, fausse API pour les lectures,
 * HttpTestingController pour les écritures, session et panier optionnels.
 */
export function demarrerApplication(options: { role?: Role; panier?: LignePanier[]; donnees?: DonneesApi } = {}): Application {
  localStorage.clear();
  simulerDialogues();
  if (options.role) {
    enregistrerSession(options.role);
  }
  if (options.panier) {
    localStorage.setItem(CLE_PANIER, JSON.stringify(options.panier));
  }
  const donnees = options.donnees ?? donneesExemple();
  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      provideHttpClient(withInterceptors([jetonInterceptor, fausseApi(donnees)])),
      provideHttpClientTesting(),
      { provide: TitleStrategy, useClass: TitreStrategy },
      { provide: LOCALE_ID, useValue: 'fr-FR' },
    ],
  });
  const fixture = TestBed.createComponent(App);
  const stabiliser = async () => {
    for (let i = 0; i < 3; i++) {
      await fixture.whenStable();
      fixture.detectChanges();
    }
    return fixture.nativeElement as HTMLElement;
  };
  const router = TestBed.inject(Router);
  return {
    fixture,
    router,
    http: TestBed.inject(HttpTestingController),
    donnees,
    element: fixture.nativeElement as HTMLElement,
    stabiliser,
    naviguer: async (url) => {
      await router.navigateByUrl(url);
      return stabiliser();
    },
  };
}

/** Texte sans espaces insécables (les prix français utilisent U+202F avant « € »). */
export function texte(element: Element | null | undefined): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function bouton(racine: ParentNode, libelle: string): HTMLButtonElement | undefined {
  return [...racine.querySelectorAll<HTMLButtonElement>('button, a')].find(
    (b) => texte(b) === libelle || b.getAttribute('aria-label') === libelle,
  ) as HTMLButtonElement | undefined;
}
