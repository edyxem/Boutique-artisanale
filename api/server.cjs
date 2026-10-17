// API simulée de Flowering : json-server + json-server-auth, complétés par les règles de la boutique.
// Lancement : npm run api (port 3000, données dans db.json).
const path = require('node:path');
const bcrypt = require('bcryptjs');
const jsonServer = require('json-server');
const auth = require('json-server-auth');
const jwt = require('jsonwebtoken');

/** Clé de signature des jetons de json-server-auth (publique : API de développement uniquement). */
const CLE_JWT = 'json-server-auth-123456';

const PORT = Number(process.env.PORT ?? 3000);
const FICHIER = process.env.DB_FICHIER ?? path.join(__dirname, '..', 'db.json');

const app = jsonServer.create();
const router = jsonServer.router(FICHIER);

/** Retire le mot de passe d'un utilisateur (ou d'une liste) avant de le renvoyer. */
function sansMotDePasse(donnees) {
  if (Array.isArray(donnees)) {
    return donnees.map(sansMotDePasse);
  }
  if (donnees && typeof donnees === 'object' && 'password' in donnees) {
    const { password, ...reste } = donnees;
    return reste;
  }
  return donnees;
}

/**
 * Règles des comptes :
 * - une inscription crée toujours un client actif, quel que soit le corps envoyé ;
 * - un compte désactivé ne peut pas se connecter (403), sans révéler son état si le mot de passe est faux.
 */
function reglesComptes(req, res, next) {
  const chemin = req.path.replace(/\/+$/, '');
  if (req.method === 'POST' && ['/register', '/signup', '/users'].includes(chemin)) {
    req.body = { ...req.body, role: 'client', actif: true };
  }
  if (req.method === 'POST' && chemin === '/login') {
    const { email, password } = req.body ?? {};
    const utilisateur = router.db.get('users').find({ email }).value();
    if (utilisateur && typeof password === 'string' && utilisateur.actif === false && bcrypt.compareSync(password, utilisateur.password)) {
      return res.status(403).jsonp('Compte désactivé');
    }
  }
  next();
}

/** Utilisateur actif authentifié par le jeton de la requête, ou null. */
function auteur(req) {
  const [type, jeton] = (req.headers.authorization ?? '').split(' ');
  if (type !== 'Bearer' || !jeton) {
    return null;
  }
  try {
    const { sub } = jwt.verify(jeton, CLE_JWT);
    const utilisateur = router.db.get('users').find({ id: Number(sub) }).value();
    return utilisateur && utilisateur.actif !== false ? utilisateur : null;
  } catch {
    return null;
  }
}

/** Règle de visibilité du catalogue : produit actif d'un vendeur validé dont le compte est actif. */
function estEnVente(produit) {
  if (!produit || !produit.actif) {
    return false;
  }
  const vendeur = router.db.get('vendeurs').find({ id: produit.vendeurId }).value();
  const titulaire = vendeur && router.db.get('users').find({ id: vendeur.utilisateurId }).value();
  return !!vendeur && vendeur.statut === 'valide' && !!titulaire && titulaire.actif !== false;
}

function remettreEnStock(commande) {
  for (const ligne of commande.lignes ?? []) {
    const produit = router.db.get('produits').find({ id: ligne.produitId });
    if (produit.value()) {
      produit.assign({ stock: produit.value().stock + ligne.quantite }).write();
    }
  }
}

/**
 * Règles des commandes (exécutées de façon synchrone sur la base en mémoire) :
 * - création : jeton requis, stock et visibilité contrôlés, champs fixés par le serveur, stock décrémenté ;
 * - annulation : une seule remise en stock ; un client n'annule que ses commandes en attente.
 */
function reglesCommandes(req, res, next) {
  const [, ressource, id] = req.path.split('/');
  if (ressource !== 'commandes') {
    return next();
  }
  if (req.method === 'POST' && !id) {
    const client = auteur(req);
    if (!client) {
      return res.status(401).jsonp('Connexion requise');
    }
    const demandes = Array.isArray(req.body?.lignes) ? req.body.lignes : [];
    if (!demandes.length || demandes.some((l) => !Number.isInteger(l.quantite) || l.quantite <= 0)) {
      return res.status(400).jsonp('Lignes de commande invalides');
    }
    const lignes = [];
    const indisponibles = [];
    for (const { produitId, quantite } of demandes) {
      const produit = router.db.get('produits').find({ id: produitId }).value();
      const disponible = estEnVente(produit) ? produit.stock : 0;
      if (quantite > disponible) {
        indisponibles.push({ produitId, disponible });
      } else {
        lignes.push({ produitId, quantite, prixUnitaire: produit.prix });
      }
    }
    if (indisponibles.length) {
      return res.status(409).jsonp({ indisponibles });
    }
    for (const ligne of lignes) {
      const produit = router.db.get('produits').find({ id: ligne.produitId });
      produit.assign({ stock: produit.value().stock - ligne.quantite }).write();
    }
    const total = Math.round(lignes.reduce((somme, l) => somme + l.prixUnitaire * l.quantite, 0) * 100) / 100;
    req.body = {
      clientId: client.id,
      lignes,
      total,
      adresseLivraison: req.body.adresseLivraison,
      statut: 'en_attente',
      dateCreation: new Date().toISOString(),
    };
    return next();
  }
  if (['PATCH', 'PUT'].includes(req.method) && id) {
    const utilisateur = auteur(req);
    if (!utilisateur) {
      return res.status(401).jsonp('Connexion requise');
    }
    const commande = router.db.get('commandes').find({ id: Number(id) }).value();
    if (!commande) {
      return next();
    }
    if (utilisateur.role !== 'admin') {
      if (commande.clientId !== utilisateur.id || req.body?.statut !== 'annulee' || commande.statut !== 'en_attente') {
        return res.status(403).jsonp('Action non autorisée');
      }
      req.body = { statut: 'annulee' };
    }
    if (req.body?.statut === 'annulee') {
      if (commande.statut === 'annulee') {
        return res.status(409).jsonp('Commande déjà annulée');
      }
      remettreEnStock(commande);
    }
    return next();
  }
  next();
}

router.render = (req, res) => {
  const donnees = req.path.startsWith('/users') ? sansMotDePasse(res.locals.data) : res.locals.data;
  res.jsonp(donnees);
};

app.db = router.db;
app.use(jsonServer.defaults({ logger: process.env.NODE_ENV !== 'test' }));
app.use(jsonServer.bodyParser);
app.use(reglesComptes);
app.use(reglesCommandes);
app.use(auth);
app.use(router);

app.listen(PORT, () => {
  console.log(`API Flowering prête sur http://localhost:${PORT}`);
});

module.exports = { app, router };
