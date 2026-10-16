import { Service, signal } from '@angular/core';

const REQUETE = '(prefers-reduced-motion: reduce)';

/** Préférence de l'utilisateur pour la réduction des animations, sous forme de signal. */
@Service()
export class PreferencesMouvement {
  private readonly etat = signal(false);
  readonly reduit = this.etat.asReadonly();

  constructor() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const requete = window.matchMedia(REQUETE);
    this.etat.set(requete.matches);
    requete.addEventListener?.('change', (evenement) => this.etat.set(evenement.matches));
  }
}
