import { Resource } from '@angular/core';

/**
 * Valeur d'une ressource, ou `defaut` tant qu'elle charge ou après un échec.
 * `value()` lève une exception quand la ressource est en erreur : `value() ?? []` ne protège pas.
 */
export function valeurOu<T, D>(ressource: Resource<T>, defaut: D): Exclude<T, undefined> | D {
  return ressource.hasValue() ? (ressource.value() as Exclude<T, undefined>) : defaut;
}
