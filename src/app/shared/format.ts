import { Pipe, PipeTransform } from '@angular/core';

const EUROS = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const EUROS_CENTIMES = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

/** Prix au format du template : « 34 € », « 39,90 € » (centimes seulement s'il y en a). */
export function formaterPrix(montant: number): string {
  return (montant % 1 ? EUROS_CENTIMES : EUROS).format(montant);
}

@Pipe({ name: 'prix' })
export class PrixPipe implements PipeTransform {
  transform(montant: number | null | undefined): string {
    return montant === null || montant === undefined ? '' : formaterPrix(montant);
  }
}
