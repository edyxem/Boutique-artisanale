import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService, CLE_SESSION } from './auth.service';
import { ErreurAuth } from './session.model';
import { enregistrerSession, jetonFactice, UTILISATEURS } from './session.testing';

describe('AuthService', () => {
  let http: HttpTestingController;

  function service(): AuthService {
    const auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    return auth;
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  });

  afterEach(() => http?.verify());

  describe('session conservée dans le navigateur', () => {
    it('Rechargement de la page : la session du vendeur est restaurée', () => {
      enregistrerSession('vendeur');
      const auth = service();
      expect(auth.estConnecte()).toBe(true);
      expect(auth.role()).toBe('vendeur');
      expect(auth.utilisateurConnecte()?.nom).toBe('Claire Fontaine');
      expect(auth.prenom()).toBe('Claire');
    });

    it('Jeton expiré au chargement : visiteur et session effacée', () => {
      enregistrerSession('client', -60);
      const auth = service();
      expect(auth.estConnecte()).toBe(false);
      expect(localStorage.getItem(CLE_SESSION)).toBeNull();
    });

    it('efface une session illisible', () => {
      localStorage.setItem(CLE_SESSION, '{pas du json');
      expect(service().estConnecte()).toBe(false);
      expect(localStorage.getItem(CLE_SESSION)).toBeNull();
    });
  });

  describe('connexion', () => {
    function connecter(): { utilisateur?: unknown; erreur?: ErreurAuth } {
      const resultat: { utilisateur?: unknown; erreur?: ErreurAuth } = {};
      service().connexion('client@boutique.fr', 'Client123!').subscribe({
        next: (u) => (resultat.utilisateur = u),
        error: (e: ErreurAuth) => (resultat.erreur = e),
      });
      return resultat;
    }

    it('enregistre la session après une connexion réussie', () => {
      const resultat = connecter();
      const requete = http.expectOne('http://localhost:3000/login');
      expect(requete.request.body).toEqual({ email: 'client@boutique.fr', password: 'Client123!' });
      requete.flush({ accessToken: jetonFactice(), user: UTILISATEURS.client });

      const auth = TestBed.inject(AuthService);
      expect(resultat.utilisateur).toEqual(UTILISATEURS.client);
      expect(auth.role()).toBe('client');
      expect(JSON.parse(localStorage.getItem(CLE_SESSION)!).utilisateur.email).toBe('client@boutique.fr');
    });

    it('traduit 400 en identifiants incorrects', () => {
      const resultat = connecter();
      http.expectOne('http://localhost:3000/login').flush('Incorrect password', { status: 400, statusText: 'Bad Request' });
      expect(resultat.erreur).toBe('identifiants');
      expect(TestBed.inject(AuthService).estConnecte()).toBe(false);
    });

    it('traduit 403 en compte désactivé', () => {
      const resultat = connecter();
      http.expectOne('http://localhost:3000/login').flush('Compte désactivé', { status: 403, statusText: 'Forbidden' });
      expect(resultat.erreur).toBe('compte-desactive');
    });

    it('traduit une API injoignable en erreur serveur', () => {
      const resultat = connecter();
      http.expectOne('http://localhost:3000/login').error(new ProgressEvent('error'), { status: 0 });
      expect(resultat.erreur).toBe('serveur');
    });
  });

  describe('inscription, déconnexion, expiration', () => {
    it('envoie nom, e-mail et mot de passe, puis connecte le nouveau client', () => {
      const auth = service();
      auth.inscription({ nom: 'Awa Koné', email: 'awa@exemple.fr', motDePasse: 'Secret123!' }).subscribe();
      const requete = http.expectOne('http://localhost:3000/register');
      expect(requete.request.body).toEqual({ nom: 'Awa Koné', email: 'awa@exemple.fr', password: 'Secret123!' });
      requete.flush({ accessToken: jetonFactice(), user: { id: 5, nom: 'Awa Koné', email: 'awa@exemple.fr', role: 'client', actif: true } });
      expect(auth.prenom()).toBe('Awa');
    });

    it('traduit « Email already exists » en email existant', () => {
      let erreur: ErreurAuth | undefined;
      service().inscription({ nom: 'Lucas', email: 'client@boutique.fr', motDePasse: 'Secret123!' }).subscribe({ error: (e) => (erreur = e) });
      http.expectOne('http://localhost:3000/register').flush('Email already exists', { status: 400, statusText: 'Bad Request' });
      expect(erreur).toBe('email-existant');
    });

    it('déconnecte, efface le stockage et mène au catalogue', () => {
      enregistrerSession('client');
      const auth = service();
      const navigation = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      auth.deconnexion();
      expect(auth.estConnecte()).toBe(false);
      expect(localStorage.getItem(CLE_SESSION)).toBeNull();
      expect(navigation).toHaveBeenCalledWith('/catalogue');
    });

    it('expire la session en renvoyant vers la connexion avec retour', () => {
      enregistrerSession('client');
      const auth = service();
      const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      auth.expirerSession('/compte');
      expect(auth.estConnecte()).toBe(false);
      expect(navigation).toHaveBeenCalledWith(['/connexion'], { queryParams: { retour: '/compte', expire: 1 } });
    });
  });
});
