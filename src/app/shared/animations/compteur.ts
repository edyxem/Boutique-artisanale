import { DestroyRef, Directive, ElementRef, afterNextRender, effect, inject, input } from '@angular/core';
import { PreferencesMouvement } from './mouvement-reduit';
import { ObservateurVisibilite } from './observateur';

export const DUREE_COMPTEUR = 300;

const FORMATS = {
  nombre: new Intl.NumberFormat('fr-FR'),
  euro: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
};

/**
 * Compteur animé : défile de 0 à `valeur` en 300 ms la première fois qu'il devient visible.
 * Le nom accessible porte la valeur finale dès l'affichage.
 */
@Directive({
  selector: '[uiCompteur]',
  host: { '[attr.aria-label]': 'texte(valeur())' },
})
export class UiCompteur {
  readonly valeur = input.required<number>();
  readonly format = input<keyof typeof FORMATS>('nombre');

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly mouvement = inject(PreferencesMouvement);
  private visible = false;
  private animationFaite = false;
  private image = 0;

  constructor() {
    const observateur = inject(ObservateurVisibilite);
    // L'observation commence après le premier rendu, quand la valeur d'entrée est connue.
    afterNextRender(() =>
      observateur.observer(this.element, () => {
        this.visible = true;
        this.afficher();
      }),
    );
    effect(() => {
      this.valeur();
      this.afficher();
    });
    inject(DestroyRef).onDestroy(() => {
      observateur.oublier(this.element);
      cancelAnimationFrame(this.image);
    });
  }

  texte(nombre: number): string {
    return FORMATS[this.format()].format(nombre);
  }

  private afficher(): void {
    const cible = this.valeur();
    if (!this.visible || this.animationFaite || this.mouvement.reduit() || typeof requestAnimationFrame === 'undefined') {
      this.element.textContent = this.texte(cible);
      return;
    }
    this.animationFaite = true;
    const debut = performance.now();
    const pas = (maintenant: number) => {
      const progression = Math.min(1, (maintenant - debut) / DUREE_COMPTEUR);
      const adouci = 1 - Math.pow(1 - progression, 3);
      this.element.textContent = this.texte(Math.round(cible * adouci));
      if (progression < 1) {
        this.image = requestAnimationFrame(pas);
      }
    };
    this.element.textContent = this.texte(0);
    this.image = requestAnimationFrame(pas);
  }
}
