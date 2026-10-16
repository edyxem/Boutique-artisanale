import { Directive, ElementRef, Injector, afterNextRender, inject } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';

/** Classe du tremblement posée une fois sur le bouton d'envoi d'un formulaire invalide. */
export const CLASSE_TREMBLEMENT = 'motion-safe:animate-tremble';

/**
 * Retours visuels d'un formulaire réactif soumis invalide : tous les champs passent « touchés »
 * (leurs messages d'erreur apparaissent), le focus va sur le premier champ invalide
 * et le bouton d'envoi tremble une fois.
 */
@Directive({
  selector: 'form[uiFormulaire][formGroup]',
  host: { '(submit)': 'surSoumission()', novalidate: '' },
})
export class UiFormulaire {
  private readonly groupe = inject(FormGroupDirective);
  private readonly element = inject<ElementRef<HTMLFormElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  surSoumission(): void {
    const formulaire = this.groupe.form;
    if (formulaire.valid) {
      return;
    }
    formulaire.markAllAsTouched();
    this.trembler();
    afterNextRender(() => this.element.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), {
      injector: this.injector,
    });
  }

  private trembler(): void {
    const bouton = this.element.querySelector<HTMLElement>('button[type="submit"]');
    if (!bouton) {
      return;
    }
    bouton.classList.remove(CLASSE_TREMBLEMENT);
    void bouton.offsetWidth; // relance l'animation si elle vient d'être jouée
    bouton.classList.add(CLASSE_TREMBLEMENT);
    bouton.addEventListener('animationend', () => bouton.classList.remove(CLASSE_TREMBLEMENT), { once: true });
  }
}
