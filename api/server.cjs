// API simulée de Flowering : json-server + json-server-auth, complétés par les règles de la boutique.
// Lancement : npm run api (port 3000, données dans db.json).
const path = require('node:path');
const bcrypt = require('bcryptjs');
const jsonServer = require('json-server');
const auth = require('json-server-auth');

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

router.render = (req, res) => {
  const donnees = req.path.startsWith('/users') ? sansMotDePasse(res.locals.data) : res.locals.data;
  res.jsonp(donnees);
};

app.db = router.db;
app.use(jsonServer.defaults({ logger: process.env.NODE_ENV !== 'test' }));
app.use(jsonServer.bodyParser);
app.use(reglesComptes);
app.use(auth);
app.use(router);

app.listen(PORT, () => {
  console.log(`API Flowering prête sur http://localhost:${PORT}`);
});

module.exports = { app, router };
