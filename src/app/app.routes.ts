import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'catalogue', pathMatch: 'full' },
  {
    path: 'catalogue',
    title: 'Catalogue',
    loadChildren: () => import('./features/catalogue/catalogue.routes'),
  },
  {
    path: 'panier',
    title: 'Panier',
    loadChildren: () => import('./features/panier/panier.routes'),
  },
  {
    path: 'commande',
    title: 'Commande',
    loadChildren: () => import('./features/commande/commande.routes'),
  },
  {
    path: 'compte',
    title: 'Mon compte',
    loadChildren: () => import('./features/compte/compte.routes'),
  },
  {
    path: 'vendeur',
    title: 'Espace vendeur',
    loadChildren: () => import('./features/vendeur/vendeur.routes'),
  },
  {
    path: 'admin',
    title: 'Administration',
    loadChildren: () => import('./features/admin/admin.routes'),
  },
  {
    path: '**',
    title: 'Page introuvable',
    loadComponent: () => import('./shared/pages/page-introuvable/page-introuvable').then((m) => m.PageIntrouvable),
  },
];
