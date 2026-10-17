import { Routes } from '@angular/router';
import { VendeurPage } from './vendeur-page';

/** Page provisoire pour toutes les sous-pages de la section, en attendant leur construction. */
export default [{ path: '**', component: VendeurPage }] satisfies Routes;
