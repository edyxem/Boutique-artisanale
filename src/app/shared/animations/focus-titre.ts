import { Injector, Service, afterNextRender, inject } from '@angular/core';
import { NavigationEnd, Router, ViewTransitionInfo } from '@angular/router';
import { filter, skip } from 'rxjs';
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
    this.router.events
      .pipe(
        filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
        skip(1),
      )
      .subscribe((evenement) => {
        if (evenement.urlAfterRedirects.includes('#')) {
          return; // une ancre gère son propre défilement et son focus
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

/** Rappel de `withViewTransitions` : la transition est ignorée quand le mouvement est réduit. */
export function ignorerTransitionSiMouvementReduit({ transition }: ViewTransitionInfo): void {
  if (inject(PreferencesMouvement).reduit()) {
    transition.skipTransition();
  }
}
