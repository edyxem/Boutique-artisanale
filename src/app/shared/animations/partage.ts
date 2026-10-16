import { Directive, input } from '@angular/core';

/**
 * Marque un élément partagé entre deux pages (ex. photo d'une carte puis de la fiche) :
 * pendant la transition de vue, il se déplace et se redimensionne au lieu de disparaître.
 */
@Directive({
  selector: '[uiPartage]',
  host: { '[style.view-transition-name]': 'nom()' },
})
export class UiPartage {
  readonly nom = input.required<string>({ alias: 'uiPartage' });
}
