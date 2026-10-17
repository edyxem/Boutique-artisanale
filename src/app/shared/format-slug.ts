/** Slug proposé à partir d'un nom : « Vannerie & Osier » → « vannerie-osier ». */
export function slugifier(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const FORMAT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
