import { inject } from '@angular/core';
import { CategorieService } from '../services/categorie.service';
import { PanierService } from '../services/panier.service';
import { NotificationService } from '../../shared/ui';
import { NavigationSite } from './navigation';

/** Message affiché quand le panier restauré a dû être ajusté. */
export const MESSAGE_PANIER_AJUSTE = 'Votre panier a été mis à jour selon les stocks disponibles.';

/**
 * Au démarrage, sans bloquer l'affichage : univers de la navigation (en-tête, menu mobile, pied de page)
 * et panier restauré confronté aux stocks de l'API.
 */
export function demarrerBoutique(): void {
  const navigation = inject(NavigationSite);
  const notifications = inject(NotificationService);
  inject(CategorieService)
    .lister()
    .subscribe({
      next: (categories) =>
        navigation.univers.set(
          categories.map((c) => ({ libelle: c.nom, chemin: '/catalogue', parametres: { categorie: c.slug } })),
        ),
      error: () => undefined,
    });
  inject(PanierService)
    .synchroniser()
    .subscribe({
      next: (ajuste) => ajuste && notifications.succes(MESSAGE_PANIER_AJUSTE),
      error: () => undefined,
    });
}
