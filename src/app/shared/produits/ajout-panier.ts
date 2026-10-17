import { Service, inject } from '@angular/core';
import { PanierService, ResultatAjout } from '../../core/services/panier.service';
import { ProduitAffiche } from '../../core/services/produit.service';
import { PreferencesMouvement } from '../animations/mouvement-reduit';
import { NotificationService } from '../ui/notifications';

/** Durée du vol de la photo jusqu'au panier. */
export const DUREE_VOL = 300;

/**
 * Ajout au panier depuis une carte ou une fiche : met à jour le panier, affiche le toast du template
 * et fait « voler » la photo du produit jusqu'au bouton du panier de l'en-tête.
 */
@Service()
export class AjoutPanier {
  private readonly panier = inject(PanierService);
  private readonly notifications = inject(NotificationService);
  private readonly mouvement = inject(PreferencesMouvement);

  ajouter(produit: ProduitAffiche, quantite = 1, photo?: HTMLElement | null): ResultatAjout {
    const resultat = this.panier.ajouter(produit, quantite);
    if (resultat === 'epuise') {
      return resultat;
    }
    if (resultat === 'plafonne') {
      this.notifications.erreur(`Stock insuffisant : ${produit.stock} exemplaires disponibles.`);
    } else {
      this.notifications.succes(`${produit.nom} ajouté au panier`);
    }
    if (photo) {
      this.voler(photo);
    }
    return resultat;
  }

  /** Copie de la photo qui rétrécit en rejoignant le bouton du panier (omise si le mouvement est réduit). */
  voler(photo: HTMLElement): void {
    const cible = document.querySelector<HTMLElement>('[data-cible-panier]');
    if (this.mouvement.reduit() || !cible || typeof photo.animate !== 'function') {
      return;
    }
    const depart = photo.getBoundingClientRect();
    const arrivee = cible.getBoundingClientRect();
    if (!depart.width || !arrivee.width) {
      return;
    }
    const copie = photo.cloneNode(true) as HTMLElement;
    Object.assign(copie.style, {
      position: 'fixed',
      left: `${depart.left}px`,
      top: `${depart.top}px`,
      width: `${depart.width}px`,
      height: `${depart.height}px`,
      margin: '0',
      zIndex: '70',
      pointerEvents: 'none',
      transformOrigin: 'top left',
    });
    copie.setAttribute('aria-hidden', 'true');
    document.body.appendChild(copie);
    const dx = arrivee.left + arrivee.width / 2 - depart.left;
    const dy = arrivee.top + arrivee.height / 2 - depart.top;
    copie
      .animate(
        [
          { transform: 'translate(0, 0) scale(1)', opacity: 1, borderRadius: '16px' },
          { transform: `translate(${dx}px, ${dy}px) scale(0.08)`, opacity: 0.4, borderRadius: '999px' },
        ],
        { duration: DUREE_VOL, easing: 'cubic-bezier(.2,.8,.2,1)' },
      )
      .finished.finally(() => copie.remove());
  }
}
