import { NgOptimizedImage } from '@angular/common';
import { Component, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { Categorie, Produit, Vendeur } from '../../core/models';
import { DonneesProduit } from '../../core/services/produit.service';
import { UiBouton } from '../ui/bouton';
import { UiChamp, UiSaisie } from '../ui/champ';
import { UiFormulaire } from '../ui/formulaire';
import { PHOTOS_PRODUITS } from './photos';

function prixValide(controle: AbstractControl): ValidationErrors | null {
  const valeur = controle.value as number | null;
  if (valeur === null || (controle.value as unknown) === '') {
    return null;
  }
  return valeur > 0 && /^\d+(\.\d{1,2})?$/.test(String(valeur)) ? null : { prix: true };
}

function stockValide(controle: AbstractControl): ValidationErrors | null {
  const valeur = controle.value as number | null;
  if (valeur === null || (controle.value as unknown) === '') {
    return null;
  }
  return Number.isInteger(valeur) && valeur >= 0 ? null : { stock: true };
}

/**
 * Formulaire produit du template (création et modification), partagé par le vendeur et l'administrateur.
 * La photo se choisit dans la bibliothèque du site, avec un aperçu immédiat.
 */
@Component({
  selector: 'app-produit-formulaire',
  imports: [NgOptimizedImage, ReactiveFormsModule, UiBouton, UiChamp, UiFormulaire, UiSaisie],
  template: `
    <form uiFormulaire [formGroup]="formulaire" (ngSubmit)="soumettre()" class="grid gap-5 md:grid-cols-5">
      <div class="flex flex-col gap-3 md:col-span-2">
        <div class="relative aspect-photo overflow-hidden rounded-photo bg-line md:aspect-portrait">
          @for (photo of photoApercu(); track photo) {
            <img [ngSrc]="photo" alt="Aperçu de la photo choisie" fill sizes="(min-width: 820px) 30vw, 90vw" class="object-cover motion-safe:animate-fondu" />
          }
        </div>
        <fieldset class="flex flex-col gap-2" [attr.aria-describedby]="erreurPhoto() ? 'erreur-photo' : null">
          <legend class="mb-2 text-sm text-muted">Photo</legend>
          <div class="grid grid-cols-5 gap-2">
            @for (photo of photos; track photo; let i = $index) {
              <label class="relative block aspect-square cursor-pointer overflow-hidden rounded-mini bg-line ring-2 ring-transparent has-checked:ring-forest has-focus-visible:ring-candy motion-safe:transition-shadow motion-safe:duration-200">
                <input type="radio" class="sr-only" formControlName="photo" [value]="photo" />
                <span class="sr-only">Photo {{ i + 1 }}</span>
                <img [ngSrc]="photo" alt="" fill [priority]="i < 5" class="object-cover" />
              </label>
            }
          </div>
          @if (erreurPhoto()) {
            <p id="erreur-photo" class="text-sm text-bad">Choisissez au moins une photo.</p>
          }
        </fieldset>
      </div>

      <div class="flex flex-col gap-4 md:col-span-3">
        <ui-champ libelle="Nom" [controle]="formulaire.controls.nom" [messages]="messagesNom">
          <input uiSaisie formControlName="nom" />
        </ui-champ>
        <ui-champ libelle="Description" [controle]="formulaire.controls.description" [messages]="messagesDescription">
          <textarea uiSaisie formControlName="description" rows="3"></textarea>
        </ui-champ>
        <div class="grid gap-4 sm:grid-cols-2">
          <ui-champ libelle="Prix (€)" [controle]="formulaire.controls.prix" [messages]="messagesPrix">
            <input uiSaisie type="number" min="0" step="0.01" formControlName="prix" />
          </ui-champ>
          <ui-champ libelle="Stock" [controle]="formulaire.controls.stock" [messages]="messagesStock">
            <input uiSaisie type="number" min="0" step="1" formControlName="stock" />
          </ui-champ>
        </div>
        <ui-champ libelle="Catégorie" [controle]="formulaire.controls.categorieId">
          <select uiSaisie formControlName="categorieId">
            <option [ngValue]="null" disabled>Choisir une catégorie</option>
            @for (categorie of categories(); track categorie.id) {
              <option [ngValue]="categorie.id">{{ categorie.nom }}</option>
            }
          </select>
        </ui-champ>
        @if (boutiques(); as liste) {
          <ui-champ libelle="Boutique" [controle]="formulaire.controls.vendeurId">
            <select uiSaisie formControlName="vendeurId">
              <option [ngValue]="null" disabled>Choisir une boutique</option>
              @for (boutique of liste; track boutique.id) {
                <option [ngValue]="boutique.id">{{ boutique.nomBoutique }}</option>
              }
            </select>
          </ui-champ>
        }
        <label class="flex items-center gap-3">
          <input type="checkbox" formControlName="actif" class="size-4 accent-forest" />
          Actif (en vente dans le catalogue)
        </label>
        <button uiBouton type="submit" class="mt-2 w-full" [chargement]="envoi()">Enregistrer</button>
      </div>
    </form>
  `,
})
export class ProduitFormulaire {
  readonly produit = input<Produit | null>(null);
  readonly categories = input.required<readonly Categorie[]>();
  /** Boutiques proposées (administration) ; sans liste, le produit reste dans la boutique du vendeur. */
  readonly boutiques = input<readonly Vendeur[] | null>(null);
  readonly envoi = input(false);
  readonly enregistrer = output<DonneesProduit>();

  protected readonly photos = PHOTOS_PRODUITS;
  protected readonly messagesNom = { minlength: 'Le nom doit contenir entre 3 et 100 caractères.', maxlength: 'Le nom doit contenir entre 3 et 100 caractères.' };
  protected readonly messagesDescription = {
    minlength: 'La description doit contenir entre 10 et 1000 caractères.',
    maxlength: 'La description doit contenir entre 10 et 1000 caractères.',
  };
  protected readonly messagesPrix = { prix: 'Le prix doit être supérieur à 0.' };
  protected readonly messagesStock = { stock: 'Le stock doit être un nombre entier positif.' };

  protected readonly formulaire = inject(NonNullableFormBuilder).group({
    nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    prix: [null as number | null, [Validators.required, prixValide]],
    stock: [null as number | null, [Validators.required, stockValide]],
    categorieId: [null as number | null, Validators.required],
    vendeurId: [null as number | null],
    photo: ['', Validators.required],
    actif: [true],
  });

  private readonly photoChoisie = toSignal(this.formulaire.controls.photo.valueChanges.pipe(startWith('')), { initialValue: '' });
  private readonly etatPhoto = toSignal(this.formulaire.controls.photo.events, { initialValue: null });

  /** Aperçu immédiat : la photo choisie (fondu à chaque changement). */
  protected photoApercu(): string[] {
    const photo = this.photoChoisie();
    return photo ? [photo] : [];
  }

  protected erreurPhoto(): boolean {
    this.etatPhoto();
    const controle = this.formulaire.controls.photo;
    return controle.touched && controle.invalid;
  }

  constructor() {
    // Préremplissage en modification ; la boutique devient obligatoire si une liste est proposée.
    effect(() => {
      const produit = this.produit();
      if (produit) {
        this.formulaire.reset({
          nom: produit.nom,
          description: produit.description,
          prix: produit.prix,
          stock: produit.stock,
          categorieId: produit.categorieId,
          vendeurId: produit.vendeurId,
          photo: produit.images[0] ?? '',
          actif: produit.actif,
        });
      }
    });
    effect(() => {
      const vendeur = this.formulaire.controls.vendeurId;
      vendeur.setValidators(this.boutiques() ? Validators.required : null);
      vendeur.updateValueAndValidity();
    });
  }

  protected soumettre(): void {
    if (this.formulaire.invalid || this.envoi()) {
      return;
    }
    const valeur = this.formulaire.getRawValue();
    this.enregistrer.emit({
      nom: valeur.nom.trim(),
      description: valeur.description.trim(),
      prix: valeur.prix!,
      stock: valeur.stock!,
      categorieId: valeur.categorieId!,
      vendeurId: valeur.vendeurId ?? this.produit()?.vendeurId ?? 0,
      images: [valeur.photo],
      actif: valeur.actif,
    });
  }
}
