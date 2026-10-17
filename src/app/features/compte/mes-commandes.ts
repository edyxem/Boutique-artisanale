import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { Commande, Produit } from '../../core/models';
import { CommandeService } from '../../core/services/commande.service';
import { ProduitService } from '../../core/services/produit.service';
import { PrixPipe } from '../../shared/format';
import { NotificationService, UiBouton, UiEtatErreur, UiModale, UiSquelette, UiStatut } from '../../shared/ui';

interface CommandeAffichee extends Commande {
  articles: string;
  vignettes: string[];
}

function decrire(commande: Commande, produits: readonly Produit[]): CommandeAffichee {
  const lignes = commande.lignes.map((ligne) => ({ ligne, produit: produits.find((p) => p.id === ligne.produitId) }));
  return {
    ...commande,
    articles: lignes.map(({ ligne, produit }) => (produit?.nom ?? 'Produit retiré') + (ligne.quantite > 1 ? ` × ${ligne.quantite}` : '')).join(', '),
    vignettes: lignes.flatMap(({ produit }) => (produit ? [produit.images[0]] : [])).slice(0, 3),
  };
}

/** « Mes commandes » de l'espace client du template, avec annulation des commandes en attente. */
@Component({
  selector: 'app-mes-commandes',
  imports: [DatePipe, NgOptimizedImage, RouterLink, PrixPipe, UiBouton, UiEtatErreur, UiModale, UiSquelette, UiStatut],
  template: `
    <section class="flex flex-col gap-4" aria-labelledby="titre-mes-commandes" [attr.aria-busy]="commandes.isLoading()">
      <h2 id="titre-mes-commandes" class="text-prix">Mes commandes</h2>
      @if (commandes.isLoading()) {
        <ui-squelette forme="ligne" [nombre]="3" />
      } @else if (commandes.error()) {
        <ui-etat-erreur message="Vos commandes sont momentanément indisponibles." (reessayer)="commandes.reload()" />
      } @else {
        <ul class="flex flex-col gap-2.5">
          @for (commande of commandes.value() ?? []; track commande.id; let i = $index) {
            <li
              class="flex flex-col gap-3 rounded-vignette bg-soft p-3 motion-safe:animate-entree sm:flex-row sm:items-center"
              [style.animation-delay]="i * 60 + 'ms'"
            >
              <div class="flex shrink-0 -space-x-3">
                @for (vignette of commande.vignettes; track $index) {
                  <span class="relative size-10 overflow-hidden rounded-mini bg-line ring-2 ring-soft">
                    <img [ngSrc]="vignette" alt="" fill class="object-cover" />
                  </span>
                }
              </div>
              <div class="min-w-0 flex-1">
                <p>{{ commande.articles }}</p>
                <p class="text-sm text-muted">n° {{ commande.id }} · {{ commande.dateCreation | date: 'd MMM' }}</p>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <ui-statut [statut]="commande.statut" />
                <span class="font-medium tabular-nums">{{ commande.total | prix }}</span>
                @if (commande.statut === 'en_attente') {
                  <button uiBouton variante="contour" taille="petit" type="button" (click)="aAnnuler.set(commande)">Annuler la commande</button>
                }
              </div>
            </li>
          } @empty {
            <li class="flex flex-col items-start gap-3 rounded-vignette bg-soft p-5">
              <p>Vous n'avez pas encore passé de commande.</p>
              <a uiBouton variante="contour" taille="petit" routerLink="/catalogue">Découvrir la boutique</a>
            </li>
          }
        </ul>
      }
    </section>

    <ui-modale [titre]="'Annuler la commande n° ' + (aAnnuler()?.id ?? '')" [ouverte]="!!aAnnuler()" (ouverteChange)="!$event && aAnnuler.set(null)">
      <p>Voulez-vous vraiment annuler la commande n° {{ aAnnuler()?.id }} ?</p>
      <div class="flex flex-col gap-2 sm:flex-row-reverse">
        <button uiBouton variante="danger" type="button" [chargement]="envoi()" (click)="annuler()">Oui, annuler</button>
        <button uiBouton variante="contour" type="button" (click)="aAnnuler.set(null)">Non</button>
      </div>
    </ui-modale>
  `,
})
export class MesCommandes {
  private readonly service = inject(CommandeService);
  private readonly produits = inject(ProduitService);
  private readonly notifications = inject(NotificationService);

  protected readonly aAnnuler = signal<Commande | null>(null);
  protected readonly envoi = signal(false);

  protected readonly commandes = rxResource({
    stream: () =>
      this.service.listerMiennes().pipe(
        switchMap((commandes) =>
          this.produits
            .parIdentifiants(commandes.flatMap((c) => c.lignes.map((l) => l.produitId)))
            .pipe(map((produits) => commandes.map((commande) => decrire(commande, produits)))),
        ),
      ),
  });

  protected annuler(): void {
    const commande = this.aAnnuler();
    if (!commande || this.envoi()) {
      return;
    }
    this.envoi.set(true);
    this.service.annuler(commande.id).subscribe({
      next: (miseAJour) => {
        this.envoi.set(false);
        this.aAnnuler.set(null);
        this.commandes.update((liste) => liste?.map((c) => (c.id === miseAJour.id ? { ...c, statut: miseAJour.statut } : c)));
        this.notifications.succes(`La commande n° ${commande.id} a été annulée.`);
      },
      error: () => {
        this.envoi.set(false);
        this.notifications.erreur('L\'annulation a échoué. Réessayez.');
      },
    });
  }
}
