import { Component, computed, input } from '@angular/core';
import { Role, StatutCommande } from '../../core/models';

const PASTILLE = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium';

/** Badge de stock du template : « En stock », « Plus que N » (≤ 4) ou « Épuisé ». */
@Component({
  selector: 'ui-badge-stock',
  template: `
    <span class="${PASTILLE} bg-white px-2.5 py-1 text-badge text-photo-ink">
      <span class="size-1.5 rounded-full" [class]="etat().point"></span>
      {{ etat().libelle }}
    </span>
  `,
})
export class UiBadgeStock {
  readonly stock = input.required<number>();

  protected readonly etat = computed(() => {
    const stock = this.stock();
    if (stock <= 0) {
      return { libelle: 'Épuisé', point: 'bg-bad' };
    }
    if (stock <= 4) {
      return { libelle: `Plus que ${stock}`, point: 'bg-warn' };
    }
    return { libelle: 'En stock', point: 'bg-ok' };
  });
}

export const LIBELLES_STATUT: Record<StatutCommande, string> = {
  en_attente: 'En attente',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const POINTS_STATUT: Record<StatutCommande, string> = {
  en_attente: 'bg-warn',
  expediee: 'bg-candy',
  livree: 'bg-ok',
  annulee: 'bg-bad',
};

/** Pastille de statut de commande du template. */
@Component({
  selector: 'ui-statut',
  template: `
    <span class="${PASTILLE} bg-bg px-2.5 py-1 text-sm text-ink">
      <span class="size-1.5 rounded-full motion-safe:transition-colors motion-safe:duration-300" [class]="point()"></span>
      {{ libelle() }}
    </span>
  `,
})
export class UiStatut {
  readonly statut = input.required<StatutCommande>();

  protected readonly libelle = computed(() => LIBELLES_STATUT[this.statut()]);
  protected readonly point = computed(() => POINTS_STATUT[this.statut()]);
}

const ROLES: Record<Role, { libelle: string; fond: string }> = {
  client: { libelle: 'Client', fond: 'bg-mint' },
  vendeur: { libelle: 'Vendeur', fond: 'bg-soft' },
  admin: { libelle: 'Admin', fond: 'bg-candy-soft' },
};

/** Badge de rôle du template. */
@Component({
  selector: 'ui-badge-role',
  template: `
    <span class="${PASTILLE} px-2.5 py-1 text-badge text-ink" [class]="infos().fond">{{ infos().libelle }}</span>
  `,
})
export class UiBadgeRole {
  readonly role = input.required<Role>();

  protected readonly infos = computed(() => ROLES[this.role()]);
}
