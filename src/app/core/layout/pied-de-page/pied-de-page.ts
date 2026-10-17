import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NOM_BOUTIQUE } from '../../boutique.config';
import { NavigationSite } from '../navigation';

/** Pied de page du template : bloc `--soft` arrondi en haut, colonnes Boutique et Aide. */
@Component({
  selector: 'app-pied-de-page',
  imports: [RouterLink],
  host: { class: 'block px-4 pt-14' },
  template: `
    <footer class="mx-auto max-w-7xl rounded-t-bloc bg-soft px-6 pt-10 pb-6 text-ink md:px-12">
      <div class="flex flex-col gap-10 md:flex-row md:justify-between">
        <div class="flex max-w-sm flex-col gap-3">
          <p class="text-logo font-medium tracking-tight">{{ nomBoutique }}<sup class="text-badge text-candy">®</sup></p>
          <p class="text-muted">La boutique des artisans indépendants. Objets faits main pour la maison, la table et le quotidien.</p>
        </div>
        <div class="grid grid-cols-2 gap-8 md:w-1/2">
          <nav aria-labelledby="pied-boutique" class="flex flex-col gap-3">
            <h2 id="pied-boutique" class="text-base font-medium tracking-normal">Boutique</h2>
            <ul class="flex flex-col gap-2 text-muted">
              @for (lien of navigation.univers(); track lien.libelle) {
                <li>
                  <a [routerLink]="lien.chemin" [queryParams]="lien.parametres" class="hover:text-ink">{{ lien.libelle }}</a>
                </li>
              }
            </ul>
          </nav>
          <nav aria-labelledby="pied-aide" class="flex flex-col gap-3">
            <h2 id="pied-aide" class="text-base font-medium tracking-normal">Aide</h2>
            <ul class="flex flex-col gap-2 text-muted">
              <li><a routerLink="/" fragment="comment-ca-marche" class="hover:text-ink">Livraison et retours</a></li>
              <li><a routerLink="/devenir-vendeur" class="hover:text-ink">Devenir artisan</a></li>
              <li><a href="mailto:bonjour@flowering.fr" class="hover:text-ink">Contact : bonjour&#64;flowering.fr</a></li>
            </ul>
          </nav>
        </div>
      </div>
      <div class="mt-10 flex justify-between gap-4 border-t border-line pt-5 text-sm text-muted">
        <p>© 2026 {{ nomBoutique }}</p>
        <p>Photos : Unsplash</p>
      </div>
    </footer>
  `,
})
export class PiedDePage {
  protected readonly navigation = inject(NavigationSite);
  protected readonly nomBoutique = NOM_BOUTIQUE;
}
