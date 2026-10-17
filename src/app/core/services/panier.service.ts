import { Service, computed, effect, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ProduitAffiche, ProduitService } from './produit.service';

export const CLE_PANIER = 'flowering.panier';
/** Part du prix reversée aux artisans (bloc « Prix juste » du template). */
export const PART_ARTISANS = 0.72;

export interface LignePanier {
  produitId: number;
  quantite: number;
}

export interface LigneAffichee extends LignePanier {
  produit: ProduitAffiche;
  sousTotal: number;
}

/** Résultat d'un ajout : ajouté tel quel, plafonné au stock, ou impossible (épuisé). */
export type ResultatAjout = 'ajoute' | 'plafonne' | 'epuise';

function lirePanier(): LignePanier[] {
  try {
    const lignes = JSON.parse(localStorage.getItem(CLE_PANIER) ?? '[]') as LignePanier[];
    return Array.isArray(lignes)
      ? lignes.filter((l) => Number.isInteger(l?.produitId) && Number.isInteger(l?.quantite) && l.quantite > 0)
      : [];
  } catch {
    return [];
  }
}

/**
 * Panier du navigateur, indépendant du compte : seuls les identifiants et quantités sont enregistrés,
 * prix et stocks viennent toujours de l'API.
 */
@Service()
export class PanierService {
  private readonly produitsApi = inject(ProduitService);

  readonly #lignes = signal<LignePanier[]>(lirePanier());
  readonly #produits = signal<ReadonlyMap<number, ProduitAffiche>>(new Map());

  /** Ouverture du tiroir du panier (bouton de l'en-tête). */
  readonly tiroirOuvert = signal(false);

  readonly lignes = this.#lignes.asReadonly();
  readonly nombreArticles = computed(() => this.#lignes().reduce((total, ligne) => total + ligne.quantite, 0));
  readonly lignesAffichees = computed<LigneAffichee[]>(() =>
    this.#lignes().flatMap((ligne) => {
      const produit = this.#produits().get(ligne.produitId);
      return produit ? [{ ...ligne, produit, sousTotal: produit.prix * ligne.quantite }] : [];
    }),
  );
  readonly total = computed(() => this.lignesAffichees().reduce((total, ligne) => total + ligne.sousTotal, 0));
  readonly partArtisans = computed(() => Math.round(this.total() * PART_ARTISANS));

  constructor() {
    effect(() => {
      const lignes = this.#lignes();
      try {
        localStorage.setItem(CLE_PANIER, JSON.stringify(lignes));
      } catch {
        /* stockage indisponible : le panier reste en mémoire */
      }
    });
  }

  quantiteDe(produitId: number): number {
    return this.#lignes().find((ligne) => ligne.produitId === produitId)?.quantite ?? 0;
  }

  /** Ajoute `quantite` exemplaires, sans dépasser le stock disponible. */
  ajouter(produit: ProduitAffiche, quantite = 1): ResultatAjout {
    if (produit.stock <= 0) {
      return 'epuise';
    }
    this.memoriser(produit);
    const souhaitee = this.quantiteDe(produit.id) + quantite;
    const retenue = Math.min(souhaitee, produit.stock);
    this.ecrire(produit.id, retenue);
    return retenue < souhaitee ? 'plafonne' : 'ajoute';
  }

  /** Règle la quantité d'une ligne entre 1 et le stock ; 0 retire la ligne. */
  changerQuantite(produitId: number, quantite: number): void {
    if (quantite <= 0) {
      this.retirer(produitId);
      return;
    }
    const stock = this.#produits().get(produitId)?.stock ?? quantite;
    this.ecrire(produitId, Math.min(quantite, stock));
  }

  retirer(produitId: number): void {
    this.#lignes.update((lignes) => lignes.filter((ligne) => ligne.produitId !== produitId));
  }

  vider(): void {
    this.#lignes.set([]);
  }

  /**
   * Relit les produits depuis l'API : retire les lignes de produits qui ne sont plus visibles,
   * ramène les quantités au stock. Émet `true` si le panier a été ajusté.
   */
  synchroniser(): Observable<boolean> {
    return this.produitsApi.listerVisibles().pipe(
      tap((produits) => this.#produits.set(new Map(produits.map((p) => [p.id, p])))),
      map((produits) => {
        let ajuste = false;
        const lignes = this.#lignes().flatMap((ligne) => {
          const produit = produits.find((p) => p.id === ligne.produitId);
          if (!produit || produit.stock <= 0) {
            ajuste = true;
            return [];
          }
          if (ligne.quantite > produit.stock) {
            ajuste = true;
            return [{ ...ligne, quantite: produit.stock }];
          }
          return [ligne];
        });
        if (ajuste) {
          this.#lignes.set(lignes);
        }
        return ajuste;
      }),
    );
  }

  private memoriser(produit: ProduitAffiche): void {
    this.#produits.update((produits) => new Map(produits).set(produit.id, produit));
  }

  private ecrire(produitId: number, quantite: number): void {
    this.#lignes.update((lignes) =>
      lignes.some((l) => l.produitId === produitId)
        ? lignes.map((l) => (l.produitId === produitId ? { ...l, quantite } : l))
        : [...lignes, { produitId, quantite }],
    );
  }
}
