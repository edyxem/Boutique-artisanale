import { InjectionToken } from '@angular/core';

/** URL de base de l'API (json-server en développement). */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000',
});
