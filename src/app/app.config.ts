import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { jetonInterceptor } from './core/auth/jeton.interceptor';
import { demarrerBoutique } from './core/layout/demarrage';
import { TitreStrategy } from './core/titre.strategy';
import { FocusTitre, ignorerTransitionSiMouvementReduit } from './shared/ui';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ignorerTransitionSiMouvementReduit,
      }),
    ),
    provideHttpClient(withFetch(), withInterceptors([jetonInterceptor])),
    { provide: TitleStrategy, useClass: TitreStrategy },
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideAppInitializer(() => inject(FocusTitre).demarrer()),
    provideAppInitializer(demarrerBoutique),
  ],
};
