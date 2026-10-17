import { Routes } from '@angular/router';
import { CataloguePage } from './catalogue-page';
import { FichePage, titreProduitResolver } from './fiche-page';

export default [
  { path: '', component: CataloguePage },
  { path: ':id', component: FichePage, title: titreProduitResolver },
] satisfies Routes;
