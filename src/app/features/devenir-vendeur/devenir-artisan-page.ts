import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendeurService } from '../../core/services/vendeur.service';
import { NotificationService, UiBouton, UiChamp, UiEtatErreur, UiFormulaire, UiSaisie, UiSquelette } from '../../shared/ui';

export const MESSAGE_DEMANDE_ENVOYEE = 'Votre demande a été envoyée. Un administrateur va l\'examiner.';

/** Demande « Devenir artisan » d'un client, puis suivi de son état. */
@Component({
  selector: 'app-devenir-artisan-page',
  imports: [ReactiveFormsModule, UiBouton, UiChamp, UiEtatErreur, UiFormulaire, UiSaisie, UiSquelette],
  template: `
    <section class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 md:py-12">
      <div class="flex flex-col gap-1">
        <p class="text-eyebrow text-muted">Espace client</p>
        <h1>Devenir artisan</h1>
        <p class="text-muted">Ouvrez votre boutique sur Flowering. Chaque demande est examinée par notre équipe avant la mise en vente.</p>
      </div>
      <div class="rounded-bloc bg-soft px-5 py-8 md:px-10" [attr.aria-busy]="demande.isLoading()">
        @if (demande.isLoading()) {
          <ui-squelette forme="ligne" [nombre]="3" />
        } @else if (demande.error()) {
          <ui-etat-erreur message="Votre demande est momentanément indisponible." (reessayer)="demande.reload()" />
        } @else if (demande.value(); as existante) {
          <p role="status" class="motion-safe:animate-entree">
            @if (existante.statut === 'refuse') {
              Votre demande pour {{ existante.nomBoutique }} a été refusée.
            } @else if (existante.statut === 'valide') {
              Votre boutique {{ existante.nomBoutique }} est validée.
            } @else {
              Votre demande pour {{ existante.nomBoutique }} est en cours d'examen.
            }
          </p>
        } @else {
          <form uiFormulaire [formGroup]="formulaire" (ngSubmit)="envoyer()" class="flex flex-col gap-4">
            <ui-champ libelle="Nom de la boutique" [controle]="formulaire.controls.nomBoutique" [messages]="messagesNom">
              <input uiSaisie formControlName="nomBoutique" />
            </ui-champ>
            <ui-champ libelle="Description" [controle]="formulaire.controls.description" [messages]="messagesDescription">
              <textarea uiSaisie formControlName="description" rows="4"></textarea>
            </ui-champ>
            <button uiBouton type="submit" class="mt-2 w-full" [chargement]="envoi()">Envoyer ma demande</button>
            @if (erreur(); as texte) {
              <p role="alert" class="text-sm text-bad motion-safe:animate-entree">{{ texte }}</p>
            }
          </form>
        }
      </div>
    </section>
  `,
})
export class DevenirArtisanPage {
  private readonly vendeurs = inject(VendeurService);
  private readonly notifications = inject(NotificationService);

  protected readonly demande = rxResource({ stream: () => this.vendeurs.maBoutique() });
  protected readonly envoi = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly messagesNom = {
    minlength: 'Le nom doit contenir entre 3 et 60 caractères.',
    maxlength: 'Le nom doit contenir entre 3 et 60 caractères.',
  };
  protected readonly messagesDescription = {
    minlength: 'La description doit contenir entre 20 et 500 caractères.',
    maxlength: 'La description doit contenir entre 20 et 500 caractères.',
  };

  protected readonly formulaire = inject(NonNullableFormBuilder).group({
    nomBoutique: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
  });

  protected envoyer(): void {
    if (this.formulaire.invalid || this.envoi()) {
      return;
    }
    this.erreur.set(null);
    this.envoi.set(true);
    const { nomBoutique, description } = this.formulaire.getRawValue();
    this.vendeurs.demander({ nomBoutique: nomBoutique.trim(), description: description.trim() }).subscribe({
      next: (vendeur) => {
        this.envoi.set(false);
        this.demande.set(vendeur);
        this.notifications.succes(MESSAGE_DEMANDE_ENVOYEE);
      },
      error: (erreur: unknown) => {
        this.envoi.set(false);
        this.erreur.set(
          erreur instanceof HttpErrorResponse && erreur.status === 409
            ? 'Ce nom de boutique est déjà utilisé.'
            : 'L\'envoi a échoué. Réessayez.',
        );
      },
    });
  }
}
