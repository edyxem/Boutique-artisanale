import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_URL } from '../api.config';
import { ErreurAuth, ReponseAuth, Session, UtilisateurConnecte } from './session.model';

export const CLE_SESSION = 'flowering.session';

/** Date d'expiration (ms) contenue dans un jeton JWT, ou null s'il est illisible. */
export function expirationJeton(jeton: string): number | null {
  try {
    const charge = jeton.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(charge)) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function effacerSession(): void {
  try {
    localStorage.removeItem(CLE_SESSION);
  } catch {
    /* stockage indisponible */
  }
}

/** Lit la session enregistrée ; une session illisible ou expirée est effacée. */
export function lireSession(): Session | null {
  let session: Session | null = null;
  try {
    const brut = localStorage.getItem(CLE_SESSION);
    session = brut ? (JSON.parse(brut) as Session) : null;
  } catch {
    session = null;
  }
  const expiration = session?.jeton ? expirationJeton(session.jeton) : null;
  if (!session?.utilisateur || expiration === null || expiration <= Date.now()) {
    effacerSession();
    return null;
  }
  return session;
}

function traduireErreur(erreur: unknown, inscription: boolean): ErreurAuth {
  if (!(erreur instanceof HttpErrorResponse) || erreur.status === 0 || erreur.status >= 500) {
    return 'serveur';
  }
  if (erreur.status === 403) {
    return 'compte-desactive';
  }
  if (erreur.status === 400) {
    return inscription ? (erreur.error === 'Email already exists' ? 'email-existant' : 'serveur') : 'identifiants';
  }
  return 'serveur';
}

/** État d'authentification de l'application, en signals. */
@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  private readonly router = inject(Router);

  readonly #session = signal<Session | null>(lireSession());

  readonly utilisateurConnecte = computed(() => this.#session()?.utilisateur ?? null);
  readonly estConnecte = computed(() => this.#session() !== null);
  readonly role = computed(() => this.utilisateurConnecte()?.role ?? null);
  readonly prenom = computed(() => this.utilisateurConnecte()?.nom.trim().split(/\s+/)[0] ?? '');
  readonly jeton = computed(() => this.#session()?.jeton ?? null);

  connexion(email: string, motDePasse: string): Observable<UtilisateurConnecte> {
    return this.authentifier('/login', { email, password: motDePasse }, false);
  }

  inscription(donnees: { nom: string; email: string; motDePasse: string }): Observable<UtilisateurConnecte> {
    const { nom, email, motDePasse } = donnees;
    return this.authentifier('/register', { nom, email, password: motDePasse }, true);
  }

  deconnexion(): void {
    this.fermerSession();
    void this.router.navigateByUrl('/catalogue');
  }

  /** Session refusée par l'API : retour à la connexion, puis à la page courante. */
  expirerSession(url: string): void {
    this.fermerSession();
    void this.router.navigate(['/connexion'], { queryParams: { retour: url, expire: 1 } });
  }

  private authentifier(chemin: string, corps: object, inscription: boolean): Observable<UtilisateurConnecte> {
    return this.http.post<ReponseAuth>(this.api + chemin, corps).pipe(
      map(({ accessToken, user }) => {
        const session: Session = { jeton: accessToken, utilisateur: user };
        this.#session.set(session);
        try {
          localStorage.setItem(CLE_SESSION, JSON.stringify(session));
        } catch {
          /* stockage indisponible : la session reste en mémoire */
        }
        return user;
      }),
      catchError((erreur: unknown) => throwError(() => traduireErreur(erreur, inscription))),
    );
  }

  private fermerSession(): void {
    this.#session.set(null);
    effacerSession();
  }
}
