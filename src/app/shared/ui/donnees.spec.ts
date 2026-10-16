import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UiSquelette, UiTuileStat } from './etats';
import { ColonneTableau, UiCellule, UiTableau } from './tableau';

interface Ligne {
  nom: string;
  prix: number;
}

describe('Données et chargements', () => {
  describe('ui-tableau', () => {
    @Component({
      imports: [UiTableau, UiCellule],
      template: `
        <ui-tableau legende="Produits" [lignes]="lignes" [colonnes]="colonnes" [recherche]="recherche">
          <ng-template uiCellule="nom" let-ligne>« {{ ligne.nom }} »</ng-template>
        </ui-tableau>
      `,
    })
    class Hote {
      lignes: Ligne[] = Array.from({ length: 23 }, (_, i) => ({ nom: `Produit ${i + 1}`, prix: ((i * 7) % 23) + 1 }));
      colonnes: ColonneTableau<Ligne>[] = [
        { cle: 'nom', libelle: 'Nom', valeur: (l) => l.nom },
        { cle: 'prix', libelle: 'Prix', valeur: (l) => l.prix, triable: true, numerique: true },
      ];
      recherche = (l: Ligne) => l.nom;
    }

    function tableau() {
      const fixture = TestBed.createComponent(Hote);
      fixture.detectChanges();
      return { fixture, element: fixture.nativeElement as HTMLElement };
    }

    const prixAffiches = (element: HTMLElement) =>
      [...element.querySelectorAll('tbody tr')].map((tr) => Number(tr.querySelectorAll('td')[1].textContent));

    it('trie par prix croissant puis décroissant avec aria-sort', () => {
      const { fixture, element } = tableau();
      const entete = element.querySelectorAll('th')[1];
      entete.querySelector('button')!.click();
      fixture.detectChanges();
      expect(entete.getAttribute('aria-sort')).toBe('ascending');
      expect(prixAffiches(element).slice(0, 3)).toEqual([1, 2, 3]);

      entete.querySelector('button')!.click();
      fixture.detectChanges();
      expect(entete.getAttribute('aria-sort')).toBe('descending');
      expect(prixAffiches(element)[0]).toBe(23);
    });

    it('pagine par 10 lignes jusqu\'à « Page 3 sur 3 »', () => {
      const { fixture, element } = tableau();
      const suivant = () => [...element.querySelectorAll('nav button')].find((b) => b.textContent?.includes('Suivant')) as HTMLButtonElement;
      suivant().click();
      fixture.detectChanges();
      suivant().click();
      fixture.detectChanges();
      expect(element.querySelector('nav')!.textContent).toContain('Page 3 sur 3');
      expect(element.querySelectorAll('tbody tr').length).toBe(3);
      expect(element.querySelector('tbody tr td')!.textContent).toContain('Produit 21');
      expect(suivant().disabled).toBe(true);
    });

    it('utilise les cellules personnalisées, nomme le tableau et filtre par la recherche', () => {
      const { fixture, element } = tableau();
      expect(element.querySelector('caption')!.textContent).toContain('Produits');
      expect(element.querySelector('tbody td')!.textContent).toContain('« Produit 1 »');
      const champ = element.querySelector('input[type="search"]') as HTMLInputElement;
      champ.value = 'produit 2';
      champ.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(element.querySelectorAll('tbody tr').length).toBe(5); // 2, 20, 21, 22, 23
    });

    it('défile horizontalement dans son propre cadre', () => {
      const { element } = tableau();
      expect(element.querySelector('table')!.parentElement!.className).toContain('overflow-x-auto');
    });
  });

  describe('tuiles et chargements', () => {
    @Component({
      imports: [UiTuileStat, UiSquelette],
      providers: [],
      template: `
        <div class="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <ui-tuile-stat libelle="Produits actifs" [valeur]="9" sousTexte="en vente" />
          <ui-tuile-stat libelle="Utilisateurs" [valeur]="4" sousTexte="comptes" />
        </div>
        <section [attr.aria-busy]="chargement()">
          @if (chargement()) {
            <ui-squelette forme="carte" [nombre]="2" />
          } @else {
            <p>Contenu chargé</p>
          }
        </section>
      `,
    })
    class Hote {
      chargement = signal(true);
    }

    beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

    it('rend la première tuile d\'une rangée en vert forêt', () => {
      const fixture = TestBed.createComponent(Hote);
      fixture.detectChanges();
      const [premiere] = fixture.nativeElement.querySelectorAll('ui-tuile-stat');
      expect(premiere.className).toContain('group/tuile');
      expect(premiere.querySelector('div').className).toContain('group-first/tuile:bg-forest');
      expect(premiere.textContent).toContain('Produits actifs');
    });

    it('remplace les squelettes par le contenu et repasse aria-busy à false', () => {
      const fixture = TestBed.createComponent(Hote);
      fixture.detectChanges();
      const section = fixture.nativeElement.querySelector('section') as HTMLElement;
      expect(section.getAttribute('aria-busy')).toBe('true');
      expect(section.querySelectorAll('[aria-hidden="true"]').length).toBe(2);
      fixture.componentInstance.chargement.set(false);
      fixture.detectChanges();
      expect(section.getAttribute('aria-busy')).toBe('false');
      expect(section.textContent).toContain('Contenu chargé');
    });
  });
});
