import { Component, signal } from '@angular/core';
import { UiBouton } from './bouton';
import { UiIcone } from './icone';
import { SurfaceDialogue } from './surface';

/** Distance de glissement (px) au-delà de laquelle le tiroir se ferme. */
export const SEUIL_GLISSEMENT = 80;

/** Tiroir latéral du template (panier) : glisse depuis la droite, se ferme aussi d'un glissement tactile. */
@Component({
  selector: 'ui-tiroir',
  imports: [UiBouton, UiIcone],
  template: `
    <dialog
      #dialogue
      class="my-0 mr-0 ml-auto h-dvh max-h-dvh w-full overflow-hidden bg-bg p-0 text-ink backdrop:bg-voile sm:max-w-tiroir sm:rounded-l-bloc open:motion-safe:animate-entree-droite open:backdrop:motion-safe:animate-fondu data-fermeture:motion-safe:animate-sortie-droite data-fermeture:backdrop:motion-safe:animate-fondu-sortie"
      [attr.aria-labelledby]="idTitre"
      [attr.data-fermeture]="fermeture() ? '' : null"
      [style.translate]="decalage() ? decalage() + 'px 0' : null"
      (cancel)="surAnnulation($event)"
      (click)="surClic($event)"
      (animationend)="surFinAnimation()"
      (close)="fermer()"
      (pointerdown)="debutGlissement($event)"
      (pointermove)="glissement($event)"
      (pointerup)="finGlissement()"
      (pointercancel)="finGlissement()"
    >
      <div class="flex h-full flex-col gap-4 p-5 md:p-6">
        <header class="flex items-center justify-between gap-4">
          <h2 [id]="idTitre">{{ titre() }}</h2>
          <button uiBouton variante="icone" type="button" aria-label="Fermer" (click)="fermer()">
            <ui-icone nom="croix" [taille]="16" />
          </button>
        </header>
        <ng-content />
      </div>
    </dialog>
  `,
})
export class UiTiroir extends SurfaceDialogue {
  protected readonly decalage = signal(0);
  private depart: number | null = null;

  debutGlissement(evenement: Pick<PointerEvent, 'pointerType' | 'clientX'>): void {
    if (evenement.pointerType === 'touch' || evenement.pointerType === 'pen') {
      this.depart = evenement.clientX;
    }
  }

  glissement(evenement: Pick<PointerEvent, 'clientX'>): void {
    if (this.depart !== null) {
      this.decalage.set(Math.max(0, evenement.clientX - this.depart));
    }
  }

  finGlissement(): void {
    if (this.depart === null) {
      return;
    }
    const distance = this.decalage();
    this.depart = null;
    this.decalage.set(0);
    if (distance > SEUIL_GLISSEMENT) {
      this.fermer();
    }
  }
}
