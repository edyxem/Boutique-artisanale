import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Categorie } from '../../core/models';
import { CategorieService } from '../../core/services/categorie.service';
import { messageErreur } from '../../core/services/erreurs-api';
import { FORMAT_SLUG, slugifier } from '../../shared/format-slug';
import { EntetePanneau } from '../../shared/panneau/panneau';
import { RechargementListe } from '../../shared/panneau/rechargement';
import {
  ColonneTableau,
  NotificationService,
  UiBouton,
  UiCellule,
  UiChamp,
  UiConfirmer,
  UiEtatErreur,
  UiFormulaire,
  UiModale,
  UiSaisie,
  UiSquelette,
  UiTableau,
} from '../../shared/ui';

export const MESSAGE_CATEGORIE_UTILISEE = 'Cette catégorie contient des produits : déplacez-les avant de la supprimer.';

/** Gestion des catégories : tableau, création et modification en modale, suppression en deux clics. */
@Component({
  selector: 'app-categories-page',
  imports: [RouterLink, RouterOutlet, EntetePanneau, UiBouton, UiCellule, UiConfirmer, UiEtatErreur, UiSquelette, UiTableau],
  providers: [RechargementListe],
  template: `
    <app-entete-panneau surTitre="Administration" titre="Catégories">
      <a uiBouton routerLink="nouvelle">Nouvelle catégorie</a>
    </app-entete-panneau>
    <div class="rounded-carte bg-soft p-4 md:p-5" [attr.aria-busy]="categories.isLoading()">
      @if (categories.isLoading()) {
        <div class="flex flex-col gap-2"><ui-squelette forme="ligne" [nombre]="4" /></div>
      } @else if (categories.error()) {
        <ui-etat-erreur message="Les catégories sont momentanément indisponibles." (reessayer)="categories.reload()" />
      } @else {
        <ui-tableau legende="Catégories" [lignes]="categories.value() ?? []" [colonnes]="colonnes" [recherche]="rechercheNom" indication="Nom de la catégorie" vide="Aucune catégorie.">
          <ng-template uiCellule="actions" let-categorie>
            <span class="flex justify-end gap-2">
              <a uiBouton variante="contour" taille="petit" [routerLink]="[categorie.id]" [attr.aria-label]="'Modifier ' + categorie.nom">Modifier</a>
              <button uiConfirmer [nomCible]="categorie.nom" (confirme)="supprimer(categorie)"></button>
            </span>
          </ng-template>
        </ui-tableau>
      }
    </div>
    <router-outlet />
  `,
})
export class CategoriesPage {
  private readonly service = inject(CategorieService);
  private readonly notifications = inject(NotificationService);
  private readonly rechargement = inject(RechargementListe);

  protected readonly categories = rxResource({ params: () => this.rechargement.version(), stream: () => this.service.lister() });

  protected readonly colonnes: ColonneTableau<Categorie>[] = [
    { cle: 'nom', libelle: 'Nom', valeur: (c) => c.nom, triable: true },
    { cle: 'slug', libelle: 'Slug', valeur: (c) => c.slug, triable: true },
    { cle: 'actions', libelle: 'Actions', valeur: () => '' },
  ];
  protected readonly rechercheNom = (categorie: Categorie) => categorie.nom;

  protected supprimer(categorie: Categorie): void {
    this.service.supprimer(categorie.id).subscribe({
      next: () => {
        this.notifications.succes(`La catégorie ${categorie.nom} a été supprimée.`);
        this.rechargement.recharger();
      },
      error: (erreur: unknown) => this.notifications.erreur(messageErreur(erreur, { 409: MESSAGE_CATEGORIE_UTILISEE })),
    });
  }
}

/** Valeur absente des autres catégories (comparaison sans casse pour le nom). */
function unique(autres: () => readonly Categorie[], champ: 'nom' | 'slug'): ValidatorFn {
  return (controle: AbstractControl): ValidationErrors | null => {
    const valeur = String(controle.value ?? '').trim().toLowerCase();
    return valeur && autres().some((c) => c[champ].toLowerCase() === valeur) ? { dejaUtilise: true } : null;
  };
}

/** Formulaire de catégorie en modale : le slug est proposé à partir du nom tant qu'il n'a pas été modifié. */
@Component({
  selector: 'app-edition-categorie-page',
  imports: [ReactiveFormsModule, UiBouton, UiChamp, UiFormulaire, UiModale, UiSaisie],
  template: `
    <ui-modale [titre]="id() ? 'Modifier la catégorie' : 'Nouvelle catégorie'" [ouverte]="true" (ouverteChange)="!$event && fermer()">
      @if (introuvable()) {
        <p class="text-h3">Catégorie introuvable</p>
      } @else {
        <form uiFormulaire [formGroup]="formulaire" (ngSubmit)="enregistrer()" class="flex flex-col gap-4">
          <ui-champ libelle="Nom" [controle]="formulaire.controls.nom" [messages]="messagesNom">
            <input uiSaisie formControlName="nom" />
          </ui-champ>
          <ui-champ libelle="Slug" [controle]="formulaire.controls.slug" [messages]="messagesSlug">
            <input uiSaisie formControlName="slug" (input)="slugModifie = true" />
          </ui-champ>
          <button uiBouton type="submit" class="mt-2 w-full" [chargement]="envoi()">Enregistrer</button>
        </form>
      }
    </ui-modale>
  `,
})
export class EditionCategoriePage {
  readonly id = input<string>();

  private readonly service = inject(CategorieService);
  private readonly notifications = inject(NotificationService);
  private readonly rechargement = inject(RechargementListe);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly envoi = signal(false);
  protected slugModifie = false;
  private readonly categories = toSignal(this.service.lister(), { initialValue: [] as Categorie[] });
  private readonly courante = computed(() => this.categories().find((c) => c.id === Number(this.id())) ?? null);
  private readonly autres = computed(() => this.categories().filter((c) => c.id !== Number(this.id())));
  protected readonly introuvable = computed(() => !!this.id() && this.categories().length > 0 && !this.courante());

  protected readonly messagesNom = {
    minlength: 'Le nom doit contenir entre 2 et 50 caractères.',
    maxlength: 'Le nom doit contenir entre 2 et 50 caractères.',
    dejaUtilise: 'Ce nom est déjà utilisé.',
  };
  protected readonly messagesSlug = {
    pattern: 'Le slug ne contient que des minuscules sans accents, des chiffres et des tirets.',
    dejaUtilise: 'Ce slug est déjà utilisé.',
  };

  protected readonly formulaire = inject(NonNullableFormBuilder).group({
    nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), unique(() => this.autres(), 'nom')]],
    slug: ['', [Validators.required, Validators.pattern(FORMAT_SLUG), unique(() => this.autres(), 'slug')]],
  });

  constructor() {
    this.formulaire.controls.nom.valueChanges.subscribe((nom) => {
      if (!this.slugModifie) {
        this.formulaire.controls.slug.setValue(slugifier(nom));
      }
    });
    effect(() => {
      const categorie = this.courante();
      if (categorie) {
        this.slugModifie = true;
        this.formulaire.setValue({ nom: categorie.nom, slug: categorie.slug });
      }
      // La liste des autres catégories a changé : revalider l'unicité.
      this.formulaire.controls.nom.updateValueAndValidity({ emitEvent: false });
      this.formulaire.controls.slug.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected enregistrer(): void {
    if (this.formulaire.invalid || this.envoi()) {
      return;
    }
    const donnees = { nom: this.formulaire.controls.nom.value.trim(), slug: this.formulaire.controls.slug.value };
    const id = this.id() ? Number(this.id()) : null;
    this.envoi.set(true);
    (id ? this.service.modifier(id, donnees) : this.service.creer(donnees)).subscribe({
      next: (categorie) => {
        this.envoi.set(false);
        this.notifications.succes(`La catégorie ${categorie.nom} a été ${id ? 'modifiée' : 'créée'}.`);
        this.rechargement.recharger();
        this.fermer();
      },
      error: (erreur: unknown) => {
        this.envoi.set(false);
        this.notifications.erreur(messageErreur(erreur, { 409: 'Ce nom ou ce slug est déjà utilisé.' }));
      },
    });
  }

  protected fermer(): void {
    void this.router.navigate(['..'], { relativeTo: this.route });
  }
}
