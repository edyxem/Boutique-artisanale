import { Component, Directive, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { map, startWith, switchMap } from 'rxjs';

let compteur = 0;

/** Messages par défaut des erreurs de validation. */
const MESSAGES_PAR_DEFAUT: Record<string, string> = {
  required: 'Ce champ est obligatoire.',
  email: 'Saisissez une adresse email valide.',
};

/**
 * Champ du template : libellé au-dessus, champ arrondi, message d'erreur relié au champ.
 * Le message apparaît quand le contrôle est touché (ou après `markAllAsTouched()` à la soumission).
 */
@Component({
  selector: 'ui-champ',
  host: { class: 'flex flex-col gap-1.5' },
  template: `
    <label [attr.for]="idSaisie" class="text-sm text-muted">{{ libelle() }}</label>
    <ng-content />
    @if (message(); as texte) {
      <p [id]="idMessage" class="text-sm text-bad motion-safe:animate-entree" animate.leave="motion-safe:animate-fondu-sortie">
        {{ texte }}
      </p>
    }
  `,
})
export class UiChamp {
  readonly libelle = input.required<string>();
  readonly controle = input.required<AbstractControl>();
  readonly messages = input<Record<string, string>>({});

  readonly idSaisie = `champ-${++compteur}`;
  readonly idMessage = `${this.idSaisie}-erreur`;

  /** Se met à jour à chaque événement du contrôle (valeur, statut, état touché). */
  private readonly etat = toSignal(
    toObservable(this.controle).pipe(
      switchMap((controle) =>
        controle.events.pipe(
          startWith(null),
          map(() => ({ erreurs: controle.errors, touche: controle.touched })),
        ),
      ),
    ),
    { initialValue: { erreurs: null, touche: false } },
  );

  readonly message = computed(() => {
    const { erreurs, touche } = this.etat();
    if (!erreurs || !touche) {
      return null;
    }
    const cle = Object.keys(erreurs)[0];
    return this.messages()[cle] ?? MESSAGES_PAR_DEFAUT[cle] ?? 'Valeur invalide.';
  });
}

/** À poser sur l'`<input>`, `<select>` ou `<textarea>` projeté dans `ui-champ`. */
@Directive({
  selector: 'input[uiSaisie], select[uiSaisie], textarea[uiSaisie]',
  host: {
    class:
      'w-full rounded-champ bg-bg px-3.5 py-3 text-ink ring-1 ring-inset ring-line placeholder:text-muted focus:ring-ink aria-invalid:ring-bad motion-safe:transition-shadow motion-safe:duration-200',
    '[id]': 'champ.idSaisie',
    '[attr.aria-invalid]': 'champ.message() ? "true" : null',
    '[attr.aria-describedby]': 'champ.message() ? champ.idMessage : null',
  },
})
export class UiSaisie {
  protected readonly champ = inject(UiChamp);
}
