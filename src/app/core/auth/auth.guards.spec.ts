import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { adminGuard, authGuard, retourSur, vendeurGuard } from './auth.guards';
import { enregistrerSession } from './session.testing';

@Component({ template: '' })
class Vide {}

describe('Guards et retour', () => {
  describe('retourSur', () => {
    it('accepte les chemins internes, paramètres compris', () => {
      expect(retourSur('/admin/produits')).toBe('/admin/produits');
      expect(retourSur('/catalogue?categorie=mobilier')).toBe('/catalogue?categorie=mobilier');
    });

    it('renvoie vers le catalogue pour un retour externe, vide ou vers l\'authentification', () => {
      for (const valeur of ['https://site-malveillant.example', '//site-malveillant.example', '/\\site-malveillant.example', '', null, '/connexion']) {
        expect(retourSur(valeur)).toBe('/catalogue');
      }
    });
  });

  describe('exigerRole', () => {
    function routeur(): Router {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideRouter([
            { path: 'compte', canMatch: [authGuard], component: Vide },
            { path: 'vendeur', canMatch: [vendeurGuard], component: Vide },
            { path: 'admin', canMatch: [adminGuard], children: [{ path: 'produits', component: Vide }] },
            { path: 'connexion', component: Vide },
            { path: 'acces-refuse', component: Vide },
          ]),
        ],
      });
      return TestBed.inject(Router);
    }

    beforeEach(() => localStorage.clear());

    it('envoie un visiteur à la connexion avec l\'URL demandée, paramètres compris', async () => {
      const router = routeur();
      await router.navigateByUrl('/admin/produits?page=2');
      expect(router.url).toBe('/connexion?retour=%2Fadmin%2Fproduits%3Fpage%3D2');
      expect(router.lastSuccessfulNavigation()?.extras.state?.['accesProtege']).toBe(true);
    });

    it('envoie un utilisateur d\'un autre rôle vers « Accès refusé »', async () => {
      enregistrerSession('client');
      const router = routeur();
      await router.navigateByUrl('/vendeur');
      expect(router.url).toBe('/acces-refuse');
    });

    it('laisse passer le bon rôle', async () => {
      enregistrerSession('vendeur');
      const router = routeur();
      await router.navigateByUrl('/vendeur');
      expect(router.url).toBe('/vendeur');
      await router.navigateByUrl('/compte');
      expect(router.url).toBe('/compte');
    });
  });
});
