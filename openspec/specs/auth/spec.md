# auth Specification

## Purpose
Donner à la boutique son cadre de navigation commun et identifier ses utilisateurs : inscription des clients, connexion et déconnexion de tous les rôles, session conservée dans le navigateur et accès aux sections selon le rôle.

## Requirements

### Requirement: Layout global

Toutes les pages SHALL être affichées dans un layout composé d'un en-tête, d'une zone de contenu principal et d'un pied de page, exposés comme régions d'accessibilité (bannière, contenu principal, informations de contenu). Le premier élément focalisable MUST être un lien « Aller au contenu principal » qui place le focus sur le contenu principal.

#### Scenario: Le layout entoure chaque page

- **GIVEN** un visiteur ouvre l'application
- **WHEN** n'importe quelle page est affichée
- **THEN** la page contient une seule région d'en-tête, une seule région de contenu principal et une seule région de pied de page

#### Scenario: Accès direct au contenu au clavier

- **GIVEN** un visiteur qui navigue au clavier
- **WHEN** il appuie une première fois sur Tabulation puis active « Aller au contenu principal »
- **THEN** le focus est placé sur la zone de contenu principal

### Requirement: Menu principal selon le rôle

L'en-tête SHALL afficher le logo « Flowering » lié à l'accueil `/`, un bouton du panier, un bouton de compte et une navigation « Navigation principale » dont les liens dépendent du rôle : « Boutique » (`/catalogue`) et « Nos artisans » (section « Comment fonctionne Flowering » de l'accueil) pour tous ; « Espace vendeur » pour un vendeur ; « Admin » pour un administrateur. Le lien de la page courante MUST être signalé comme page courante aux technologies d'assistance.

#### Scenario: Menu d'un visiteur

- **GIVEN** un visiteur non connecté
- **WHEN** il consulte l'en-tête
- **THEN** il voit « Boutique », « Nos artisans », le bouton du panier et le bouton « Connexion »
- **AND** il ne voit ni « Espace vendeur » ni « Admin »

#### Scenario: Menu d'un vendeur

- **GIVEN** un vendeur connecté
- **WHEN** il consulte l'en-tête
- **THEN** il voit « Boutique », « Nos artisans » et « Espace vendeur »
- **AND** il ne voit pas « Admin »

#### Scenario: Menu d'un administrateur

- **GIVEN** l'administrateur connecté
- **WHEN** il consulte l'en-tête
- **THEN** il voit « Boutique », « Nos artisans » et « Admin »
- **AND** il ne voit pas « Espace vendeur »

#### Scenario: Lien courant signalé

- **GIVEN** un visiteur sur `/catalogue`
- **WHEN** il consulte la navigation principale
- **THEN** seul le lien « Boutique » porte l'indication de page courante

#### Scenario: Logo vers l'accueil

- **GIVEN** un visiteur sur `/catalogue`
- **WHEN** il active le logo « Flowering »
- **THEN** il arrive sur l'accueil `/`

### Requirement: Routes des sections

L'application SHALL exposer l'accueil `/` et les sections `/catalogue`, `/panier`, `/commande`, `/compte`, `/vendeur` et `/admin`, chacune chargée à la demande à sa première visite. Le titre du document MUST être « {Titre de la page} | Flowering ». Une URL inconnue MUST afficher, dans le layout, une page « Page introuvable » avec un lien « Retour au catalogue ».

#### Scenario: Accueil

- **GIVEN** un visiteur
- **WHEN** il ouvre `/`
- **THEN** la page d'accueil s'affiche, sans redirection
- **AND** le titre du document est « Accueil | Flowering »

#### Scenario: Chargement à la demande

- **GIVEN** un visiteur qui vient d'ouvrir `/`
- **WHEN** l'application a fini son chargement initial
- **THEN** le code des sections Catalogue, Panier, Commande, Compte, Vendeur et Admin n'a pas encore été téléchargé

#### Scenario: URL inconnue

- **GIVEN** un visiteur
- **WHEN** il navigue vers `/une-page-qui-n-existe-pas`
- **THEN** la page affiche le titre « Page introuvable » et un lien « Retour au catalogue » vers `/catalogue`
- **AND** l'en-tête et le pied de page restent affichés

### Requirement: Inscription d'un client

L'onglet « Créer un compte » de la page d'authentification (`/inscription`) SHALL proposer un formulaire « Prénom et nom », e-mail, mot de passe et confirmation. Le compte créé MUST avoir le rôle `client` et être actif, même si la requête envoyée à l'API demande un autre rôle. L'utilisateur MUST être connecté dès son inscription, puis redirigé vers la page de retour demandée ou vers `/catalogue`, avec une notification de bienvenue.

#### Scenario: Inscription réussie

- **GIVEN** un visiteur sur `/inscription`
- **WHEN** il saisit « Awa Koné », `awa@exemple.fr`, et `Secret123!` deux fois, puis valide
- **THEN** un compte `client` actif est créé et il est connecté sous le nom « Awa Koné »
- **AND** il est redirigé vers `/catalogue`
- **AND** la notification « Bienvenue Awa Koné, votre compte a été créé. » s'affiche

#### Scenario: Email déjà utilisé

- **GIVEN** un visiteur sur `/inscription`
- **WHEN** il valide le formulaire avec `client@boutique.fr`
- **THEN** aucun compte n'est créé
- **AND** le message « Un compte existe déjà avec cet email. » s'affiche et les champs nom et e-mail sont conservés

#### Scenario: Rôle imposé par l'API

- **GIVEN** l'API simulée est démarrée
- **WHEN** un client HTTP envoie `POST /register` avec un e-mail inédit, un mot de passe valide, `role: "admin"` et `actif: false`
- **THEN** le compte enregistré a le rôle `client` et `actif: true`

### Requirement: Validation du formulaire d'inscription

Le formulaire d'inscription SHALL bloquer l'envoi tant qu'un champ est invalide et afficher sous chaque champ invalide un message relié au champ pour les technologies d'assistance. Règles : nom requis (2 caractères minimum), e-mail requis et valide, mot de passe requis (6 caractères minimum, comme le template), confirmation identique.

#### Scenario: Champs vides

- **GIVEN** un visiteur sur `/inscription`
- **WHEN** il valide le formulaire sans rien saisir
- **THEN** aucune requête n'est envoyée
- **AND** chaque champ affiche « Ce champ est obligatoire. » et le focus va sur le premier champ invalide

#### Scenario: Valeurs invalides

- **GIVEN** un visiteur sur `/inscription`
- **WHEN** il saisit l'e-mail `awa@`, le mot de passe `abc` et la confirmation `abd`, en quittant chaque champ
- **THEN** il voit « Saisissez une adresse email valide. », « Le mot de passe doit contenir au moins 6 caractères. » et « Les mots de passe ne correspondent pas. »

### Requirement: Connexion

La page `/connexion` SHALL présenter les onglets « Connexion » et « Créer un compte » (ce dernier correspondant à `/inscription`) et, dans l'onglet « Connexion », un formulaire e-mail + mot de passe. En cas de succès, l'utilisateur MUST être connecté puis redirigé vers la page de retour demandée ou vers `/catalogue`. En cas d'échec, le message MUST ne pas révéler si l'e-mail existe. Le passage d'un onglet à l'autre MUST conserver la page de retour.

#### Scenario: Connexion réussie

- **GIVEN** un visiteur sur `/connexion`
- **WHEN** il saisit `client@boutique.fr` et le bon mot de passe, puis valide
- **THEN** il est connecté avec le rôle `client` et redirigé vers `/catalogue`

#### Scenario: Identifiants incorrects

- **GIVEN** un visiteur sur `/connexion`
- **WHEN** il saisit un e-mail inconnu, ou `client@boutique.fr` avec un mauvais mot de passe
- **THEN** il n'est pas connecté
- **AND** le message « Email ou mot de passe incorrect. » s'affiche et le mot de passe est effacé

#### Scenario: Champs requis

- **GIVEN** un visiteur sur `/connexion`
- **WHEN** il valide sans rien saisir
- **THEN** aucune requête n'est envoyée et les deux champs affichent « Ce champ est obligatoire. »

#### Scenario: API indisponible

- **GIVEN** l'API simulée est arrêtée
- **WHEN** un visiteur valide le formulaire de connexion
- **THEN** le message « Le serveur ne répond pas. Réessayez plus tard. » s'affiche

#### Scenario: Onglets et retour conservé

- **GIVEN** un visiteur sur `/connexion?retour=/commande`
- **WHEN** il active l'onglet « Créer un compte »
- **THEN** l'URL devient `/inscription?retour=/commande` et le formulaire d'inscription s'affiche

### Requirement: Compte désactivé

Un utilisateur dont le compte a `actif: false` SHALL ne pas pouvoir se connecter, même avec le bon mot de passe. L'API MUST répondre 403 sans jeton dans ce cas, et 400 si le mot de passe est faux (pour ne pas révéler l'état du compte). L'interface MUST afficher « Ce compte est désactivé. Contactez l'administrateur. ».

#### Scenario: Compte désactivé avec le bon mot de passe

- **GIVEN** un compte client existant avec `actif: false`
- **WHEN** son propriétaire se connecte avec le bon mot de passe
- **THEN** l'API répond 403 sans jeton
- **AND** il n'est pas connecté et voit « Ce compte est désactivé. Contactez l'administrateur. »

#### Scenario: Compte désactivé avec un mauvais mot de passe

- **GIVEN** un compte client existant avec `actif: false`
- **WHEN** quelqu'un tente de s'y connecter avec un mauvais mot de passe
- **THEN** l'API répond 400 et le message « Email ou mot de passe incorrect. » s'affiche

### Requirement: Espace client et déconnexion

La page `/compte` SHALL afficher « Bonjour {prénom} », l'e-mail de l'utilisateur connecté et un bouton « Se déconnecter », comme l'espace client du template. La déconnexion MUST effacer la session du navigateur et rediriger vers `/catalogue`.

#### Scenario: En-tête de l'espace client

- **GIVEN** le client « Lucas Martin » connecté
- **WHEN** il ouvre `/compte`
- **THEN** il voit « Bonjour Lucas », `client@boutique.fr` et le bouton « Se déconnecter »

#### Scenario: Déconnexion

- **GIVEN** un client connecté sur `/compte`
- **WHEN** il active « Se déconnecter »
- **THEN** il n'est plus connecté et arrive sur `/catalogue`
- **AND** après un rechargement de la page, il est toujours déconnecté

### Requirement: Session conservée dans le navigateur

La session (jeton et utilisateur connecté, sans mot de passe) SHALL être conservée dans le navigateur et restaurée au chargement de l'application tant que le jeton n'a pas expiré. Une session expirée ou illisible MUST être effacée au chargement.

#### Scenario: Rechargement de la page

- **GIVEN** un vendeur connecté
- **WHEN** il recharge la page
- **THEN** il est toujours connecté avec le même nom et le même rôle

#### Scenario: Jeton expiré au chargement

- **GIVEN** une session enregistrée dont le jeton a expiré
- **WHEN** l'application se charge
- **THEN** l'utilisateur est un visiteur et la session enregistrée est effacée

### Requirement: Jeton joint aux requêtes de l'API

Toute requête vers l'API de la boutique émise pendant une session SHALL porter l'en-tête `Authorization: Bearer {jeton}`. Les requêtes vers d'autres domaines MUST ne jamais le porter. Une réponse 401 de l'API à une requête autre que `/login` ou `/register` MUST déconnecter l'utilisateur et le rediriger vers la connexion avec retour à la page courante et le message « Votre session a expiré. Veuillez vous reconnecter. ».

#### Scenario: Jeton ajouté pour l'API

- **GIVEN** un client connecté
- **WHEN** l'application envoie une requête à `http://localhost:3000/commandes`
- **THEN** la requête porte `Authorization: Bearer {jeton du client}`

#### Scenario: Pas de jeton ailleurs ni pour un visiteur

- **GIVEN** un client connecté, puis un visiteur
- **WHEN** l'application envoie une requête vers un autre domaine, puis le visiteur une requête à `http://localhost:3000/produits`
- **THEN** aucune des deux requêtes ne porte d'en-tête `Authorization`

#### Scenario: Jeton refusé par l'API

- **GIVEN** un client connecté sur `/compte` dont le jeton n'est plus accepté
- **WHEN** l'API répond 401 à une requête
- **THEN** il est déconnecté et redirigé vers `/connexion?retour=/compte` avec le message de session expirée

### Requirement: Bouton de compte dans l'en-tête

L'en-tête SHALL afficher, pour un visiteur, un bouton « Connexion » qui mène à `/connexion` en conservant la page courante comme page de retour ; pour un utilisateur connecté, un bouton portant son prénom qui mène à `/compte`. L'affichage MUST se mettre à jour sans rechargement.

#### Scenario: Bouton d'un visiteur

- **GIVEN** un visiteur sur `/panier`
- **WHEN** il active « Connexion » dans l'en-tête
- **THEN** il arrive sur `/connexion?retour=/panier`

#### Scenario: Bouton après connexion

- **GIVEN** l'administrateur « Mariam Diallo » vient de se connecter
- **WHEN** il consulte l'en-tête
- **THEN** le bouton de compte affiche « Mariam » et mène à `/compte`, et « Connexion » n'est plus affiché

### Requirement: Règles d'accès aux sections

L'accès SHALL suivre ces règles, sous-pages comprises : `/`, `/catalogue`, `/panier`, `/connexion`, `/inscription` ouverts à tous ; `/compte` et `/commande` réservés aux utilisateurs connectés, quel que soit le rôle ; `/vendeur` réservé au rôle `vendeur` ; `/admin` réservé au rôle `admin`. Le code d'une section réservée MUST ne pas être téléchargé pour un utilisateur non autorisé.

#### Scenario: Sections publiques

- **GIVEN** un visiteur non connecté
- **WHEN** il navigue vers `/`, `/catalogue` puis `/panier`
- **THEN** chaque page s'affiche sans redirection

#### Scenario: Accès autorisés

- **GIVEN** un client, un vendeur puis l'administrateur, chacun connecté
- **WHEN** le client ouvre `/compte` et `/commande`, le vendeur `/vendeur`, l'administrateur `/admin`
- **THEN** chaque page s'affiche sans redirection

#### Scenario: Accès refusé aux visiteurs

- **GIVEN** un visiteur non connecté
- **WHEN** il navigue vers `/compte`, `/commande`, `/vendeur` ou `/admin/produits`
- **THEN** il est redirigé vers `/connexion?retour={url demandée}`
- **AND** la page affiche « Connectez-vous pour accéder à cette page. »

#### Scenario: Accès refusé à l'espace vendeur

- **GIVEN** un client connecté, puis l'administrateur connecté
- **WHEN** chacun navigue vers `/vendeur`
- **THEN** il est redirigé vers `/acces-refuse`

#### Scenario: Accès refusé à l'administration

- **GIVEN** un client connecté, puis un vendeur connecté
- **WHEN** chacun navigue vers `/admin`
- **THEN** il est redirigé vers `/acces-refuse`

### Requirement: Retour à la page demandée après connexion

Après une connexion ou une inscription réussie, l'utilisateur SHALL arriver sur l'URL passée dans le paramètre `retour`, paramètres compris. Seuls les chemins internes (commençant par un seul `/`) MUST être acceptés ; toute autre valeur renvoie vers `/catalogue`. Si l'URL demandée est réservée à un autre rôle, l'utilisateur MUST arriver sur `/acces-refuse`.

#### Scenario: Retour à la page demandée

- **GIVEN** un visiteur redirigé vers `/connexion?retour=/admin/produits`
- **WHEN** il se connecte avec le compte administrateur
- **THEN** il arrive sur `/admin/produits`

#### Scenario: Retour externe ignoré

- **GIVEN** un visiteur sur `/connexion?retour=https://site-malveillant.example` ou `/connexion?retour=//site-malveillant.example`
- **WHEN** il se connecte avec succès
- **THEN** il arrive sur `/catalogue`

#### Scenario: Retour vers une page d'un autre rôle

- **GIVEN** un visiteur redirigé vers `/connexion?retour=/admin`
- **WHEN** il se connecte avec le compte client
- **THEN** il arrive sur `/acces-refuse`

### Requirement: Page « Accès refusé »

La page `/acces-refuse` SHALL expliquer que le compte connecté n'a pas les droits nécessaires et proposer un lien « Retour au catalogue ».

#### Scenario: Contenu de la page

- **GIVEN** un client redirigé vers `/acces-refuse`
- **WHEN** la page s'affiche
- **THEN** il voit le titre « Accès refusé » et un lien « Retour au catalogue »
