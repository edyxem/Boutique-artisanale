# Proposition : espace vendeur et administration

## Why

Après `parcours-achat`, les clients peuvent acheter, mais personne ne peut gérer l'offre : les produits, catégories, vendeurs, comptes et commandes ne se modifient qu'en éditant `db.json`. Ce changement donne aux vendeurs la gestion de leurs produits et à l'administrateur le pilotage de toute la boutique, dans le style de l'administration du template.

## What Changes

- **Devenir artisan** (`/devenir-vendeur`) : un client demande à ouvrir une boutique, depuis le lien « Devenir artisan » du pied de page ou de son espace client ; la demande est `en_attente` jusqu'à la décision de l'administrateur.
- **Espace vendeur** (`/vendeur`, menu latéral vert forêt de l'admin) : CRUD de ses seuls produits (tableau du template avec recherche, tri et pagination ; formulaire unique en fenêtre modale avec choix et aperçu de la photo ; suppression par confirmation en deux clics), et liste de ses ventes.
- **Administration** (`/admin`, menu latéral du template) :
  - aperçu (quatre tuiles de statistique) ;
  - CRUD des catégories et des produits (bouton « Nouveau produit ») ;
  - vendeurs : valider ou refuser une demande, désactiver ou réactiver un vendeur ;
  - utilisateurs : changer le rôle, activer ou désactiver un compte ;
  - commandes : liste, détail, changement de statut ; l'annulation remet le stock.
- Partout : confirmation en deux clics avant suppression, fenêtre modale avant les autres actions sensibles, toast après chaque action.
- L'API simulée applique les règles d'écriture : un vendeur ne modifie que ses produits, un produit commandé ou une catégorie utilisée ne se suppriment pas, la validation d'un vendeur lui donne le rôle `vendeur`.

## Rôles concernés

- **Client** : demande « Devenir artisan », suivi de sa demande ; accès refusé à `/vendeur` et `/admin`.
- **Vendeur** : espace vendeur (ses produits, ses ventes) ; accès refusé à `/devenir-vendeur` et `/admin`.
- **Administrateur** : toute l'administration ; accès refusé à `/devenir-vendeur` et `/vendeur`.
- **Visiteur** : redirigé vers la connexion sur toutes ces pages.

## Hors périmètre

- Téléversement d'images : les photos sont choisies dans la bibliothèque du site (`design-template/images/`).
- Éléments de l'aperçu du template qui supposent des fonctions absentes du plan : chiffre d'affaires, graphique des ventes sur 7 jours, « Stock à surveiller » et réassort « +10 », colonnes commandes / total des clients.
- Statistiques avancées, e-mails, paiement et remboursement.
- Suppression de comptes utilisateurs et de vendeurs : on les désactive.
- Gestion des commandes par le vendeur (il les consulte, l'administrateur change leur statut).
- Messagerie entre vendeur et administrateur, motif de refus.

## Capabilities

### New Capabilities

- `espace-vendeur` : demande « Devenir vendeur » et son suivi, accès à la demande, gestion par un vendeur de ses produits, liste de ses ventes, règle de non-suppression des produits commandés.
- `administration` : panel `/admin` (navigation, aperçu), gestion des catégories, des produits, des vendeurs, des utilisateurs et des commandes.

### Modified Capabilities

Aucune. La visibilité des produits (`catalogue`), la remise en stock (`commande`), les règles d'accès (`auth`) et le design (`charte-graphique`, `composants-ui`, `animations`) couvrent déjà ces nouveaux acteurs.

## Impact

- **Prérequis** : `design-template`, `socle-et-auth` et `parcours-achat` implémentés et archivés.
- **Code** : `src/app/features/vendeur`, `src/app/features/admin`, `src/app/features/devenir-vendeur` ; formulaire produit partagé (`shared/produit-formulaire`) ; services `CategorieService`, `ProduitService`, `VendeurService`, `UtilisateurService` (nouveau), `CommandeService` étendus aux écritures ; lien « Devenir artisan » du pied de page et bouton de l'espace client.
- **Interface** : uniquement les composants de `shared/ui` (`ui-tableau`, `ui-modale`, `uiConfirmer`, toasts).
- **API simulée** : middlewares d'écriture dans `api/server.cjs` (produits, catégories, vendeurs, utilisateurs, transitions de commande).
