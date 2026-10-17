import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export interface EntreePanneau {
  libelle: string;
  chemin: string;
}

/**
 * Mise en page « panneau » de l'administration du template : menu latéral vert forêt collant,
 * qui devient une barre horizontale défilante sous 820 px ; les pages s'affichent à droite.
 */
@Component({
  selector: 'app-panneau',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="mx-auto flex max-w-7xl flex-col gap-3.5 px-4 py-4 md:flex-row md:items-start">
      <nav
        [attr.aria-label]="libelleMenu()"
        class="rounded-carte bg-forest p-3 text-forest-ink md:sticky md:top-22 md:w-56 md:shrink-0"
      >
        <p class="hidden px-3 pt-2 pb-3 text-sm opacity-80 md:block">{{ titre() }}</p>
        <ul class="flex gap-1 overflow-x-auto md:flex-col">
          @for (entree of entrees(); track entree.chemin) {
            <li class="shrink-0">
              <a
                [routerLink]="entree.chemin"
                routerLinkActive="bg-forest-ink/15"
                ariaCurrentWhenActive="page"
                class="block rounded-ligne px-3 py-2.5 whitespace-nowrap hover:bg-forest-ink/10 motion-safe:transition-colors motion-safe:duration-300"
                >{{ entree.libelle }}</a
              >
            </li>
          }
        </ul>
      </nav>
      <div class="min-w-0 flex-1">
        <router-outlet />
      </div>
    </div>
  `,
})
export class Panneau {
  readonly titre = input.required<string>();
  readonly libelleMenu = input.required<string>();
  readonly entrees = input.required<EntreePanneau[]>();
}

/** En-tête d'une page de panneau : sur-titre, titre principal et action (« Nouveau produit »…). */
@Component({
  selector: 'app-entete-panneau',
  host: { class: 'flex flex-col gap-3 pt-2 pb-5 sm:flex-row sm:items-end sm:justify-between' },
  template: `
    <div class="flex flex-col gap-1">
      <p class="text-eyebrow text-muted">{{ surTitre() }}</p>
      <h1 class="text-h2">{{ titre() }}</h1>
    </div>
    <ng-content />
  `,
})
export class EntetePanneau {
  readonly surTitre = input.required<string>();
  readonly titre = input.required<string>();
}
