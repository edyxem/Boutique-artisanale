import { Injector, Service, afterNextRender, inject } from '@angular/core';
import { NavigationEnd, Router, ViewTransitionInfo } from '@angular/router';
import { filter } from 'rxjs';
import { PreferencesMouvement } from './mouvement-reduit';

/**
 * Après chaque navigation (hors première page), place le focus sur le titre principal
 * de la nouvelle page pour que les technologies d'assistance l'annoncent.
 */
@Service()
export class FocusTitre {
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  demarrer(): void {
    let cheminPrecedent = '';
    this.router.events
      .pipe(filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd))
      .subscribe((evenement) => {
        const chemin = evenement.urlAfterRedirects.split(/[?#]/)[0];
        const premiere = cheminPrecedent === '';
        const memePage = chemin === cheminPrecedent;
        cheminPrecedent = chemin;
        // Première page, simple changement de filtres (même chemin) ou ancre : le focus ne bouge pas.
        if (premiere || memePage || evenement.urlAfterRedirects.includes('#')) {
          return;
        }
        afterNextRender(() => this.focaliserTitre(), { injector: this.injector });
      });
  }

  focaliserTitre(): void {
    const titre = document.querySelector<HTMLElement>('main h1');
    if (!titre) {
      return;
    }
    if (!titre.hasAttribute('tabindex')) {
      titre.setAttribute('tabindex', '-1');
    }
    titre.focus({ preventScroll: true });
  }
}

/**
 * Rappel de `withViewTransitions` : la transition est ignorée quand le mouvement est réduit,
 * ou quand la navigation le demande (`state: { sansTransition: true }`, ex. saisie d'une recherche).
 */
export function ignorerTransitionSiMouvementReduit({ transition }: ViewTransitionInfo): void {
  const demandee = inject(Router).currentNavigation()?.extras.state?.['sansTransition'] === true;
  if (demandee || inject(PreferencesMouvement).reduit()) {
    transition.skipTransition();
  }
}
