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
    } else {
      // L'administrateur ne fait avancer le statut que selon les transitions permises.
      if (!transitionsPermises(commande.statut).includes(req.body?.statut)) {
        return res.status(409).jsonp('Transition de statut non permise');
      }
      req.body = { statut: req.body.statut };
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

/** Transitions de statut d'une commande (dupliquées dans core/services/transitions.ts, mêmes cas de test). */
function transitionsPermises(statut) {
  return { en_attente: ['expediee', 'annulee'], expediee: ['livree', 'annulee'] }[statut] ?? [];
}

const normaliser = (texte) => String(texte ?? '').trim().toLowerCase();
const refuser = (res, statut, message) => res.status(statut).jsonp(message);

/**
 * Règles d'écriture de la gestion (vendeurs, utilisateurs, produits, catégories) :
 * l'interface les reflète, mais c'est ici qu'elles sont garanties.
 */
function reglesGestion(req, res, next) {
  const [, ressource, id] = req.path.split('/');
  const ecriture = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!ecriture || !['vendeurs', 'users', 'produits', 'categories'].includes(ressource)) {
    return next();
  }
  if (ressource === 'users' && req.method === 'POST') {
    return next(); // inscription : reglesComptes
  }
  const utilisateur = auteur(req);
  if (!utilisateur) {
    return refuser(res, 401, 'Connexion requise');
  }
  const admin = utilisateur.role === 'admin';
  const db = router.db;

  if (ressource === 'vendeurs') {
    if (req.method === 'POST' && !id) {
      if (utilisateur.role !== 'client') {
        return refuser(res, 403, 'Réservé aux clients');
      }
      if (db.get('vendeurs').find({ utilisateurId: utilisateur.id }).value()) {
        return refuser(res, 409, 'Une demande existe déjà');
      }
      const nom = normaliser(req.body?.nomBoutique);
      if (db.get('vendeurs').value().some((v) => normaliser(v.nomBoutique) === nom)) {
        return refuser(res, 409, 'Nom de boutique déjà utilisé');
      }
      req.body = { utilisateurId: utilisateur.id, nomBoutique: String(req.body.nomBoutique).trim(), description: req.body.description, statut: 'en_attente' };
      return next();
    }
    if (!admin) {
      return refuser(res, 403, "Réservé à l'administrateur");
    }
    const vendeur = db.get('vendeurs').find({ id: Number(id) }).value();
    if (vendeur && req.method !== 'DELETE') {
      const statut = req.body?.statut;
      if (statut !== undefined && statut !== vendeur.statut) {
        if (vendeur.statut !== 'en_attente' || !['valide', 'refuse'].includes(statut)) {
          return refuser(res, 409, 'Transition de statut non permise');
        }
        if (statut === 'valide') {
          db.get('users').find({ id: vendeur.utilisateurId }).assign({ role: 'vendeur' }).write();
        }
      }
    }
    return next();
  }

  if (ressource === 'users') {
    if (!admin) {
      return refuser(res, 403, "Réservé à l'administrateur");
    }
    if (Number(id) === utilisateur.id) {
      return refuser(res, 403, 'Impossible de modifier son propre compte');
    }
    const cible = db.get('users').find({ id: Number(id) }).value();
    if (cible && req.body?.role !== undefined && req.body.role !== cible.role) {
      const titulaire = db.get('vendeurs').find({ utilisateurId: cible.id, statut: 'valide' }).value();
      if (req.body.role === 'vendeur' || titulaire) {
        return refuser(res, 409, 'Le rôle vendeur se gère depuis la page Vendeurs');
      }
    }
    if (req.body) {
      delete req.body.password; // jamais de mot de passe modifié par cette voie
    }
    return next();
  }

  if (ressource === 'produits') {
    const boutique = db.get('vendeurs').find({ utilisateurId: utilisateur.id, statut: 'valide' }).value();
    if (!admin && !(utilisateur.role === 'vendeur' && boutique)) {
      return refuser(res, 403, "Réservé aux vendeurs et à l'administrateur");
    }
    if (req.method === 'POST' && !id) {
      if (!admin) {
        req.body = { ...req.body, vendeurId: boutique.id };
      }
      return next();
    }
    const produit = db.get('produits').find({ id: Number(id) }).value();
    if (!produit) {
      return next();
    }
    if (!admin && produit.vendeurId !== boutique.id) {
      return refuser(res, 403, "Produit d'un autre vendeur");
    }
    if (!admin && req.body?.vendeurId !== undefined) {
      req.body.vendeurId = boutique.id;
    }
    if (req.method === 'DELETE') {
      const commande = db.get('commandes').value().some((c) => (c.lignes ?? []).some((l) => l.produitId === produit.id));
      if (commande) {
        return refuser(res, 409, 'Produit présent dans des commandes');
      }
    }
    return next();
  }

  // categories
  if (!admin) {
    return refuser(res, 403, "Réservé à l'administrateur");
  }
  if (req.method === 'DELETE') {
    if (db.get('produits').find({ categorieId: Number(id) }).value()) {
      return refuser(res, 409, 'Catégorie utilisée par des produits');
    }
    return next();
  }
  const autres = db.get('categories').value().filter((c) => c.id !== Number(id));
  if (req.body?.nom !== undefined && autres.some((c) => normaliser(c.nom) === normaliser(req.body.nom))) {
    return refuser(res, 409, 'Nom de catégorie déjà utilisé');
  }
  if (req.body?.slug !== undefined && autres.some((c) => c.slug === req.body.slug)) {
    return refuser(res, 409, 'Slug déjà utilisé');
  }
  return next();
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
app.use(reglesGestion);
app.use(auth);
app.use(router);

app.listen(PORT, () => {
  console.log(`API Flowering prête sur http://localhost:${PORT}`);
});

module.exports = { app, router };
