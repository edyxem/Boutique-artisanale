import { Service, signal } from '@angular/core';

/** Lien de navigation du site (en-tête, menu mobile, pied de page). */
export interface LienSite {
  libelle: string;
  chemin: string;
  fragment?: string;
  parametres?: Record<string, string>;
}

/**
 * État partagé de la navigation du layout :
 * - `univers` : liens d'univers (zone gauche de l'en-tête, colonne « Boutique » du pied de page) ;
 * - `heroVisible` : faux dès que le hero d'une page à en-tête superposé quitte l'écran.
 */
@Service()
export class NavigationSite {
  readonly univers = signal<LienSite[]>([]);
  readonly heroVisible = signal(true);
}
