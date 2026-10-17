# Tâches : socle et authentification

## 1. Prérequis

- [x] 1.1 Vérifier que `design-template` est appliqué (composants `shared/ui`, thème, photos dans `public/images/`) et que `npm test` passe
- [x] 1.2 Ajouter `bcryptjs` en dépendance de développement directe ; vérifier qu'il figure dans `package.json`

## 2. Données et API simulée

- [x] 2.1 Ajouter `AdresseLivraison` et l'utiliser dans `Commande` ; mettre à jour `commande.model.spec.ts` (« Commande conforme acceptée par le typage », « Statut inconnu refusé par le typage ») ; vérifier avec `npm test`
- [x] 2.2 Réécrire `db.json` avec les produits, catégories et boutiques du template (design.md section 2) et leurs photos `/images/…` ; mettre à jour `db.spec.ts` (« Volumes attendus », « Répartition des rôles », « Cas limites présents », « Photos du template », « Aucun mot de passe en clair », modèles Utilisateur, Vendeur, Catégorie, Produit) ; vérifier avec `npm test`
- [x] 2.3 Créer `api/server.cjs` (json-server + `reglesComptes` + json-server-auth + retrait de `password` des réponses `users`) et remplacer le script `api` par `node api/server.cjs` ; vérifier que `GET /produits` renvoie 10 produits
- [x] 2.4 Vérifier avec `curl` sur `npm run api` : « Ressource inexistante », « Mot de passe absent des réponses », « Connexion d'un compte de démonstration », « Rôle imposé par l'API », « Compte désactivé avec le bon mot de passe » et « … avec un mauvais mot de passe » (compte passé à `actif: false` par `PATCH`), puis restaurer `db.json`
- [x] 2.5 Vérifier « Lancer l'API et Angular ensemble » et « Arrêt groupé » avec `npm run dev`, puis mettre à jour le README (serveur, règles des comptes, jeton d'1 h, comptes de démonstration, produits du template)

## 3. Session, layout et routes

- [x] 3.1 Créer `core/auth/session.model.ts` (`UtilisateurConnecte`, `Session`, `ReponseAuth`, `ErreurAuth`) ; vérifier la compilation
- [x] 3.2 Créer l'ossature d'`AuthService` (signal de session, `computed` publics dont `prenom`, sans appels HTTP) ; vérifier la compilation
- [x] 3.3 Remplir la zone droite de l'en-tête et le menu mobile (liens selon le rôle, bouton panier, bouton de compte) ; tester « Menu d'un visiteur », « Menu d'un vendeur », « Menu d'un administrateur », « Lien courant signalé » et « Logo vers l'accueil »
- [x] 3.4 Adapter `app.spec.ts` : « Le layout entoure chaque page », « Accès direct au contenu au clavier » ; vérifier avec `npm test`
- [x] 3.5 Créer la page d'accueil provisoire, `shared/pages/acces-refuse` (style de la charte) et compléter `app.routes.ts` selon design.md section 4 (sans guards pour l'instant) ; tester « Accueil », « URL inconnue », « Contenu de la page » et vérifier avec `npx ng build` un chunk par section (« Chargement à la demande »)

## 4. Session et AuthService

- [x] 4.1 Ajouter la lecture/écriture protégée de `localStorage` et le contrôle d'expiration ; tester « Rechargement de la page » et « Jeton expiré au chargement »
- [x] 4.2 Ajouter `connexion()` et la traduction des erreurs ; tester avec `HttpTestingController` la réussite, les identifiants incorrects, le compte désactivé (403) et l'API indisponible
- [x] 4.3 Ajouter `inscription()` (400 → `email-existant`), `deconnexion()` et `expirerSession()` ; tester chaque méthode (session, stockage, navigation)

## 5. Intercepteur

- [x] 5.1 Créer `jetonInterceptor` et l'enregistrer avec `provideHttpClient(withInterceptors(...))` ; tester « Jeton ajouté pour l'API » et « Pas de jeton ailleurs ni pour un visiteur »
- [x] 5.2 Gérer la réponse 401 ; tester « Jeton refusé par l'API »

## 6. Guards

- [x] 6.1 Créer `retourSur()` ; tester les chemins internes acceptés et `https://…`, `//…`, `/\…`, valeur vide renvoyés vers `/catalogue`
- [x] 6.2 Créer `exigerRole()`, `authGuard`, `vendeurGuard`, `adminGuard` ; tester visiteur (redirection avec `retour` et paramètres), mauvais rôle (`/acces-refuse`) et bon rôle
- [x] 6.3 Appliquer les guards dans `app.routes.ts` ; tester avec `RouterTestingHarness` « Sections publiques », « Accès autorisés », « Accès refusé aux visiteurs », « Accès refusé à l'espace vendeur », « Accès refusé à l'administration »

## 7. Page d'authentification

- [x] 7.1 Créer `AuthPage` (photo, panneau, `ui-onglets`, URL synchronisée avec l'onglet, encadré de démonstration en mode développement) et les routes `connexion` / `inscription` ; tester « Onglets et retour conservé »
- [x] 7.2 Créer le formulaire de connexion (`ui-champ`, `uiBouton` en chargement, message `role="alert"`, messages selon `retour` et `expire`) ; tester « Connexion réussie », « Identifiants incorrects », « Champs requis », « API indisponible », « Compte désactivé avec le bon mot de passe » (côté interface)
- [x] 7.3 Tester les retours : « Retour à la page demandée », « Retour externe ignoré », « Retour vers une page d'un autre rôle »
- [x] 7.4 Créer le formulaire d'inscription (validateur `motsDePasseIdentiques`, 6 caractères minimum, focus sur le premier champ invalide, toast de bienvenue) ; tester « Inscription réussie », « Email déjà utilisé », « Champs vides », « Valeurs invalides »

## 8. Bouton de compte et espace client

- [x] 8.1 Brancher le bouton de compte sur `AuthService` ; tester « Bouton d'un visiteur » et « Bouton après connexion »
- [x] 8.2 Créer `ComptePage` (« Bonjour {prénom} », e-mail, « Se déconnecter ») ; tester « En-tête de l'espace client » et « Déconnexion »

## 9. Vérification d'ensemble

- [x] 9.1 Parcours manuel sur `npm run dev` : inscription, déconnexion, connexion depuis `/admin/produits` avec chaque compte de démonstration, rechargement connecté, compte désactivé ; noter le résultat de chaque point
- [x] 9.2 Comparer `/connexion`, `/inscription` et `/compte` aux captures `05`, `06` et `07` du template (1440 px et 390 px) ; vérifier l'accessibilité avec axe DevTools (aucune violation) et au clavier
- [x] 9.3 Écrire les tests des scénarios : vérifier que chaque scénario des specs `donnees` et `auth` est couvert par un test automatisé ou par une vérification manuelle (2.4, 2.5, 9.1), compléter les tests manquants, puis vérifier que `npm test` et `npx ng build` passent
