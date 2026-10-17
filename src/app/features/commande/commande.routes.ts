import { Routes } from '@angular/router';
import { CommandePage, panierNonVideGuard } from './commande-page';
import { ConfirmationCommandePage } from './confirmation-commande-page';

export default [
  { path: '', component: CommandePage, canActivate: [panierNonVideGuard] },
  { path: 'confirmation/:id', component: ConfirmationCommandePage, title: 'Commande confirmée' },
] satisfies Routes;
