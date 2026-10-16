import { Directive, ElementRef, effect, inject, input, model, signal, viewChild } from '@angular/core';
import { PreferencesMouvement } from '../animations/mouvement-reduit';

let compteur = 0;

/**
 * Comportement commun de la modale et du tiroir, construits sur `<dialog>` :
 * focus piégé et touche Échap gérés par le navigateur, fermeture au clic sur le voile,
 * animation de sortie jouée avant `close()`, focus rendu à l'élément d'origine.
 */
@Directive()
export abstract class SurfaceDialogue {
  readonly ouverte = model(false);
  readonly titre = input.required<string>();

  protected readonly idTitre = `surface-titre-${++compteur}`;
  protected readonly fermeture = signal(false);
  protected readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  private readonly mouvement = inject(PreferencesMouvement);
  private origine: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const element = this.dialogue().nativeElement;
      if (this.ouverte() && !element.open) {
        this.ouvrir(element);
      } else if (!this.ouverte() && element.open && !this.fermeture()) {
        this.fermerAnime(element);
      }
    });
  }

  fermer(): void {
    this.ouverte.set(false);
  }

  /** Touche Échap : on joue l'animation de sortie au lieu de la fermeture immédiate. */
  protected surAnnulation(evenement: Event): void {
    evenement.preventDefault();
    this.fermer();
  }

  /** Un clic sur le `<dialog>` lui-même (et non sur son contenu) est un clic sur le voile. */
  protected surClic(evenement: MouseEvent): void {
    if (evenement.target === this.dialogue().nativeElement) {
      this.fermer();
    }
  }

  protected surFinAnimation(): void {
    if (this.fermeture()) {
      this.terminerFermeture(this.dialogue().nativeElement);
    }
  }

  private ouvrir(element: HTMLDialogElement): void {
    this.origine = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.fermeture.set(false);
    if (typeof element.showModal === 'function') {
      element.showModal();
    } else {
      element.setAttribute('open', '');
    }
  }

  private fermerAnime(element: HTMLDialogElement): void {
    if (this.mouvement.reduit()) {
      this.terminerFermeture(element);
      return;
    }
    this.fermeture.set(true);
    // Filet de sécurité si l'événement de fin d'animation n'arrive pas.
    setTimeout(() => this.terminerFermeture(element), 320);
  }

  private terminerFermeture(element: HTMLDialogElement): void {
    if (!element.open) {
      return;
    }
    this.fermeture.set(false);
    if (typeof element.close === 'function') {
      element.close();
    } else {
      element.removeAttribute('open');
    }
    this.origine?.focus();
    this.origine = null;
  }
}
