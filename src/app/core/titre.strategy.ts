import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { NOM_BOUTIQUE } from './boutique.config';

/** Compose le titre du document : « {titre de la route} | Flowering ». */
@Injectable()
export class TitreStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(etat: RouterStateSnapshot): void {
    const titre = this.buildTitle(etat);
    this.title.setTitle(titre ? `${titre} | ${NOM_BOUTIQUE}` : NOM_BOUTIQUE);
  }
}
