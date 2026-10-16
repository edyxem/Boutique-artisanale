import { Component, Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiBadgeStock, UiStatut } from './badges';
import { UiBouton } from './bouton';
import { UiChamp, UiSaisie } from './champ';
import { UiFormulaire } from './formulaire';
import { NomIcone, UiIcone } from './icone';
import { UiImageFondu } from './image-fondu';
import { UiPuce } from './puce';

function rendre<T>(composant: Type<T>) {
  const fixture = TestBed.createComponent(composant);
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

describe('Composants de base', () => {
  describe('ui-icone', () => {
    @Component({
      imports: [UiIcone],
      template: `
        @for (nom of noms; track nom) {
          <ui-icone [nom]="nom" />
        }
        <button type="button" aria-label="Panier"><ui-icone nom="sac" /></button>
      `,
    })
    class Hote {
      noms: NomIcone[] = ['sac', 'menu', 'fleche', 'loupe', 'croix', 'moins', 'plus', 'etoile'];
    }

    it('dessine chaque icône du template, cachée des technologies d\'assistance', () => {
      const { element } = rendre(Hote);
      const icones = element.querySelectorAll('ui-icone');
      expect(icones.length).toBe(9);
      icones.forEach((icone) => {
        expect(icone.getAttribute('aria-hidden')).toBe('true');
        expect(icone.querySelector('svg path')).not.toBeNull();
      });
    });

    it('laisse le nom accessible au bouton qui ne contient qu\'une icône', () => {
      const { element } = rendre(Hote);
      const bouton = element.querySelector('button')!;
      expect(bouton.getAttribute('aria-label')).toContain('Panier');
    });
  });

  describe('uiBouton', () => {
    @Component({
      imports: [UiBouton],
      template: `
        <button uiBouton type="button" [chargement]="chargement()" (click)="clics = clics + 1">Se connecter</button>
        <button uiBouton type="button" disabled (click)="clicsDesactive = clicsDesactive + 1">Ajouter</button>
      `,
    })
    class Hote {
      chargement = signal(false);
      clics = 0;
      clicsDesactive = 0;
    }

    it('affiche un indicateur, garde sa largeur, expose aria-busy et ignore un second clic pendant le chargement', () => {
      const { fixture, element } = rendre(Hote);
      const bouton = element.querySelector('button')!;
      fixture.componentInstance.chargement.set(true);
      fixture.detectChanges();

      expect(bouton.getAttribute('aria-busy')).toBe('true');
      expect(bouton.hasAttribute('disabled')).toBe(true);
      expect(bouton.querySelector('span.invisible')?.textContent).toContain('Se connecter');
      expect(bouton.querySelector('.animate-spin, [class*="animate-spin"]')).not.toBeNull();
      bouton.click();
      expect(fixture.componentInstance.clics).toBe(0);
    });

    it('ignore les clics quand il est désactivé et paraît atténué', () => {
      const { fixture, element } = rendre(Hote);
      const bouton = element.querySelectorAll('button')[1];
      bouton.click();
      expect(fixture.componentInstance.clicsDesactive).toBe(0);
      expect(bouton.className).toContain('disabled:opacity-50');
    });

    it('applique les effets de survol et de pression seulement sous motion-safe', () => {
      const { element } = rendre(Hote);
      const classes = element.querySelector('button')!.className;
      expect(classes).toContain('hover:opacity-90');
      expect(classes).toContain('motion-safe:active:scale-98');
      expect(classes).not.toMatch(/(^|\s)scale-/);
    });
  });

  describe('badges', () => {
    @Component({
      imports: [UiBadgeStock, UiStatut],
      template: `
        <ui-badge-stock [stock]="18" />
        <ui-badge-stock [stock]="2" />
        <ui-badge-stock [stock]="0" />
        <ui-statut statut="expediee" />
      `,
    })
    class Hote {}

    it('indique « En stock », « Plus que 2 » et « Épuisé » avec des points vert, orange et rouge', () => {
      const { element } = rendre(Hote);
      const badges = [...element.querySelectorAll('ui-badge-stock')];
      expect(badges.map((b) => b.textContent?.trim())).toEqual(['En stock', 'Plus que 2', 'Épuisé']);
      expect(badges.map((b) => b.querySelector('span span')!.className)).toEqual(['size-1.5 rounded-full bg-ok', 'size-1.5 rounded-full bg-warn', 'size-1.5 rounded-full bg-bad']);
    });

    it('affiche « Expédiée » avec un point rose pour une commande expédiée', () => {
      const { element } = rendre(Hote);
      const statut = element.querySelector('ui-statut')!;
      expect(statut.textContent?.trim()).toBe('Expédiée');
      expect(statut.querySelector('span span')!.className).toContain('bg-candy');
    });
  });

  describe('uiPuce', () => {
    @Component({
      imports: [UiPuce],
      template: `
        @for (puce of puces; track puce) {
          <button uiPuce [actif]="actif() === puce" (click)="actif.set(puce)">{{ puce }}</button>
        }
      `,
    })
    class Hote {
      puces = ['Tout', 'Cuisine'];
      actif = signal('Tout');
    }

    it('passe la puce choisie en vert forêt avec aria-pressed', () => {
      const { fixture, element } = rendre(Hote);
      const [tout, cuisine] = element.querySelectorAll('button');
      cuisine.click();
      fixture.detectChanges();
      expect(cuisine.getAttribute('aria-pressed')).toBe('true');
      expect(cuisine.className).toContain('bg-forest');
      expect(tout.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('ui-champ et uiFormulaire', () => {
    @Component({
      imports: [ReactiveFormsModule, UiChamp, UiSaisie, UiFormulaire],
      template: `
        <form uiFormulaire [formGroup]="formulaire">
          <ui-champ libelle="Nom" [controle]="formulaire.controls.nom">
            <input uiSaisie formControlName="nom" />
          </ui-champ>
          <ui-champ libelle="E-mail" [controle]="formulaire.controls.email">
            <input uiSaisie formControlName="email" />
          </ui-champ>
          <button type="submit">Envoyer</button>
        </form>
      `,
    })
    class Hote {
      formulaire = new FormGroup({
        nom: new FormControl('', { nonNullable: true, validators: Validators.required }),
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      });
    }

    it('relie le message d\'erreur au champ touché et invalide', async () => {
      const { fixture, element } = rendre(Hote);
      const email = fixture.componentInstance.formulaire.controls.email;
      email.setValue('awa@');
      email.markAsTouched();
      fixture.detectChanges();
      await fixture.whenStable();

      const saisie = element.querySelectorAll('input')[1];
      const message = element.querySelectorAll('ui-champ')[1].querySelector('p')!;
      expect(message.textContent?.trim()).toBe('Saisissez une adresse email valide.');
      expect(saisie.getAttribute('aria-invalid')).toBe('true');
      expect(saisie.getAttribute('aria-describedby')).toBe(message.id);
      expect(element.querySelectorAll('label')[1].getAttribute('for')).toBe(saisie.id);
    });

    it('à une soumission invalide : messages affichés, focus sur le premier champ invalide, bouton qui tremble', async () => {
      const { fixture, element } = rendre(Hote);
      element.querySelector('form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(element.querySelectorAll('ui-champ p').length).toBe(2);
      expect(document.activeElement).toBe(element.querySelector('input'));
      expect(element.querySelector('button')!.classList.contains('motion-safe:animate-tremble')).toBe(true);
    });
  });

  describe('uiImageFondu', () => {
    @Component({
      imports: [UiImageFondu],
      template: `<div class="aspect-square bg-line"><img uiImageFondu src="/images/produit-tasses-empilables.jpg" alt="Tasses" /></div>`,
    })
    class Hote {}

    it('rend l\'image visible à son chargement', () => {
      const { fixture, element } = rendre(Hote);
      const image = element.querySelector('img')!;
      expect(image.className).toContain('motion-safe:opacity-0');
      image.dispatchEvent(new Event('load'));
      fixture.detectChanges();
      expect(image.className).toContain('opacity-100');
    });
  });
});
