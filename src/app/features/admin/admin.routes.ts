import { Routes } from '@angular/router';
import { AdminPage } from './admin-page';

/** Page provisoire pour toutes les sous-pages de la section, en attendant leur construction. */
export default [{ path: '**', component: AdminPage }] satisfies Routes;
