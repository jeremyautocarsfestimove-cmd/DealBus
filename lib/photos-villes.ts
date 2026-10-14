import fs from "node:fs";
import path from "node:path";

// Photos des destinations (public/img/villes/<cle>.webp), récupérées par
// scripts/photos-villes.sh ou déposées à la main. Vérifiées au build :
// si le fichier manque, la page retombe sur l'illustration du thème.
// Serveur uniquement (lecture disque).

export type Credit = { auteur: string; licence: string; source: string };

const DOSSIER = path.join(process.cwd(), "public", "img", "villes");
const EXTENSIONS = ["webp", "jpg", "jpeg", "png"];
const cache = new Map<string, string | null>();
let credits: Record<string, Credit> | null = null;

// Cherche public/img/<sousDossier>/<cle>.(webp|jpg|png) ; null si absent.
function imagePublique(sousDossier: string, cle: string): string | null {
  const k = `${sousDossier}/${cle}`;
  if (cache.has(k)) return cache.get(k)!;
  let trouve: string | null = null;
  try {
    for (const ext of EXTENSIONS) {
      if (fs.existsSync(path.join(process.cwd(), "public", "img", sousDossier, `${cle}.${ext}`))) { trouve = `/img/${sousDossier}/${cle}.${ext}`; break; }
    }
  } catch { trouve = null; }
  cache.set(k, trouve);
  return trouve;
}

export function photoVille(cle: string): string | null {
  return imagePublique("villes", cle);
}

// Photos des types de groupes (accueil) : public/img/groupes/<cle>.webp
export function photoGroupe(cle: string): string | null {
  return imagePublique("groupes", cle);
}

export function creditsPhotos(cles: string[]): { cle: string; credit: Credit }[] {
  if (credits === null) {
    try { credits = JSON.parse(fs.readFileSync(path.join(DOSSIER, "credits.json"), "utf8")); }
    catch { credits = {}; }
  }
  return cles
    .filter((c) => photoVille(c) && credits?.[c])
    .map((c) => ({ cle: c, credit: credits![c] }));
}
