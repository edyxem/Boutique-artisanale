import { Injectable, signal } from '@angular/core';

/**
 * Fourni par une page de liste (`providers`) : la modale d'édition, affichée dans le `router-outlet`
 * de la liste, demande le rechargement de celle-ci après un enregistrement.
 */
@Injectable()
export class RechargementListe {
  readonly version = signal(0);

  recharger(): void {
    this.version.update((v) => v + 1);
  }
}
