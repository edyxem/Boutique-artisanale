import { Component, DestroyRef, ElementRef, effect, inject, input, model, viewChild } from '@angular/core';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { UiBouton } from '../../../shared/ui';
import { LienSite } from '../navigation';

/** Menu mobile plein écran du template (sous 820 px) : grands liens, fermeture par Échap, bouton ou navigation. */
@Component({
  selector: 'app-menu-mobile',
  imports: [RouterLink, UiBouton],
  template: `
    <dialog
      #dialogue
      aria-label="Menu"
      class="m-0 h-dvh max-h-dvh w-full max-w-none bg-bg p-0 text-ink backdrop:bg-voile open:motion-safe:animate-fondu"
      (cancel)="$event.preventDefault(); fermer()"
      (close)="ouvert.set(false)"
    >
      <div class="flex h-full flex-col gap-8 px-4 pt-4 pb-10">
        <div class="flex justify-end">
          <button uiBouton variante="icone" type="button" aria-label="Fermer le menu" (click)="fermer()">
            <span class="relative block size-4" aria-hidden="true">
              <span class="absolute inset-x-0 top-1/2 h-px rotate-45 bg-current motion-safe:animate-croix-haut"></span>
              <span class="absolute inset-x-0 top-1/2 h-px -rotate-45 bg-current motion-safe:animate-croix-bas"></span>
            </span>
          </button>
        </div>
        <nav aria-label="Menu mobile">
          <ul class="flex flex-col gap-3 text-mnav leading-titre">
            @for (lien of tousLesLiens(); track lien.libelle; let i = $index) {
              <li class="motion-safe:animate-entree" [style.animation-delay]="i * 40 + 'ms'">
                <a [routerLink]="lien.chemin" [queryParams]="lien.parametres" [fragment]="lien.fragment" (click)="fermer()">{{
                  lien.libelle
                }}</a>
              </li>
            }
          </ul>
        </nav>
      </div>
    </dialog>
  `,
})
export class MenuMobile {
  readonly ouvert = model(false);
  readonly univers = input<LienSite[]>([]);
  readonly liens = input<LienSite[]>([]);

  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');
  private origine: HTMLElement | null = null;

  protected tousLesLiens(): LienSite[] {
    return [{ chemin: '/', libelle: 'Accueil' }, ...this.liens(), ...this.univers()];
  }

  constructor() {
    effect(() => {
      const element = this.dialogue().nativeElement;
      if (this.ouvert() && !element.open) {
        this.origine = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (typeof element.showModal === 'function') {
          element.showModal();
        } else {
          element.setAttribute('open', '');
        }
      } else if (!this.ouvert() && element.open) {
        this.fermerDialogue(element);
      }
    });
    const abonnement = inject(Router)
      .events.pipe(filter((evenement) => evenement instanceof NavigationStart))
      .subscribe(() => this.fermer());
    inject(DestroyRef).onDestroy(() => abonnement.unsubscribe());
  }

  fermer(): void {
    this.ouvert.set(false);
  }

  private fermerDialogue(element: HTMLDialogElement): void {
    if (typeof element.close === 'function') {
      element.close();
    } else {
      element.removeAttribute('open');
    }
    this.origine?.focus();
    this.origine = null;
  }
}
