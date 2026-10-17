import { NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, computed, inject, isDevMode, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { retourSur } from '../../core/auth/auth.guards';
import { AuthService } from '../../core/auth/auth.service';
import { ErreurAuth, MESSAGES_ERREUR_AUTH } from '../../core/auth/session.model';
import { NotificationService, Onglet, UiBouton, UiChamp, UiFormulaire, UiOnglets, UiSaisie } from '../../shared/ui';

type CleOnglet = 'connexion' | 'inscription';

const ONGLETS: Onglet[] = [
  { cle: 'connexion', libelle: 'Connexion', panneau: 'panneau-auth' },
  { cle: 'inscription', libelle: 'Créer un compte', panneau: 'panneau-auth' },
];

const ENTETES: Record<CleOnglet, { titre: string; texte: string }> = {
  connexion: { titre: 'Bon retour', texte: 'Connectez-vous pour retrouver vos commandes.' },
  inscription: { titre: 'Créer un compte', texte: 'Commandez et suivez vos livraisons en un clic.' },
};

/** La confirmation doit être identique au mot de passe du même formulaire. */
function identiqueAuMotDePasse(controle: AbstractControl): ValidationErrors | null {
  const motDePasse = controle.parent?.get('motDePasse')?.value;
  return controle.value && motDePasse !== undefined && controle.value !== motDePasse ? { differents: true } : null;
}

/** Page d'authentification du template : photo, panneau et onglets Connexion / Créer un compte. */
@Component({
  selector: 'app-auth-page',
  imports: [NgOptimizedImage, ReactiveFormsModule, UiBouton, UiChamp, UiFormulaire, UiOnglets, UiSaisie],
  template: `
    <div class="mx-auto grid max-w-7xl gap-3.5 px-4 py-4 md:grid-cols-2">
      <div class="relative flex aspect-photo items-end overflow-hidden rounded-bloc bg-line md:aspect-auto md:min-h-160">
        <img ngSrc="/images/etape-1-atelier.jpg" fill priority sizes="(min-width: 820px) 50vw, 100vw" alt="" class="object-cover" />
        <div class="absolute inset-0 bg-linear-to-t from-voile-fort via-voile-leger to-transparent"></div>
        <div class="relative flex flex-col gap-2 p-6 text-white md:p-8">
          <p class="text-eyebrow">Espace client</p>
          <p class="max-w-lg text-h2 leading-titre">Suivez vos commandes, de l'atelier à votre porte.</p>
        </div>
      </div>

      <div class="flex justify-center rounded-bloc bg-soft px-6 py-8 md:items-center md:px-10">
        <div class="flex w-full max-w-sm flex-col gap-6">
          <div class="flex flex-col gap-2">
            <h1 class="text-h2">{{ entete().titre }}</h1>
            <p class="text-muted">{{ entete().texte }}</p>
          </div>
          @if (information(); as texte) {
            <p role="status" class="rounded-champ bg-mint px-4 py-3 text-sm text-ink">{{ texte }}</p>
          }
          <ui-onglets libelle="Connexion ou création de compte" [onglets]="onglets" [selection]="onglet()" (selectionChange)="changerOnglet($event)" />

          <div id="panneau-auth" role="tabpanel" [attr.aria-labelledby]="'onglet-' + onglet()" class="motion-safe:animate-entree">
            @if (onglet() === 'connexion') {
              <form uiFormulaire [formGroup]="connexion" (ngSubmit)="seConnecter()" class="flex flex-col gap-4">
                <ui-champ libelle="E-mail" [controle]="connexion.controls.email">
                  <input uiSaisie type="email" formControlName="email" autocomplete="email" />
                </ui-champ>
                <ui-champ libelle="Mot de passe" [controle]="connexion.controls.motDePasse">
                  <input uiSaisie type="password" formControlName="motDePasse" autocomplete="current-password" />
                </ui-champ>
                <button uiBouton type="submit" class="mt-4 w-full" [chargement]="envoi()">Se connecter</button>
              </form>
            } @else {
              <form uiFormulaire [formGroup]="inscription" (ngSubmit)="sInscrire()" class="flex flex-col gap-4">
                <ui-champ libelle="Prénom et nom" [controle]="inscription.controls.nom" [messages]="messagesNom">
                  <input uiSaisie type="text" formControlName="nom" autocomplete="name" />
                </ui-champ>
                <ui-champ libelle="E-mail" [controle]="inscription.controls.email">
                  <input uiSaisie type="email" formControlName="email" autocomplete="email" />
                </ui-champ>
                <ui-champ libelle="Mot de passe" [controle]="inscription.controls.motDePasse" [messages]="messagesMotDePasse">
                  <input uiSaisie type="password" formControlName="motDePasse" autocomplete="new-password" />
                </ui-champ>
                <ui-champ libelle="Confirmation" [controle]="inscription.controls.confirmation" [messages]="messagesConfirmation">
                  <input uiSaisie type="password" formControlName="confirmation" autocomplete="new-password" />
                </ui-champ>
                <button uiBouton type="submit" class="mt-4 w-full" [chargement]="envoi()">Créer mon compte</button>
              </form>
            }
            @if (erreur(); as texte) {
              <p role="alert" class="mt-4 text-sm text-bad motion-safe:animate-entree">{{ texte }}</p>
            }
          </div>

          @if (demonstration) {
            <div class="flex flex-col gap-2 border-t border-line pt-5 text-sm">
              <p class="text-muted">Comptes de démonstration</p>
              <p>Admin · <code>admin&#64;boutique.fr</code> / <code>Admin123!</code></p>
              <p>Client · <code>client&#64;boutique.fr</code> / <code>Client123!</code></p>
              <p>Vendeur · <code>vendeur1&#64;boutique.fr</code> / <code>Vendeur123!</code></p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly destruction = inject(DestroyRef);
  private readonly formulaires = inject(NonNullableFormBuilder);

  protected readonly onglets = ONGLETS;
  protected readonly demonstration = isDevMode();
  protected readonly onglet = signal<CleOnglet>(this.route.snapshot.data['onglet'] === 'inscription' ? 'inscription' : 'connexion');
  protected readonly entete = computed(() => ENTETES[this.onglet()]);
  protected readonly envoi = signal(false);
  protected readonly erreur = signal<string | null>(null);

  private readonly parametres = toSignal(this.route.queryParamMap.pipe(map((p) => ({ retour: p.get('retour'), expire: p.has('expire') }))), {
    initialValue: { retour: null, expire: false },
  });
  /** Arrivée depuis une page protégée : motif transmis par le guard dans l'état de navigation. */
  private readonly accesProtege = !!(
    this.router.currentNavigation()?.extras.state?.['accesProtege'] ?? (history.state as { accesProtege?: boolean } | null)?.accesProtege
  );

  /** Message affiché au-dessus des onglets : session expirée ou page protégée. */
  protected readonly information = computed(() => {
    if (this.parametres().expire) {
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    }
    return this.accesProtege && this.parametres().retour ? 'Connectez-vous pour accéder à cette page.' : null;
  });

  protected readonly messagesNom = { minlength: 'Le nom doit contenir au moins 2 caractères.' };
  protected readonly messagesMotDePasse = { minlength: 'Le mot de passe doit contenir au moins 6 caractères.' };
  protected readonly messagesConfirmation = { differents: 'Les mots de passe ne correspondent pas.' };

  protected readonly connexion = this.formulaires.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required],
  });

  protected readonly inscription = this.formulaires.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required, Validators.minLength(6)]],
    confirmation: ['', [Validators.required, identiqueAuMotDePasse]],
  });

  constructor() {
    const abonnement = this.inscription.controls.motDePasse.valueChanges.subscribe(() =>
      this.inscription.controls.confirmation.updateValueAndValidity(),
    );
    this.destruction.onDestroy(() => abonnement.unsubscribe());
  }

  /** Change d'onglet et d'URL (/connexion ↔ /inscription) en conservant la page de retour. */
  protected changerOnglet(cle: string): void {
    this.erreur.set(null);
    void this.router.navigate([cle === 'inscription' ? '/inscription' : '/connexion'], {
      queryParams: { retour: this.parametres().retour },
      replaceUrl: true,
    });
  }

  protected seConnecter(): void {
    if (this.connexion.invalid || this.envoi()) {
      return;
    }
    const { email, motDePasse } = this.connexion.getRawValue();
    this.envoyer(this.auth.connexion(email, motDePasse), () => this.connexion.controls.motDePasse.reset());
  }

  protected sInscrire(): void {
    if (this.inscription.invalid || this.envoi()) {
      return;
    }
    const { nom, email, motDePasse } = this.inscription.getRawValue();
    this.envoyer(this.auth.inscription({ nom: nom.trim(), email, motDePasse }), () => undefined, (utilisateur) =>
      this.notifications.succes(`Bienvenue ${utilisateur.nom}, votre compte a été créé.`),
    );
  }

  private envoyer<T>(requete: Observable<T>, siErreur: () => void, siSucces?: (valeur: T) => void): void {
    this.erreur.set(null);
    this.envoi.set(true);
    requete.subscribe({
      next: (valeur) => {
        this.envoi.set(false);
        siSucces?.(valeur);
        void this.router.navigateByUrl(retourSur(this.parametres().retour));
      },
      error: (erreur: ErreurAuth) => {
        this.envoi.set(false);
        this.erreur.set(MESSAGES_ERREUR_AUTH[erreur] ?? MESSAGES_ERREUR_AUTH.serveur);
        siErreur();
      },
    });
  }
}
