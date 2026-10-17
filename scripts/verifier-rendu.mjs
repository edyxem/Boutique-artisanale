// Vérification du rendu dans un vrai navigateur (Chrome ou Edge en mode headless, via le protocole DevTools).
// Pour chaque page et chaque largeur (1440 px, 390 px) : capture d'écran, audit axe-core, CLS,
// images externes, défilement horizontal ; puis jetons de couleur en thème clair, sombre et forcé.
//
// Usage : node scripts/verifier-rendu.mjs [--base http://localhost:4200] [--sortie verification] [chemins...]
// Prérequis : l'application tourne (npm run dev). Code de sortie 1 si une vérification échoue.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const option = (nom, defaut) => {
  const i = args.indexOf(nom);
  return i >= 0 ? args.splice(i, 2)[1] : defaut;
};
const BASE = option('--base', 'http://localhost:4200');
const SORTIE = option('--sortie', 'verification');
const CONNEXION = option('--connexion', '');
const THEME = option('--theme', 'clair') === 'sombre' ? 'dark' : 'light'; // "email:motdepasse" : se connecter avant de visiter les pages
const CHEMINS = args.length ? args : ['/', '/catalogue', '/page-inconnue'];
const LARGEURS = [
  { nom: 'bureau', largeur: 1440, hauteur: 900, mobile: false },
  { nom: 'mobile', largeur: 390, hauteur: 844, mobile: true },
];

const NAVIGATEURS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const navigateur = NAVIGATEURS.find((chemin) => existsSync(chemin));
if (!navigateur) {
  console.error('Aucun navigateur Chrome ou Edge trouvé.');
  process.exit(1);
}
const axe = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Protocole DevTools minimal ----------
async function demarrer() {
  const profil = mkdtempSync(join(tmpdir(), 'flowering-chrome-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const processus = spawn(navigateur, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profil}`,
    '--no-first-run',
    '--hide-scrollbars',
    'about:blank',
  ]);
  for (let essai = 0; essai < 50; essai++) {
    try {
      const cibles = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = cibles.find((c) => c.type === 'page');
      if (page) {
        return { processus, profil, url: page.webSocketDebuggerUrl };
      }
    } catch {
      /* pas encore prêt */
    }
    await pause(200);
  }
  throw new Error('Le navigateur ne répond pas.');
}

function client(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const attentes = new Map();
  const ecouteurs = new Map();
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && attentes.has(message.id)) {
      const { ok, ko } = attentes.get(message.id);
      attentes.delete(message.id);
      message.error ? ko(new Error(message.error.message)) : ok(message.result);
    } else if (message.method) {
      (ecouteurs.get(message.method) ?? []).forEach((f) => f(message.params));
    }
  });
  return {
    pret: new Promise((ok) => ws.addEventListener('open', ok)),
    envoyer: (method, params = {}) =>
      new Promise((ok, ko) => {
        attentes.set(++id, { ok, ko });
        ws.send(JSON.stringify({ id, method, params }));
      }),
    sur: (methode, f) => ecouteurs.set(methode, [...(ecouteurs.get(methode) ?? []), f]),
    fermer: () => ws.close(),
  };
}

async function evaluer(cdp, expression) {
  const { result, exceptionDetails } = await cdp.envoyer('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return result.value;
}

async function ouvrir(cdp, url) {
  const charge = new Promise((ok) => cdp.sur('Page.loadEventFired', ok));
  await cdp.envoyer('Page.navigate', { url });
  await Promise.race([charge, pause(15000)]);
  await pause(1500); // rendu Angular, images, apparitions (300 ms)
  await evaluer(cdp, 'window.scrollTo(0, document.body.scrollHeight); new Promise(r => setTimeout(r, 600))');
  await evaluer(cdp, 'window.scrollTo(0, 0); new Promise(r => setTimeout(r, 400))');
}

// ---------- Vérifications ----------
const SCRIPT_CLS = `
  window.__cls = 0;
  new PerformanceObserver((liste) => {
    for (const e of liste.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
  }).observe({ type: 'layout-shift', buffered: true });
`;

const JETONS = ['--bg', '--ink', '--forest', '--candy'];
const lireJetons = `(() => { const s = getComputedStyle(document.documentElement);
  return Object.fromEntries(${JSON.stringify(JETONS)}.map(n => [n, s.getPropertyValue(n).trim()])); })()`;

async function verifierPage(cdp, chemin, ecran, imagesExternes) {
  await cdp.envoyer('Emulation.setDeviceMetricsOverride', {
    width: ecran.largeur,
    height: ecran.hauteur,
    deviceScaleFactor: 1,
    mobile: ecran.mobile,
  });
  await ouvrir(cdp, BASE + chemin);
  const nom = `${THEME === 'dark' ? 'sombre-' : ''}${chemin.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'accueil'}-${ecran.nom}`;
  const { data } = await cdp.envoyer('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(join(SORTIE, `${nom}.png`), Buffer.from(data, 'base64'));

  // Focus clavier : deux tabulations réelles, puis lecture du contour de l'élément focalisé.
  for (let i = 0; i < 2; i++) {
    await cdp.envoyer('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await cdp.envoyer('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  }
  const focus = await evaluer(
    cdp,
    `(() => { const e = document.activeElement, s = getComputedStyle(e);
      const candy = getComputedStyle(document.documentElement).getPropertyValue('--candy').trim();
      const rgb = h => 'rgb(' + [1,3,5].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')';
      return { element: e.tagName + ' ' + (e.textContent || '').trim().slice(0, 30),
        ok: s.outlineStyle === 'solid' && s.outlineWidth === '2px' && s.outlineColor === rgb(candy) }; })()`,
  );
  const mesures = await evaluer(
    cdp,
    `(async () => {
      ${axe}
      const audit = await axe.run(document, { resultTypes: ['violations'] });
      return {
        titre: document.title,
        police: getComputedStyle(document.body).fontFamily,
        tailleBase: getComputedStyle(document.body).fontSize,
        debordement: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        cls: Math.round((window.__cls ?? 0) * 1000) / 1000,
        violations: audit.violations.map(v => ({ id: v.id, impact: v.impact, aide: v.help,
          cibles: v.nodes.slice(0, 3).map(n => n.target.join(' ')) })),
      };
    })()`,
  );
  return { page: chemin, ecran: ecran.nom, capture: `${nom}.png`, focus, ...mesures, imagesExternes: [...imagesExternes] };
}

async function principal() {
  mkdirSync(SORTIE, { recursive: true });
  const { processus, profil, url } = await demarrer();
  const cdp = client(url);
  await cdp.pret;
  await cdp.envoyer('Page.enable');
  await cdp.envoyer('Network.enable');
  await cdp.envoyer('Page.addScriptToEvaluateOnNewDocument', { source: SCRIPT_CLS });
  const theme = (valeur) => cdp.envoyer('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: valeur }] });
  await theme(THEME); // clair par défaut, comme les captures du template

  const origine = new URL(BASE).origin;
  const imagesExternes = new Set();
  cdp.sur('Network.requestWillBeSent', ({ request, type }) => {
    if (type === 'Image' && !request.url.startsWith(origine) && !request.url.startsWith('data:')) {
      imagesExternes.add(request.url);
    }
  });

  if (CONNEXION) {
    const [email, motDePasse] = CONNEXION.split(':');
    await ouvrir(cdp, `${BASE}/connexion`);
    await evaluer(
      cdp,
      `(async () => {
        const remplir = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
        remplir(document.querySelector('input[type=email]'), ${JSON.stringify(email)});
        remplir(document.querySelector('input[type=password]'), ${JSON.stringify(motDePasse)});
        document.querySelector('form button[type=submit]').click();
        await new Promise(r => setTimeout(r, 1500));
      })()`,
    );
  }

  const resultats = [];
  for (const chemin of CHEMINS) {
    for (const ecran of LARGEURS) {
      imagesExternes.clear();
      resultats.push(await verifierPage(cdp, chemin, ecran, imagesExternes));
    }
  }

  // Jetons : thème clair, sombre (préférence système) et thème forcé.
  await theme('light');
  await ouvrir(cdp, BASE + CHEMINS[0]);
  const themes = { clair: await evaluer(cdp, lireJetons) };
  await evaluer(cdp, `document.documentElement.dataset.theme = 'dark'`);
  themes.clairForceSombre = await evaluer(cdp, lireJetons);
  await evaluer(cdp, `delete document.documentElement.dataset.theme`);
  await theme('dark');
  themes.sombre = await evaluer(cdp, lireJetons);
  await evaluer(cdp, `document.documentElement.dataset.theme = 'light'`);
  themes.sombreForceClair = await evaluer(cdp, lireJetons);

  cdp.fermer();
  processus.kill();
  await pause(1500);
  try {
    rmSync(profil, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  } catch {
    /* Windows peut garder le profil verrouillé quelques instants : il reste dans le dossier temporaire. */
  }

  const rapport = { base: BASE, date: new Date().toISOString(), themes, pages: resultats };
  writeFileSync(join(SORTIE, 'rapport.json'), JSON.stringify(rapport, null, 2));

  let echecs = 0;
  for (const r of resultats) {
    const problemes = [];
    if (r.violations.length) problemes.push(`axe : ${r.violations.map((v) => `${v.id} (${v.cibles.join(', ')})`).join(' ; ')}`);
    if (r.cls >= 0.1) problemes.push(`CLS ${r.cls}`);
    if (r.debordement) problemes.push('défilement horizontal');
    if (!r.focus.ok) problemes.push(`focus clavier sans contour rose 2 px (${r.focus.element})`);
    if (r.imagesExternes.length) problemes.push(`images externes : ${r.imagesExternes.join(', ')}`);
    echecs += problemes.length ? 1 : 0;
    console.log(`${problemes.length ? '✗' : '✓'} ${r.page} [${r.ecran}] CLS ${r.cls} — ${r.titre}${problemes.length ? '\n    ' + problemes.join('\n    ') : ''}`);
  }
  console.log(`\nPolice : ${resultats[0]?.police} / ${resultats[0]?.tailleBase}`);
  console.log('Jetons :', JSON.stringify(themes));
  console.log(`Captures et rapport : ${SORTIE}/`);
  process.exit(echecs ? 1 : 0);
}

principal().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
