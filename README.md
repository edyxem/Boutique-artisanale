# Flowering — boutique artisanale

Boutique en ligne d'objets faits main, développée avec Angular 22 et Tailwind 4, sur une API simulée json-server.
Le design est celui de `design-template/` (voir `design-template/DESIGN.md`).

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

`api/server.cjs` démarre [json-server](https://github.com/typicode/json-server) 0.17 et
[json-server-auth](https://github.com/jeremyben/json-server-auth) sur `db.json`, avec les règles de la boutique :

- `POST /register` crée toujours un compte **client actif**, quel que soit le rôle envoyé ;
- un compte désactivé ne peut pas se connecter (`POST /login` répond 403) ;
- le champ `password` n'est jamais renvoyé par `/users`.

Ressources : `/users`, `/vendeurs`, `/categories`, `/produits`, `/commandes`.
Authentification : `POST /register` et `POST /login` renvoient un jeton JWT valable **1 heure** ; ensuite, il faut se reconnecter.
La clé de signature du jeton est publique (json-server-auth) : cette API sert uniquement au développement.

### Comptes de démonstration

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| Administrateur | `admin@boutique.fr` | `Admin123!` |
| Client | `client@boutique.fr` | `Client123!` |
| Vendeur (Atelier Grès & Sel) | `vendeur1@boutique.fr` | `Vendeur123!` |
| Vendeur (Menuiserie Lebrun) | `vendeur2@boutique.fr` | `Vendeur123!` |

Les mots de passe sont stockés hachés (bcrypt) dans `db.json`.

### Données d'exemple

10 produits du template (photos de `public/images/`), répartis en 4 univers (Céramique, Mobilier, Cuisine, Maison)
et 2 ateliers. « Mugs mouchetés » est épuisé et « Bols en bois tourné » est inactif, pour tester ces cas.

### Restaurer les données d'exemple

json-server réécrit `db.json` à chaque création, modification ou suppression. Pour revenir aux données d'origine :

```bash
git checkout db.json
```

## Organisation du code

- `src/styles/` : jetons du design (`@theme`), styles de base et animations
- `src/app/core` : layout, modèles, authentification, services globaux
- `src/app/shared` : composants d'interface (`shared/ui`), animations et pages communes
- `src/app/features` : une section par fonctionnalité

## Tests et vérifications

```bash
npm test                     # tests unitaires (Vitest)
npx ng build                 # build de production dans dist/
npm run verifier:couleurs    # aucune couleur ni valeur hors des jetons du design
npm run verifier:api         # règles de l'API sur une copie temporaire de db.json
npm run verifier:rendu       # avec npm run dev lancé : captures, axe-core, CLS, focus (Chrome ou Edge)
```
