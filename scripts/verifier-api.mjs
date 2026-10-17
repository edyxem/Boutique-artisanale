// Vérifie les règles de l'API simulée sur une copie temporaire de db.json (le vrai fichier n'est pas modifié).
// Usage : npm run verifier:api
import { spawn } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 3900 + Math.floor(Math.random() * 90);
const BASE = `http://localhost:${PORT}`;
const dossier = mkdtempSync(join(tmpdir(), 'flowering-api-'));
const copie = join(dossier, 'db.json');
copyFileSync('db.json', copie);

const serveur = spawn(process.execPath, ['api/server.cjs'], {
  env: { ...process.env, PORT: String(PORT), DB_FICHIER: copie, NODE_ENV: 'test' },
  stdio: 'ignore',
});

export const COMPTES = {
  admin: { email: 'admin@boutique.fr', password: 'Admin123!' },
  client: { email: 'client@boutique.fr', password: 'Client123!' },
  vendeur1: { email: 'vendeur1@boutique.fr', password: 'Vendeur123!' },
  vendeur2: { email: 'vendeur2@boutique.fr', password: 'Vendeur123!' },
};

async function requete(methode, chemin, corps, jeton) {
  const reponse = await fetch(BASE + chemin, {
    method: methode,
    headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  const texte = await reponse.text();
  let donnees = texte;
  try {
    donnees = JSON.parse(texte);
  } catch {
    /* texte brut */
  }
  return { statut: reponse.status, donnees };
}

const api = {
  get: (chemin, jeton) => requete('GET', chemin, undefined, jeton),
  post: (chemin, corps, jeton) => requete('POST', chemin, corps, jeton),
  patch: (chemin, corps, jeton) => requete('PATCH', chemin, corps, jeton),
  delete: (chemin, jeton) => requete('DELETE', chemin, undefined, jeton),
  jeton: async (compte) => (await requete('POST', '/login', COMPTES[compte])).donnees.accessToken,
};

let echecs = 0;
async function scenario(nom, verifier) {
  try {
    await verifier(api);
    console.log(`✓ ${nom}`);
  } catch (erreur) {
    echecs++;
    console.log(`✗ ${nom}\n    ${erreur.message}`);
  }
}

function attendre(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ---------- donnees et auth (socle-et-auth) ----------
const SCENARIOS = [
  ['Lister les produits', async (a) => {
    const r = await a.get('/produits');
    attendre(r.statut === 200 && r.donnees.length === 10, `statut ${r.statut}, ${r.donnees.length} produits`);
  }],
  ['Ressource inexistante', async (a) => {
    const r = await a.get('/produits/9999');
    attendre(r.statut === 404, `statut ${r.statut}`);
  }],
  ['Mot de passe absent des réponses', async (a) => {
    const liste = await a.get('/users');
    const un = await a.get('/users/1');
    attendre(liste.donnees.every((u) => !('password' in u)), 'GET /users renvoie password');
    attendre(!('password' in un.donnees), 'GET /users/1 renvoie password');
  }],
  ['Connexion d\'un compte de démonstration', async (a) => {
    for (const compte of Object.keys(COMPTES)) {
      const r = await a.post('/login', COMPTES[compte]);
      attendre(r.statut === 200 && r.donnees.accessToken, `${compte} : statut ${r.statut}`);
      attendre(!('password' in r.donnees.user), `${compte} : password renvoyé`);
    }
  }],
  ['Rôle imposé par l\'API', async (a) => {
    const r = await a.post('/register', { email: 'pirate@exemple.fr', password: 'Secret123!', nom: 'Pirate', role: 'admin', actif: false });
    attendre(r.statut === 201, `statut ${r.statut}`);
    const u = await a.get(`/users/${r.donnees.user.id}`);
    attendre(u.donnees.role === 'client' && u.donnees.actif === true, `role ${u.donnees.role}, actif ${u.donnees.actif}`);
  }],
  ['Compte désactivé avec le bon mot de passe', async (a) => {
    await a.patch('/users/2', { actif: false }, await a.jeton('admin'));
    const r = await a.post('/login', COMPTES.client);
    await a.patch('/users/2', { actif: true }, await a.jeton('admin'));
    attendre(r.statut === 403 && !r.donnees?.accessToken, `statut ${r.statut}`);
  }],
  ['Compte désactivé avec un mauvais mot de passe', async (a) => {
    await a.patch('/users/2', { actif: false }, await a.jeton('admin'));
    const r = await a.post('/login', { email: COMPTES.client.email, password: 'faux-mot-de-passe' });
    await a.patch('/users/2', { actif: true }, await a.jeton('admin'));
    attendre(r.statut === 400, `statut ${r.statut}`);
  }],

  // ---------- commande (parcours-achat) ----------
  ['Commande réussie : champs fixés par le serveur et stock décrémenté', async (a) => {
    const jeton = await a.jeton('client');
    const avant = (await a.get('/produits/1')).donnees.stock;
    const r = await a.post('/commandes', { lignes: [{ produitId: 1, quantite: 2, prixUnitaire: 1 }], adresseLivraison: { ville: 'Paris' }, clientId: 99, total: 1 }, jeton);
    attendre(r.statut === 201, `statut ${r.statut}`);
    const c = r.donnees;
    attendre(c.clientId === 2 && c.statut === 'en_attente' && c.total === 68, `commande ${JSON.stringify(c)}`);
    attendre(c.lignes[0].prixUnitaire === 34 && typeof c.dateCreation === 'string', 'prix ou date non fixés');
    const apres = (await a.get('/produits/1')).donnees.stock;
    attendre(apres === avant - 2, `stock ${avant} → ${apres}`);
  }],
  ['Commande sans jeton refusée (401)', async (a) => {
    const r = await a.post('/commandes', { lignes: [{ produitId: 1, quantite: 1 }] });
    attendre(r.statut === 401, `statut ${r.statut}`);
  }],
  ['Stock insuffisant ou produit non visible refusé (409)', async (a) => {
    const jeton = await a.jeton('client');
    const stock = await a.post('/commandes', { lignes: [{ produitId: 7, quantite: 3 }] }, jeton);
    attendre(stock.statut === 409 && stock.donnees.indisponibles[0].disponible === 2, `stock : ${stock.statut} ${JSON.stringify(stock.donnees)}`);
    const inactif = await a.post('/commandes', { lignes: [{ produitId: 10, quantite: 1 }] }, jeton);
    attendre(inactif.statut === 409, `inactif : ${inactif.statut}`);
    attendre((await a.get('/produits/7')).donnees.stock === 2, 'stock modifié malgré le refus');
  }],
  ['Stock rétabli à l\'annulation, une seule fois', async (a) => {
    const jeton = await a.jeton('client');
    const commande = (await a.post('/commandes', { lignes: [{ produitId: 2, quantite: 2 }] }, jeton)).donnees;
    const apresCommande = (await a.get('/produits/2')).donnees.stock;
    const r = await a.patch(`/commandes/${commande.id}`, { statut: 'annulee' }, jeton);
    attendre(r.statut === 200 && r.donnees.statut === 'annulee', `annulation : ${r.statut}`);
    attendre((await a.get('/produits/2')).donnees.stock === apresCommande + 2, 'stock non rétabli');
    const encore = await a.patch(`/commandes/${commande.id}`, { statut: 'annulee' }, jeton);
    attendre(encore.statut !== 200, 'seconde annulation acceptée');
    attendre((await a.get('/produits/2')).donnees.stock === apresCommande + 2, 'double remise en stock');
  }],
  ['Annulation refusée hors « en attente » ou pour un autre client (403)', async (a) => {
    const client = await a.jeton('client');
    const commande = (await a.post('/commandes', { lignes: [{ produitId: 4, quantite: 1 }] }, client)).donnees;
    const autre = await a.patch(`/commandes/${commande.id}`, { statut: 'annulee' }, await a.jeton('vendeur1'));
    attendre(autre.statut === 403, `autre client : ${autre.statut}`);
    await a.patch(`/commandes/${commande.id}`, { statut: 'expediee' }, await a.jeton('admin'));
    const expediee = await a.patch(`/commandes/${commande.id}`, { statut: 'annulee' }, client);
    attendre(expediee.statut === 403, `commande expédiée : ${expediee.statut}`);
  }],

  // ---------- gestion (vendeur-et-admin) ----------
  ['Écriture protégée : jeton absent ou compte désactivé refusé (401)', async (a) => {
    attendre((await a.patch('/produits/1', { stock: 1 })).statut === 401, 'sans jeton');
    const jeton = await a.jeton('vendeur2');
    await a.patch('/users/4', { actif: false }, await a.jeton('admin'));
    const r = await a.patch('/produits/6', { stock: 1 }, jeton);
    await a.patch('/users/4', { actif: true }, await a.jeton('admin'));
    attendre(r.statut === 401, `compte désactivé : ${r.statut}`);
  }],
  ['Demande « Devenir vendeur », seconde demande refusée, validation et refus', async (a) => {
    const client = await a.jeton('client');
    const demande = await a.post('/vendeurs', { nomBoutique: 'Les Tissages de Lucas', description: 'Tissages faits main en lin et laine.', statut: 'valide', utilisateurId: 1 }, client);
    attendre(demande.statut === 201 && demande.donnees.statut === 'en_attente' && demande.donnees.utilisateurId === 2, `demande : ${JSON.stringify(demande.donnees)}`);
    attendre((await a.post('/vendeurs', { nomBoutique: 'Autre', description: 'x' }, client)).statut === 409, 'seconde demande acceptée');
    const admin = await a.jeton('admin');
    attendre((await a.post('/vendeurs', { nomBoutique: 'Admin', description: 'x' }, admin)).statut === 403, 'demande de l\'admin acceptée');
    attendre((await a.patch(`/vendeurs/${demande.donnees.id}`, { statut: 'valide' }, client)).statut === 403, 'validation par un client');
    attendre((await a.patch(`/vendeurs/${demande.donnees.id}`, { statut: 'valide' }, admin)).statut === 200, 'validation refusée');
    attendre((await a.get('/users/2')).donnees.role === 'vendeur', 'rôle vendeur non donné');
    attendre((await a.patch(`/vendeurs/${demande.donnees.id}`, { statut: 'refuse' }, admin)).statut === 409, 'valide → refuse accepté');
  }],
  ['Nom de boutique déjà pris (409)', async (a) => {
    await a.post('/register', { email: 'nouveau@exemple.fr', password: 'Secret123!', nom: 'Nouveau' });
    const jeton = (await a.post('/login', { email: 'nouveau@exemple.fr', password: 'Secret123!' })).donnees.accessToken;
    const r = await a.post('/vendeurs', { nomBoutique: 'atelier grès & sel', description: 'Une description assez longue.' }, jeton);
    attendre(r.statut === 409, `statut ${r.statut}`);
  }],
  ['Modification refusée par l\'API : produit d\'un autre vendeur (403)', async (a) => {
    const r = await a.patch('/produits/6', { stock: 99 }, await a.jeton('vendeur1'));
    attendre(r.statut === 403, `statut ${r.statut}`);
    attendre((await a.get('/produits/6')).donnees.stock !== 99, 'produit modifié');
  }],
  ['Création par un vendeur rattachée à sa boutique, suppression d\'un produit commandé refusée', async (a) => {
    const jeton = await a.jeton('vendeur2');
    const r = await a.post('/produits', { nom: 'Chaise Fil', description: 'Assise en rotin naturel.', prix: 260, stock: 6, images: ['/images/produit-chaise-fil.jpg'], categorieId: 2, vendeurId: 1, actif: true }, jeton);
    attendre(r.statut === 201 && r.donnees.vendeurId === 2, `création : ${r.statut} vendeur ${r.donnees.vendeurId}`);
    attendre((await a.delete(`/produits/${r.donnees.id}`, jeton)).statut === 200, 'suppression d\'un produit jamais commandé refusée');
    const commande = await a.post('/commandes', { lignes: [{ produitId: 8, quantite: 1 }] }, await a.jeton('client'));
    attendre(commande.statut === 201, 'commande de test');
    attendre((await a.delete('/produits/8', jeton)).statut === 409, 'produit commandé supprimé (vendeur)');
    attendre((await a.delete('/produits/8', await a.jeton('admin'))).statut === 409, 'produit commandé supprimé (admin)');
  }],
  ['Catégories : réservées à l\'admin, nom et slug uniques, catégorie utilisée non supprimable', async (a) => {
    const admin = await a.jeton('admin');
    attendre((await a.post('/categories', { nom: 'Vannerie', slug: 'vannerie' }, await a.jeton('vendeur1'))).statut === 403, 'vendeur accepté');
    attendre((await a.post('/categories', { nom: 'Autre', slug: 'mobilier' }, admin)).statut === 409, 'slug en double accepté');
    const creee = await a.post('/categories', { nom: 'Vannerie & Osier', slug: 'vannerie-osier' }, admin);
    attendre(creee.statut === 201, `création : ${creee.statut}`);
    attendre((await a.delete(`/categories/${creee.donnees.id}`, admin)).statut === 200, 'catégorie vide non supprimée');
    attendre((await a.delete('/categories/2', admin)).statut === 409, 'catégorie utilisée supprimée');
  }],
  ['Utilisateurs : admin seulement, pas soi-même, pas de rôle vendeur, titulaire protégé', async (a) => {
    const admin = await a.jeton('admin');
    attendre((await a.patch('/users/2', { role: 'admin' }, await a.jeton('vendeur1'))).statut === 403, 'vendeur accepté');
    attendre((await a.patch('/users/1', { actif: false }, admin)).statut === 403, 'désactivation de soi-même');
    attendre((await a.patch('/users/5', { role: 'vendeur' }, admin)).statut === 409, 'rôle vendeur donné');
    attendre((await a.patch('/users/3', { role: 'client' }, admin)).statut === 409, 'titulaire rétrogradé');
    const promu = await a.patch('/users/5', { role: 'admin' }, admin);
    await a.patch('/users/5', { role: 'client' }, admin);
    attendre(promu.statut === 200 && promu.donnees.role === 'admin' && !('password' in promu.donnees), `promotion : ${promu.statut}`);
  }],
  ['Transitions de statut de l\'administrateur, remise en stock d\'une commande expédiée annulée', async (a) => {
    const admin = await a.jeton('admin');
    const commande = (await a.post('/commandes', { lignes: [{ produitId: 9, quantite: 2 }] }, await a.jeton('client'))).donnees;
    const stock = (await a.get('/produits/9')).donnees.stock;
    attendre((await a.patch(`/commandes/${commande.id}`, { statut: 'livree' }, admin)).statut === 409, 'en_attente → livree accepté');
    attendre((await a.patch(`/commandes/${commande.id}`, { statut: 'expediee' }, admin)).statut === 200, 'expédition refusée');
    attendre((await a.patch(`/commandes/${commande.id}`, { statut: 'annulee' }, admin)).statut === 200, 'annulation refusée');
    attendre((await a.get('/produits/9')).donnees.stock === stock + 2, 'stock non rétabli');
    const livree = (await a.post('/commandes', { lignes: [{ produitId: 9, quantite: 1 }] }, await a.jeton('client'))).donnees;
    await a.patch(`/commandes/${livree.id}`, { statut: 'expediee' }, admin);
    await a.patch(`/commandes/${livree.id}`, { statut: 'livree' }, admin);
    attendre((await a.patch(`/commandes/${livree.id}`, { statut: 'en_attente' }, admin)).statut === 409, 'livree → en_attente accepté');
  }],
];

async function principal() {
  for (let essai = 0; essai < 50; essai++) {
    try {
      await fetch(`${BASE}/categories`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  for (const [nom, verifier] of SCENARIOS) {
    await scenario(nom, verifier);
  }
  serveur.kill();
  await new Promise((r) => setTimeout(r, 300));
  rmSync(dossier, { recursive: true, force: true });
  console.log(echecs ? `\n${echecs} scénario(s) en échec.` : '\nTous les scénarios de l\'API passent.');
  process.exit(echecs ? 1 : 0);
}

principal().catch((erreur) => {
  console.error(erreur);
  serveur.kill();
  process.exit(1);
});
