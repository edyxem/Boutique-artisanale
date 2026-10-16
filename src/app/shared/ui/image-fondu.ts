import { Directive, signal } from '@angular/core';

/**
 * Fondu d'apparition d'une image à son chargement. Le conteneur porte le fond `bg-line`
 * et un ratio fixe (`aspect-square`, `aspect-photo`, `aspect-portrait`) : aucun décalage de mise en page.
 */
@Directive({
  selector: 'img[uiImageFondu]',
  host: {
    '(load)': 'chargee.set(true)',
    '[class]': 'chargee() ? classesVisible : classesMasquee',
  },
})
export class UiImageFondu {
  readonly chargee = signal(false);

  protected readonly classesMasquee = 'motion-safe:opacity-0 motion-safe:transition-opacity motion-safe:duration-300';
  protected readonly classesVisible = 'opacity-100 motion-safe:transition-opacity motion-safe:duration-300';
}
