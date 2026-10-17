import { Routes } from '@angular/router';
import { adminGuard, authGuard, vendeurGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Accueil',
    data: { enTete: 'superpose' },
    loadComponent: () => import('./features/accueil/accueil-page').then((m) => m.AccueilPage),
  },
  {
    path: 'catalogue',
    title: 'Boutique',
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
    canMatch: [authGuard],
    loadChildren: () => import('./features/commande/commande.routes'),
  },
  {
    path: 'compte',
    title: 'Mon compte',
    canMatch: [authGuard],
    loadChildren: () => import('./features/compte/compte.routes'),
  },
  {
    path: 'vendeur',
    title: 'Espace vendeur',
    canMatch: [vendeurGuard],
    loadChildren: () => import('./features/vendeur/vendeur.routes'),
  },
  {
    path: 'admin',
    title: 'Administration',
    canMatch: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes'),
  },
  {
    path: 'connexion',
    title: 'Connexion',
    data: { onglet: 'connexion' },
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'inscription',
    title: 'Créer un compte',
    data: { onglet: 'inscription' },
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'acces-refuse',
    title: 'Accès refusé',
    loadComponent: () => import('./shared/pages/acces-refuse/acces-refuse').then((m) => m.AccesRefuse),
  },
  {
    path: '**',
    title: 'Page introuvable',
    loadComponent: () => import('./shared/pages/page-introuvable/page-introuvable').then((m) => m.PageIntrouvable),
  },
];
