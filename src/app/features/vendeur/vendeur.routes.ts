import { Routes } from '@angular/router';
import { Panneau } from '../../shared/panneau/panneau';
import { EditionProduitPage } from '../gestion/edition-produit-page';
import { ListeProduitsPage } from '../gestion/liste-produits-page';
import { MesVentesPage } from './mes-ventes-page';

/** Espace vendeur : même panneau que l'administration du template, filtré sur la boutique du vendeur. */
export default [
  {
    path: '',
    component: Panneau,
    data: {
      titre: 'Espace vendeur',
      libelleMenu: 'Menu de l\'espace vendeur',
      entrees: [
        { libelle: 'Mes produits', chemin: '/vendeur/produits' },
        { libelle: 'Mes ventes', chemin: '/vendeur/ventes' },
      ],
    },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'produits' },
      {
        path: 'produits',
        component: ListeProduitsPage,
        title: 'Mes produits',
        data: { mode: 'vendeur' },
        children: [
          { path: 'nouveau', component: EditionProduitPage, title: 'Nouveau produit', data: { mode: 'vendeur' } },
          { path: ':id', component: EditionProduitPage, title: 'Modifier un produit', data: { mode: 'vendeur' } },
        ],
      },
      { path: 'ventes', component: MesVentesPage, title: 'Mes ventes' },
    ],
  },
] satisfies Routes;
