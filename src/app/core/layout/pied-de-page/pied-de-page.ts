import { Component } from '@angular/core';
import { NOM_BOUTIQUE } from '../../boutique.config';

@Component({
  selector: 'app-pied-de-page',
  template: `
    <footer class="border-t border-stone-200 bg-stone-50">
      <div class="mx-auto max-w-6xl px-4 py-6 text-sm text-stone-700">
        <p class="font-semibold tracking-widest text-emerald-800">{{ nomBoutique }}</p>
        <p>© {{ nomBoutique }} — Produits artisanaux faits main.</p>
      </div>
    </footer>
  `,
})
export class PiedDePage {
  protected readonly nomBoutique = NOM_BOUTIQUE;
}
