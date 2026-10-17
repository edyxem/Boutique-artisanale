import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { jetonInterceptor } from './core/auth/jeton.interceptor';
import { TitreStrategy } from './core/titre.strategy';
import { FocusTitre, ignorerTransitionSiMouvementReduit } from './shared/ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ignorerTransitionSiMouvementReduit,
      }),
    ),
    provideHttpClient(withFetch(), withInterceptors([jetonInterceptor])),
    { provide: TitleStrategy, useClass: TitreStrategy },
    provideAppInitializer(() => inject(FocusTitre).demarrer()),
  ],
};
