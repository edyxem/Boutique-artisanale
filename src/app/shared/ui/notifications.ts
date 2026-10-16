import { Component, Service, computed, inject, signal } from '@angular/core';

export type TypeNotification = 'succes' | 'erreur';

export interface Notification {
  id: number;
  texte: string;
  type: TypeNotification;
}

/** Durées d'affichage : 2,4 s pour un succès (comme le template), 5 s pour une erreur. */
export const DUREES_NOTIFICATION: Record<TypeNotification, number> = { succes: 2400, erreur: 5000 };
const MAXIMUM_VISIBLES = 3;

/** File des toasts de l'application. */
@Service()
export class NotificationService {
  private prochainId = 1;
  private readonly file = signal<Notification[]>([]);

  readonly notifications = this.file.asReadonly();

  succes(texte: string): void {
    this.ajouter(texte, 'succes');
  }

  erreur(texte: string): void {
    this.ajouter(texte, 'erreur');
  }

  retirer(id: number): void {
    this.file.update((liste) => liste.filter((notification) => notification.id !== id));
  }

  private ajouter(texte: string, type: TypeNotification): void {
    const notification: Notification = { id: this.prochainId++, texte, type };
    this.file.update((liste) => [...liste, notification].slice(-MAXIMUM_VISIBLES));
    setTimeout(() => this.retirer(notification.id), DUREES_NOTIFICATION[type]);
  }
}

/** Toasts du template : pilules vert forêt en bas de l'écran. */
@Component({
  selector: 'ui-toasts',
  host: {
    class:
      'pointer-events-none fixed inset-x-0 bottom-5 z-60 mb-zone-sure flex flex-col items-center gap-2 px-4',
  },
  template: `
    <div role="status" aria-live="polite" class="flex flex-col items-center gap-2">
      @for (notification of succes(); track notification.id) {
        <p
          class="rounded-full bg-forest px-5 py-3 text-bouton text-forest-ink motion-safe:animate-entree-bas"
          animate.leave="motion-safe:animate-sortie-bas"
        >
          {{ notification.texte }}
        </p>
      }
    </div>
    <div role="alert" class="flex flex-col items-center gap-2">
      @for (notification of erreurs(); track notification.id) {
        <p
          class="rounded-full bg-bad px-5 py-3 text-bouton text-white motion-safe:animate-entree-bas"
          animate.leave="motion-safe:animate-sortie-bas"
        >
          {{ notification.texte }}
        </p>
      }
    </div>
  `,
})
export class UiToasts {
  private readonly service = inject(NotificationService);

  protected readonly succes = computed(() =>
    this.service.notifications().filter((notification) => notification.type === 'succes'),
  );
  protected readonly erreurs = computed(() =>
    this.service.notifications().filter((notification) => notification.type === 'erreur'),
  );
}
