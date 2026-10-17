import { Component } from '@angular/core';
import { UiBouton } from './bouton';
import { UiIcone } from './icone';
import { SurfaceDialogue } from './surface';

/** Fenêtre modale du template (arrondi 28 px, largeur max. 940 px, voile). */
@Component({
  selector: 'ui-modale',
  imports: [UiBouton, UiIcone],
  template: `
    <dialog
      #dialogue
      class="m-auto w-11/12 max-w-modale overflow-auto rounded-bloc bg-bg p-0 text-ink backdrop:bg-voile open:motion-safe:animate-entree open:backdrop:motion-safe:animate-fondu data-fermeture:motion-safe:animate-sortie data-fermeture:backdrop:motion-safe:animate-fondu-sortie"
      [attr.aria-labelledby]="idTitre"
      [attr.data-fermeture]="fermeture() ? '' : null"
      (cancel)="surAnnulation($event)"
      (click)="surClic($event)"
      (animationend)="surFinAnimation()"
      (close)="fermer()"
    >
      <div class="flex flex-col gap-5 p-5 md:p-8">
        <div class="flex items-start justify-between gap-4">
          <h2 [id]="idTitre" class="text-h3 md:text-h2">{{ titre() }}</h2>
          <button uiBouton variante="icone" type="button" aria-label="Fermer" (click)="fermer()">
            <ui-icone nom="croix" [taille]="16" />
          </button>
        </div>
        <ng-content />
      </div>
    </dialog>
  `,
})
export class UiModale extends SurfaceDialogue {}
