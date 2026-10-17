import { NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationSite } from '../../core/layout/navigation';
import { UiBouton, UiIcone } from '../../shared/ui';

/** Hero du template ; tant qu'il est sous l'en-tête, celui-ci reste superposé (transparent, texte blanc). */
@Component({
  selector: 'app-hero-accueil',
  imports: [NgOptimizedImage, RouterLink, UiBouton, UiIcone],
  template: `
    <div #hero class="relative flex min-h-hero flex-col justify-end overflow-hidden rounded-bloc bg-line text-white">
      <img ngSrc="/images/hero-accueil.jpg" alt="Une céramiste sourit dans son atelier" fill priority sizes="100vw" class="object-cover" />
      <div class="absolute inset-0 bg-linear-to-b from-voile-leger via-transparent to-voile-fort"></div>
      <div class="relative flex flex-col gap-6 px-5 pt-28 pb-8 md:px-12 md:pb-12">
        <p class="flex items-center gap-2 text-sm motion-safe:animate-entree">
          <span class="flex" aria-hidden="true">
            @for (etoile of etoiles; track etoile) {
              <ui-icone nom="etoile" [taille]="14" />
            }
          </span>
          <span><span class="sr-only">Note de </span>4,9 · <span class="underline underline-offset-4">d'après 1 240 avis</span></span>
        </p>
        <div class="grid gap-6 lg:grid-cols-2 lg:items-end">
          <h1 class="max-w-xl text-hero motion-safe:animate-entree" style="animation-delay: 60ms">L'objet juste, fait par des mains qui ont un nom.</h1>
          <div class="flex flex-col gap-5 motion-safe:animate-entree" style="animation-delay: 120ms">
            <div class="grid gap-4 text-sm sm:grid-cols-2">
              <p>Céramique, mobilier, ustensiles et textiles fabriqués en petites séries par 120 artisans indépendants.</p>
              <p>Chaque pièce est signée et vient avec le nom de l'atelier qui l'a façonnée.</p>
            </div>
            <div class="flex items-center gap-2">
              <a uiBouton routerLink="/catalogue">Découvrir la boutique</a>
              <a uiBouton variante="rond" routerLink="/catalogue" aria-label="Découvrir la boutique"><ui-icone nom="fleche" [taille]="16" /></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class HeroAccueil {
  protected readonly etoiles = [1, 2, 3, 4, 5];
  private readonly hero = viewChild.required<ElementRef<HTMLElement>>('hero');

  constructor() {
    const navigation = inject(NavigationSite);
    let observateur: IntersectionObserver | undefined;
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }
      // Le hero est « visible » tant qu'une partie dépasse sous l'en-tête (72 px).
      observateur = new IntersectionObserver(([entree]) => navigation.heroVisible.set(entree.isIntersecting), {
        rootMargin: '-72px 0px 0px 0px',
      });
      observateur.observe(this.hero().nativeElement);
    });
    inject(DestroyRef).onDestroy(() => {
      observateur?.disconnect();
      navigation.heroVisible.set(true);
    });
  }
}
