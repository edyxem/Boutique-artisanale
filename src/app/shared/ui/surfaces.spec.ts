import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PreferencesMouvement } from '../animations/mouvement-reduit';
import { UiConfirmer } from './confirmer';
import { UiModale } from './modale';
import { NotificationService, UiToasts } from './notifications';
import { Onglet, UiOnglets } from './onglets';
import { UiTiroir } from './tiroir';

/** jsdom n'implémente pas showModal()/close() : simulation minimale. */
function simulerDialogue(): void {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

describe('Surfaces et retours', () => {
  beforeEach(() => simulerDialogue());

  describe('toasts', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('annonce un toast de succès puis le retire après 2,4 s', () => {
      const fixture = TestBed.createComponent(UiToasts);
      const service = TestBed.inject(NotificationService);
      service.succes('Tasses empilables Nuage a été ajouté au panier.');
      fixture.detectChanges();

      const region = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
      expect(region.textContent).toContain('Tasses empilables Nuage a été ajouté au panier.');
      vi.advanceTimersByTime(2399);
      expect(service.notifications().length).toBe(1);
      vi.advanceTimersByTime(1);
      expect(service.notifications().length).toBe(0);
    });

    it('garde trois toasts au plus en retirant le plus ancien', () => {
      const service = TestBed.inject(NotificationService);
      ['un', 'deux', 'trois', 'quatre'].forEach((texte) => service.succes(texte));
      expect(service.notifications().map((n) => n.texte)).toEqual(['deux', 'trois', 'quatre']);
    });

    it('annonce une erreur avec role="alert" pendant 5 s', () => {
      const fixture = TestBed.createComponent(UiToasts);
      const service = TestBed.inject(NotificationService);
      service.erreur('L\'enregistrement a échoué. Réessayez.');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('L\'enregistrement a échoué.');
      vi.advanceTimersByTime(4999);
      expect(service.notifications().length).toBe(1);
    });
  });

  describe('ui-modale', () => {
    @Component({
      imports: [UiModale],
      template: `
        <button type="button" (click)="ouverte.set(true)">Nouveau produit</button>
        <ui-modale titre="Nouveau produit" [(ouverte)]="ouverte"><input aria-label="Nom" /></ui-modale>
      `,
    })
    class Hote {
      ouverte = signal(false);
    }

    function ouvrir() {
      const fixture = TestBed.createComponent(Hote);
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const declencheur = element.querySelector('button')!;
      declencheur.focus();
      declencheur.click();
      fixture.detectChanges();
      return { fixture, element, declencheur, dialogue: element.querySelector('dialog')! };
    }

    it('s\'ouvre en mode modal (focus piégé par le navigateur) avec un titre relié', () => {
      const espion = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
      const { dialogue } = ouvrir();
      expect(espion).toHaveBeenCalled();
      expect(dialogue.hasAttribute('open')).toBe(true);
      const titre = dialogue.querySelector('h2')!;
      expect(dialogue.getAttribute('aria-labelledby')).toBe(titre.id);
    });

    it('se ferme avec Échap après son animation de sortie et rend le focus au déclencheur', () => {
      const { fixture, dialogue, declencheur } = ouvrir();
      dialogue.dispatchEvent(new Event('cancel', { cancelable: true }));
      fixture.detectChanges();

      expect(dialogue.hasAttribute('data-fermeture')).toBe(true);
      expect(dialogue.hasAttribute('open')).toBe(true);
      dialogue.dispatchEvent(new Event('animationend'));
      fixture.detectChanges();

      expect(dialogue.hasAttribute('open')).toBe(false);
      expect(fixture.componentInstance.ouverte()).toBe(false);
      expect(document.activeElement).toBe(declencheur);
    });

    it('se ferme au clic sur le voile', () => {
      const { fixture, dialogue } = ouvrir();
      dialogue.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();
      expect(fixture.componentInstance.ouverte()).toBe(false);
    });

    it('se ferme sans animation quand le mouvement est réduit', () => {
      TestBed.overrideProvider(PreferencesMouvement, { useValue: { reduit: signal(true) } });
      const { fixture, dialogue } = ouvrir();
      fixture.componentInstance.ouverte.set(false);
      fixture.detectChanges();
      expect(dialogue.hasAttribute('open')).toBe(false);
    });
  });

  describe('ui-tiroir', () => {
    @Component({
      imports: [UiTiroir],
      template: `<ui-tiroir titre="Panier" [(ouverte)]="ouverte">Contenu</ui-tiroir>`,
    })
    class Hote {
      ouverte = signal(true);
    }

    function tiroir() {
      const fixture = TestBed.createComponent(Hote);
      fixture.detectChanges();
      const composant = fixture.debugElement.children[0].componentInstance as UiTiroir;
      return { fixture, composant };
    }

    it('se ferme après un glissement tactile de 120 px', () => {
      const { fixture, composant } = tiroir();
      composant.debutGlissement({ pointerType: 'touch', clientX: 100 });
      composant.glissement({ clientX: 220 });
      composant.finGlissement();
      fixture.detectChanges();
      expect(fixture.componentInstance.ouverte()).toBe(false);
    });

    it('reste ouvert après un glissement de 40 px', () => {
      const { fixture, composant } = tiroir();
      composant.debutGlissement({ pointerType: 'touch', clientX: 100 });
      composant.glissement({ clientX: 140 });
      composant.finGlissement();
      fixture.detectChanges();
      expect(fixture.componentInstance.ouverte()).toBe(true);
    });

    it('apparaît immédiatement, sans glissement, quand le mouvement est réduit', () => {
      const { fixture } = tiroir();
      const dialogue = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
      expect(dialogue.hasAttribute('open')).toBe(true);
      // L'animation d'entrée n'existe que sous motion-safe: : aucune classe d'animation hors de ce préfixe.
      expect(dialogue.className).not.toMatch(/(^|\s)(open:)?animate-/);
    });
  });

  describe('uiConfirmer', () => {
    @Component({
      imports: [UiConfirmer],
      template: `<button uiConfirmer nomCible="Chaise Fil" (confirme)="suppressions = suppressions + 1"></button>`,
    })
    class Hote {
      suppressions = 0;
    }

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('exécute l\'action une seule fois après deux clics dans les 3 s', () => {
      const fixture = TestBed.createComponent(Hote);
      fixture.detectChanges();
      const bouton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      bouton.click();
      fixture.detectChanges();
      expect(bouton.textContent).toContain('Confirmer (3)');
      expect(bouton.textContent).toContain('Cliquez de nouveau pour confirmer la suppression de Chaise Fil');
      vi.advanceTimersByTime(1000);
      fixture.detectChanges();
      expect(bouton.textContent).toContain('Confirmer (2)');
      bouton.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.suppressions).toBe(1);
      expect(bouton.textContent).toContain('Supprimer');
    });

    it('revient à « Supprimer » sans rien faire après 3 s', () => {
      const fixture = TestBed.createComponent(Hote);
      fixture.detectChanges();
      const bouton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      bouton.click();
      vi.advanceTimersByTime(3000);
      fixture.detectChanges();
      expect(bouton.textContent?.trim()).toBe('Supprimer');
      expect(fixture.componentInstance.suppressions).toBe(0);
    });
  });

  describe('ui-onglets', () => {
    @Component({
      imports: [UiOnglets],
      template: `<ui-onglets libelle="Authentification" [onglets]="onglets" [(selection)]="selection" />`,
    })
    class Hote {
      onglets: Onglet[] = [
        { cle: 'connexion', libelle: 'Connexion', panneau: 'p1' },
        { cle: 'inscription', libelle: 'Créer un compte', panneau: 'p2' },
      ];
      selection = signal('connexion');
    }

    it('passe à l\'onglet suivant avec la flèche droite', () => {
      const fixture = TestBed.createComponent(Hote);
      fixture.detectChanges();
      const [connexion, inscription] = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
      connexion.focus();
      connexion.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(fixture.componentInstance.selection()).toBe('inscription');
      expect(document.activeElement).toBe(inscription);
      expect(inscription.getAttribute('aria-selected')).toBe('true');
      expect(inscription.getAttribute('aria-controls')).toBe('p2');
    });
  });
});
