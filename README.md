# FLOWERING — boutique artisanale

Boutique en ligne de produits artisanaux, développée avec Angular 22 et une fausse API json-server.

## Prérequis

- Node.js et npm
- Installer les dépendances : `npm install`

## Lancer le projet

| Commande | Effet |
| --- | --- |
| `npm run dev` | Lance l'API simulée **et** Angular ensemble (Ctrl+C arrête les deux) |
| `npm run api` | Lance seulement l'API simulée sur <http://localhost:3000> |
| `npm start` | Lance seulement Angular sur <http://localhost:4200> |

## API simulée

L'API est fournie par [json-server](https://github.com/typicode/json-server) 0.17 et [json-server-auth](https://github.com/jeremyben/json-server-auth), à partir du fichier `db.json`.

Ressources : `/users`, `/vendeurs`, `/categories`, `/produits`, `/commandes`.
Authentification : `POST /register` et `POST /login` (jeton JWT simulé).

### Comptes de démonstration

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| Administrateur | `admin@boutique.fr` | `Admin123!` |
| Client | `client@boutique.fr` | `Client123!` |
| Vendeur (boutique validée) | `vendeur1@boutique.fr` | `Vendeur123!` |
| Vendeur (boutique en attente) | `vendeur2@boutique.fr` | `Vendeur123!` |

Les mots de passe sont stockés hachés (bcrypt) dans `db.json`.

### Restaurer les données d'exemple

json-server réécrit `db.json` à chaque création, modification ou suppression. Pour revenir aux données d'origine :

```bash
git checkout db.json
```

## Organisation du code

- `src/app/core` : layout, modèles, configuration et services globaux
- `src/app/shared` : composants et pages réutilisables
- `src/app/features` : une section par fonctionnalité (catalogue, panier, commande, compte, vendeur, admin)

## Tests et build

```bash
npm test         # tests unitaires (Vitest)
npx ng build     # build de production dans dist/
```
