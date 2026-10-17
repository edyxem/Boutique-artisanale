import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { jetonInterceptor } from './jeton.interceptor';
import { enregistrerSession } from './session.testing';

@Component({ template: '' })
class Vide {}

describe('Jeton joint aux requêtes de l\'API', () => {
  let http: HttpClient;
  let controle: HttpTestingController;

  function preparer(): void {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([jetonInterceptor])), provideHttpClientTesting(),
        provideRouter([
          { path: 'catalogue', component: Vide },
          { path: 'connexion', component: Vide },
        ]),
      ],
    });
    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => controle.verify());

  it('Jeton ajouté pour l\'API', () => {
    const session = enregistrerSession('client');
    preparer();
    http.get('http://localhost:3000/commandes').subscribe();
    const requete = controle.expectOne('http://localhost:3000/commandes');
    expect(requete.request.headers.get('Authorization')).toBe(`Bearer ${session.jeton}`);
    requete.flush([]);
  });

  it('Pas de jeton ailleurs ni pour un visiteur', () => {
    enregistrerSession('client');
    preparer();
    http.get('https://exemple.org/photo.jpg').subscribe();
    const externe = controle.expectOne('https://exemple.org/photo.jpg');
    expect(externe.request.headers.has('Authorization')).toBe(false);
    externe.flush('');

    TestBed.inject(AuthService).deconnexion();
    http.get('http://localhost:3000/produits').subscribe();
    const visiteur = controle.expectOne('http://localhost:3000/produits');
    expect(visiteur.request.headers.has('Authorization')).toBe(false);
    visiteur.flush([]);
  });

  it('Jeton refusé par l\'API : déconnexion et retour à la connexion', () => {
    enregistrerSession('client');
    preparer();
    const auth = TestBed.inject(AuthService);
    const expiration = vi.spyOn(auth, 'expirerSession');
    Object.defineProperty(TestBed.inject(Router), 'url', { get: () => '/compte' });

    http.get('http://localhost:3000/commandes').subscribe({ error: () => undefined });
    controle.expectOne('http://localhost:3000/commandes').flush('', { status: 401, statusText: 'Unauthorized' });
    expect(expiration).toHaveBeenCalledWith('/compte');
  });

  it('ne termine pas la session sur un 401 de /login', () => {
    enregistrerSession('client');
    preparer();
    const expiration = vi.spyOn(TestBed.inject(AuthService), 'expirerSession');
    http.post('http://localhost:3000/login', {}).subscribe({ error: () => undefined });
    controle.expectOne('http://localhost:3000/login').flush('', { status: 401, statusText: 'Unauthorized' });
    expect(expiration).not.toHaveBeenCalled();
  });
});
