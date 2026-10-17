import { HttpErrorResponse } from '@angular/common/http';

/** Messages par statut HTTP pour une action donnée ; un message par défaut couvre les autres cas. */
export interface MessagesErreur {
  403?: string;
  409?: string;
  defaut?: string;
}

const PAR_DEFAUT = 'L\'enregistrement a échoué. Réessayez.';
const SERVEUR = 'Le serveur ne répond pas. Réessayez plus tard.';

/** Traduit une erreur de l'API en message français pour un toast. */
export function messageErreur(erreur: unknown, messages: MessagesErreur = {}): string {
  if (!(erreur instanceof HttpErrorResponse) || erreur.status === 0) {
    return SERVEUR;
  }
  if (erreur.status === 403 && messages[403]) {
    return messages[403];
  }
  if (erreur.status === 409 && messages[409]) {
    return messages[409];
  }
  return messages.defaut ?? PAR_DEFAUT;
}
