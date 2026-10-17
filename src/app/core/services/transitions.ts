import { StatutCommande } from '../models';

/** Transitions de statut permises à l'administrateur (dupliquées dans api/server.cjs, mêmes cas de test). */
export function transitionsPermises(statut: StatutCommande): StatutCommande[] {
  return ({ en_attente: ['expediee', 'annulee'], expediee: ['livree', 'annulee'] } as Partial<Record<StatutCommande, StatutCommande[]>>)[statut] ?? [];
}

/** Libellé du bouton qui fait passer une commande au statut donné. */
export const ACTIONS_STATUT: Record<StatutCommande, string> = {
  en_attente: 'Remettre en attente',
  expediee: 'Marquer comme expédiée',
  livree: 'Marquer comme livrée',
  annulee: 'Annuler la commande',
};
