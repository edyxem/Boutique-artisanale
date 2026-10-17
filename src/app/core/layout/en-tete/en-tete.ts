import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { UiBouton, UiIcone } from '../../../shared/ui';
import { AuthService } from '../../auth/auth.service';
import { NOM_BOUTIQUE } from '../../boutique.config';
import { LienSite, NavigationSite } from '../navigation';
import { MenuMobile } from '../menu-mobile/menu-mobile';

/** Liens de la navigation principale du template, ouverts à tous. */
const LIENS_PUBLICS: LienSite[] = [
  { chemin: '/catalogue', libelle: 'Boutique' },
  { chemin: '/', libelle: 'Nos artisans', fragment: 'comment-ca-marche' },
];

function donneeEnTete(route: ActivatedRouteSnapshot): string | undefined {
  let courante: ActivatedRouteSnapshot | null = route;
  let valeur: string | undefined;
  while (courante) {
    valeur = courante.data['enTete'] ?? valeur;
    courante = courante.firstChild;
  }
  return valeur;
}

/** En-tête du template : univers à gauche, logo au centre, liens, panier et compte à droite. */
@Component({
  selector: 'app-en-tete',
  imports: [RouterLink, RouterLinkActive, UiBouton, UiIcone, MenuMobile],
  host: { '[class]': 'classesHote()' },
  template: `
    <header class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:h-18">
      <nav aria-label="Univers" class="hidden flex-1 md:block">
        <ul class="flex gap-5 text-nav">
          @for (lien of navigation.univers(); track lien.libelle) {
            <li>
              <a
                [routerLink]="lien.chemin"
                [queryParams]="lien.parametres"
                class="relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current hover:after:scale-x-100 motion-safe:after:transition-transform motion-safe:after:duration-300"
                >{{ lien.libelle }}</a
              >
            </li>
          }
        </ul>
      </nav>

      <a routerLink="/" class="shrink-0 text-logo font-medium tracking-tight" [attr.aria-label]="nomBoutique + ', accueil'">
        {{ nomBoutique }}<sup class="text-badge text-candy">®</sup>
      </a>

      <div class="flex flex-1 items-center justify-end gap-3">
        <nav aria-label="Navigation principale" class="hidden md:block">
          <ul class="flex items-center gap-4 text-nav">
            @for (lien of liens(); track lien.chemin) {
              <li>
                <a
                  [routerLink]="lien.chemin"
                  [fragment]="lien.fragment"
                  [routerLinkActiveOptions]="{ exact: lien.chemin === '/' }"
                  routerLinkActive="font-medium"
                  ariaCurrentWhenActive="page"
                  class="relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current hover:after:scale-x-100 motion-safe:after:transition-transform motion-safe:after:duration-300"
                  >{{ lien.libelle }}</a
                >
              </li>
            }
          </ul>
        </nav>
        <ng-content />
        <a routerLink="/panier" class="relative grid size-8.5 place-items-center rounded-full" aria-label="Panier">
          <ui-icone nom="sac" [taille]="20" />
        </a>
        @if (auth.estConnecte()) {
          <a uiBouton taille="petit" [variante]="superpose() ? 'clair' : 'plein'" routerLink="/compte">{{ auth.prenom() }}</a>
        } @else {
          <a uiBouton taille="petit" [variante]="superpose() ? 'clair' : 'plein'" routerLink="/connexion" [queryParams]="{ retour: urlCourante() }">
            Connexion
          </a>
        }
        <button
          type="button"
          class="grid size-8.5 cursor-pointer place-items-center rounded-full md:hidden"
          [class.text-white]="superpose()"
          aria-label="Menu"
          [attr.aria-expanded]="menuOuvert()"
          (click)="menuOuvert.set(true)"
        >
          <ui-icone nom="menu" [taille]="18" />
        </button>
      </div>
    </header>
    <app-menu-mobile [(ouvert)]="menuOuvert" [univers]="navigation.univers()" [liens]="liens()" />
  `,
})
export class EnTete {
  protected readonly navigation = inject(NavigationSite);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly nomBoutique = NOM_BOUTIQUE;
  protected readonly menuOuvert = signal(false);
  /** Liens de la navigation principale selon le rôle de l'utilisateur connecté. */
  readonly liens = computed<LienSite[]>(() => {
    const role = this.auth.role();
    return [
      ...LIENS_PUBLICS,
      ...(role === 'vendeur' ? [{ chemin: '/vendeur', libelle: 'Espace vendeur' }] : []),
      ...(role === 'admin' ? [{ chemin: '/admin', libelle: 'Admin' }] : []),
    ];
  });

  /** URL courante, conservée comme page de retour par le bouton « Connexion ». */
  protected readonly urlCourante = toSignal(
    this.router.events.pipe(
      filter((evenement) => evenement instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private readonly modeRoute = toSignal(
    this.router.events.pipe(
      filter((evenement) => evenement instanceof NavigationEnd),
      map(() => donneeEnTete(this.router.routerState.snapshot.root)),
    ),
    { initialValue: undefined },
  );

  /** Sur l'accueil, l'en-tête se superpose au hero tant que celui-ci est visible. */
  readonly superpose = computed(() => this.modeRoute() === 'superpose' && this.navigation.heroVisible());

  protected readonly classesHote = computed(() => {
    if (this.superpose()) {
      return 'fixed inset-x-0 top-0 z-40 block border-b border-transparent bg-transparent text-white motion-safe:transition-colors motion-safe:duration-300';
    }
    if (this.modeRoute() === 'superpose') {
      return 'fixed inset-x-0 top-0 z-40 block border-b border-line bg-bg text-ink motion-safe:transition-colors motion-safe:duration-300';
    }
    return 'sticky top-0 z-40 block border-b border-line bg-bg text-ink motion-safe:transition-colors motion-safe:duration-300';
  });
}
