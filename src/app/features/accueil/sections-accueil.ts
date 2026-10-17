import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Categorie } from '../../core/models';
import { ProduitAffiche } from '../../core/services/produit.service';
import { UiCarteProduit } from '../../shared/produits/carte-produit';
import { UiBouton, UiReveler } from '../../shared/ui';

/** Bloc « Notre engagement » : grand texte sur fond menthe, petites photos en pilule qui s'ouvrent à l'apparition. */
@Component({
  selector: 'app-bloc-engagement',
  imports: [NgOptimizedImage, RouterLink, UiBouton, UiReveler],
  template: `
    <div uiReveler class="group flex flex-col gap-8 rounded-bloc bg-mint px-5 py-12 md:px-12 md:py-20">
      <p class="text-eyebrow text-ink">Notre engagement</p>
      <p class="max-w-grand text-grand leading-grand tracking-tight">
        Chez Flowering,
        <span class="relative inline-block h-9 w-18 origin-left overflow-hidden rounded-full align-middle md:h-12 md:w-24 motion-safe:scale-x-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-data-revele:scale-x-100">
          <img ngSrc="/images/engagement-portrait-1.jpg" alt="" width="96" height="48" class="size-full object-cover" />
        </span>
        nous réunissons des artisans qui façonnent
        <span class="relative inline-block h-9 w-18 origin-left overflow-hidden rounded-full align-middle md:h-12 md:w-24 motion-safe:scale-x-0 motion-safe:transition-transform motion-safe:delay-100 motion-safe:duration-300 motion-safe:group-data-revele:scale-x-100">
          <img ngSrc="/images/engagement-ceramique.jpg" alt="" width="96" height="48" class="size-full object-cover" />
        </span>
        des objets du quotidien faits pour durer
        <span class="relative inline-block h-9 w-18 origin-left overflow-hidden rounded-full align-middle md:h-12 md:w-24 motion-safe:scale-x-0 motion-safe:transition-transform motion-safe:delay-200 motion-safe:duration-300 motion-safe:group-data-revele:scale-x-100">
          <img ngSrc="/images/engagement-portrait-2.jpg" alt="" width="96" height="48" class="size-full object-cover" />
        </span>
        des années.
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <a uiBouton routerLink="/catalogue">Voir les créations</a>
        <a uiBouton variante="contour" routerLink="/" fragment="comment-ca-marche">Comment ça marche</a>
      </div>
    </div>
  `,
})
export class BlocEngagement {}

/** Sélection : carte « Art de la table » puis les 7 premiers produits visibles. */
@Component({
  selector: 'app-selection-produits',
  imports: [NgOptimizedImage, RouterLink, UiBouton, UiCarteProduit, UiReveler],
  template: `
    <div class="flex flex-col gap-8 py-14 md:py-24">
      <div class="flex flex-col items-center gap-2 text-center">
        <h2>Fait main, livré chez vous</h2>
        <p class="text-sm text-muted">Une sélection renouvelée chaque semaine, en quantités limitées.</p>
      </div>
      <div class="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4">
        <div uiReveler class="relative flex min-h-80 flex-col justify-end overflow-hidden rounded-carte bg-line text-white">
          <img ngSrc="/images/mise-en-avant-art-de-la-table.jpg" alt="Table dressée avec de la vaisselle artisanale" fill sizes="(min-width: 1024px) 25vw, 50vw" class="object-cover" />
          <div class="absolute inset-0 bg-linear-to-b from-transparent to-voile-fort"></div>
          <div class="relative flex flex-col gap-2 p-4">
            <h3>Art de la table</h3>
            <p class="text-sm">Vaisselle, linge et ustensiles façonnés en petites séries.</p>
            <a uiBouton variante="clair" taille="petit" routerLink="/catalogue" [queryParams]="{ categorie: 'ceramique' }" class="mt-2 w-full">Explorer</a>
          </div>
        </div>
        @for (produit of selection(); track produit.id; let i = $index) {
          <ui-carte-produit [uiReveler]="i + 1" [produit]="produit" />
        }
      </div>
    </div>
  `,
})
export class SelectionProduits {
  readonly produits = input.required<readonly ProduitAffiche[]>();
  protected readonly selection = computed(() => this.produits().slice(0, 7));
}

const ETAPES = [
  { image: '/images/etape-1-atelier.jpg', titre: 'Des ateliers sélectionnés', texte: 'Nous visitons chaque atelier avant de le référencer : matières, savoir-faire et conditions de travail.' },
  { image: '/images/etape-2-tour-potier.jpg', titre: 'Fabriqué à la commande', texte: 'Une partie des pièces est façonnée après votre achat. Comptez 1 à 3 semaines selon l\'objet.' },
  { image: '/images/etape-3-mains-argile.jpg', titre: 'Livré et suivi', texte: 'Emballage sans plastique, suivi en temps réel et retours gratuits sous 30 jours.' },
];

/** « Comment fonctionne Flowering » : trois étapes, la première en vert forêt. Cible du lien « Nos artisans ». */
@Component({
  selector: 'app-etapes-flowering',
  imports: [NgOptimizedImage, UiReveler],
  template: `
    <section id="comment-ca-marche" tabindex="-1" aria-labelledby="titre-etapes" class="flex scroll-mt-24 flex-col gap-8 py-14 focus:outline-none md:py-20">
      <h2 id="titre-etapes" class="text-center">Comment fonctionne Flowering</h2>
      <ol class="grid gap-3.5 md:grid-cols-3">
        @for (etape of etapes; track etape.titre; let i = $index) {
          <li
            [uiReveler]="i"
            class="flex flex-col overflow-hidden rounded-carte bg-soft first:bg-forest first:text-forest-ink"
          >
            <div class="relative aspect-photo bg-line">
              <img [ngSrc]="etape.image" alt="" fill sizes="(min-width: 820px) 33vw, 100vw" class="object-cover" />
            </div>
            <div class="flex flex-col gap-1.5 p-5">
              <p class="text-eyebrow opacity-80">Étape {{ i + 1 }}</p>
              <h3>{{ etape.titre }}</h3>
              <p class="text-sm opacity-80">{{ etape.texte }}</p>
            </div>
          </li>
        }
      </ol>
    </section>
  `,
})
export class EtapesFlowering {
  protected readonly etapes = ETAPES;
}

const PHOTOS_UNIVERS = new Set(['ceramique', 'mobilier', 'cuisine', 'textile', 'vannerie', 'maison']);

/** « Parcourir par univers » : une tuile ronde par catégorie avec son nombre de créations visibles. */
@Component({
  selector: 'app-univers-accueil',
  imports: [NgOptimizedImage, RouterLink, UiBouton, UiReveler],
  template: `
    <div class="flex flex-col gap-8 pb-6">
      <div class="flex items-center justify-between gap-4">
        <h2>Parcourir par univers</h2>
        <a uiBouton variante="contour" taille="petit" routerLink="/catalogue">Tout voir</a>
      </div>
      <ul class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        @for (tuile of tuiles(); track tuile.slug; let i = $index) {
          <li [uiReveler]="i">
            <a [routerLink]="'/catalogue'" [queryParams]="{ categorie: tuile.slug }" class="group flex flex-col items-center gap-2 text-center">
              <span class="relative block aspect-square w-full overflow-hidden rounded-full bg-line">
                <span class="absolute inset-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-106">
                  <img [ngSrc]="tuile.photo" alt="" fill sizes="(min-width: 1024px) 16vw, 50vw" class="object-cover" />
                </span>
              </span>
              <strong class="font-medium">{{ tuile.nom }}</strong>
              <small class="text-sm text-muted">{{ tuile.nombre }} création{{ tuile.nombre > 1 ? 's' : '' }}</small>
            </a>
          </li>
        }
      </ul>
    </div>
  `,
})
export class UniversAccueil {
  readonly categories = input.required<readonly Categorie[]>();
  readonly produits = input.required<readonly ProduitAffiche[]>();

  protected readonly tuiles = computed(() =>
    this.categories().map((categorie) => {
      const produits = this.produits().filter((p) => p.categorieId === categorie.id);
      const photo = PHOTOS_UNIVERS.has(categorie.slug) ? `/images/categorie-${categorie.slug}.jpg` : (produits[0]?.images[0] ?? '/images/categorie-maison.jpg');
      return { nom: categorie.nom, slug: categorie.slug, nombre: produits.length, photo };
    }),
  );
}
