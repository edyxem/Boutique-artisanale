import { Routes } from '@angular/router';
import { Panneau } from '../../shared/panneau/panneau';
import { EditionProduitPage } from '../gestion/edition-produit-page';
import { ListeProduitsPage } from '../gestion/liste-produits-page';
import { ApercuPage } from './apercu-page';
import { CategoriesPage, EditionCategoriePage } from './categories-page';
import { CommandesPage, DetailCommandePage } from './commandes-page';
import { UtilisateursPage } from './utilisateurs-page';
import { VendeursPage } from './vendeurs-page';

/** Administration du template : menu latéral et pages de gestion. */
export default [
  {
    path: '',
    component: Panneau,
    data: {
      titre: 'Administration',
      libelleMenu: 'Menu d\'administration',
      entrees: [
        { libelle: 'Aperçu', chemin: '/admin/apercu' },
        { libelle: 'Produits', chemin: '/admin/produits' },
        { libelle: 'Commandes', chemin: '/admin/commandes' },
        { libelle: 'Catégories', chemin: '/admin/categories' },
        { libelle: 'Vendeurs', chemin: '/admin/vendeurs' },
        { libelle: 'Utilisateurs', chemin: '/admin/utilisateurs' },
      ],
    },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'apercu' },
      { path: 'apercu', component: ApercuPage, title: 'Aperçu' },
      {
        path: 'produits',
        component: ListeProduitsPage,
        title: 'Produits',
        data: { mode: 'admin' },
        children: [
          { path: 'nouveau', component: EditionProduitPage, title: 'Nouveau produit', data: { mode: 'admin' } },
          { path: ':id', component: EditionProduitPage, title: 'Modifier un produit', data: { mode: 'admin' } },
        ],
      },
      { path: 'commandes', component: CommandesPage, title: 'Commandes' },
      { path: 'commandes/:id', component: DetailCommandePage, title: 'Détail de la commande' },
      {
        path: 'categories',
        component: CategoriesPage,
        title: 'Catégories',
        children: [
          { path: 'nouvelle', component: EditionCategoriePage, title: 'Nouvelle catégorie' },
          { path: ':id', component: EditionCategoriePage, title: 'Modifier une catégorie' },
        ],
      },
      { path: 'vendeurs', component: VendeursPage, title: 'Vendeurs' },
      { path: 'utilisateurs', component: UtilisateursPage, title: 'Utilisateurs' },
    ],
  },
] satisfies Routes;
