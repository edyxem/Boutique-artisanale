// Vérifie qu'aucune valeur de design n'est écrite en dur dans le code Angular :
// couleurs (hexadécimal, rgb(), hsl()), palettes Tailwind par défaut et valeurs arbitraires `[...]`.
// Usage : node scripts/verifier-couleurs.mjs [dossiers ou fichiers...] (par défaut : src/app)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const cibles = process.argv.slice(2);
const racines = cibles.length ? cibles : ['src/app'];
const extensions = new Set(['.ts', '.html', '.css', '.txt']);

const regles = [
  { nom: 'couleur hexadécimale', motif: /(?<![\w&])#[0-9a-fA-F]{3,8}\b/g },
  { nom: 'couleur rgb()/hsl()', motif: /\b(?:rgba?|hsla?)\(/g },
  {
    nom: 'palette Tailwind par défaut',
    motif:
      /\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|decoration|accent|caret|divide|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black)(?:-\d+)?\b/g,
  },
  { nom: 'valeur arbitraire Tailwind', motif: /\b[a-z][\w-]*-\[[^\]\s]+\]/g },
  { nom: 'propriété ou variante arbitraire Tailwind', motif: /(?<=["'\s])\[(?:&[^\]\s]*|[a-z-]+:[^\]\s]+)\]/g },
];

function fichiers(chemin) {
  if (statSync(chemin).isDirectory()) {
    return readdirSync(chemin).flatMap((nom) => fichiers(join(chemin, nom)));
  }
  return extensions.has(extname(chemin)) ? [chemin] : [];
}

let erreurs = 0;
for (const fichier of racines.flatMap(fichiers)) {
  const lignes = readFileSync(fichier, 'utf8').split('\n');
  lignes.forEach((ligne, index) => {
    for (const { nom, motif } of regles) {
      for (const trouve of ligne.matchAll(motif)) {
        erreurs++;
        console.error(`${fichier}:${index + 1} ${nom} : ${trouve[0]}`);
      }
    }
  });
}

if (erreurs) {
  console.error(`\n${erreurs} valeur(s) hors charte. Utilisez les jetons de src/styles/jetons.css.`);
  process.exit(1);
}
console.log('Aucune valeur hors charte.');
