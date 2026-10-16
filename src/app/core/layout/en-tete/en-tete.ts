import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NOM_BOUTIQUE } from '../../boutique.config';

interface LienNavigation {
  chemin: string;
  libelle: string;
}

@Component({
  selector: 'app-en-tete',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="border-b border-stone-200 bg-white">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <a
          routerLink="/"
          class="text-2xl font-bold tracking-widest text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          {{ nomBoutique }}
        </a>
        <nav aria-label="Navigation principale">
          <ul class="flex flex-wrap gap-x-4 gap-y-2">
            @for (lien of liens; track lien.chemin) {
              <li>
                <a
                  [routerLink]="lien.chemin"
                  routerLinkActive="actif"
                  ariaCurrentWhenActive="page"
                  class="rounded px-1 text-stone-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 [&.actif]:font-semibold [&.actif]:text-emerald-800 [&.actif]:underline"
                >
                  {{ lien.libelle }}
                </a>
              </li>
            }
          </ul>
        </nav>
      </div>
    </header>
  `,
})
export class EnTete {
  protected readonly nomBoutique = NOM_BOUTIQUE;
  protected readonly liens: readonly LienNavigation[] = [
    { chemin: '/catalogue', libelle: 'Catalogue' },
    { chemin: '/panier', libelle: 'Panier' },
    { chemin: '/commande', libelle: 'Commande' },
    { chemin: '/compte', libelle: 'Mon compte' },
    { chemin: '/vendeur', libelle: 'Espace vendeur' },
    { chemin: '/admin', libelle: 'Administration' },
  ];
}
