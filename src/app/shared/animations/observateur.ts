import { Service } from '@angular/core';

/**
 * Un seul `IntersectionObserver` partagé par les directives d'apparition et de compteur.
 * Chaque élément est observé jusqu'à sa première entrée dans l'écran.
 */
@Service()
export class ObservateurVisibilite {
  private readonly rappels = new Map<Element, () => void>();
  private readonly observateur =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entrees) => this.surIntersection(entrees), { threshold: 0.15 });

  /** Appelle `rappel` une seule fois, quand l'élément devient visible (immédiatement sans IntersectionObserver). */
  observer(element: Element, rappel: () => void): void {
    if (!this.observateur) {
      rappel();
      return;
    }
    this.rappels.set(element, rappel);
    this.observateur.observe(element);
  }

  oublier(element: Element): void {
    this.rappels.delete(element);
    this.observateur?.unobserve(element);
  }

  private surIntersection(entrees: IntersectionObserverEntry[]): void {
    for (const entree of entrees) {
      if (!entree.isIntersecting) {
        continue;
      }
      const rappel = this.rappels.get(entree.target);
      this.oublier(entree.target);
      rappel?.();
    }
  }
}
