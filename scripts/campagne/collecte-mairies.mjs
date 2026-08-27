// Collecte des emails officiels des mairies depuis l'annuaire de
// l'administration (base DILA / Service-Public.gouv.fr, licence ouverte).
// Produit un CSV directement importable dans /admin/prospection-clients
// (colonnes : email;nom;departement).
//
// Usage :
//   node scripts/campagne/collecte-mairies.mjs              (toute la France par défaut)
//   node scripts/campagne/collecte-mairies.mjs 76 27        (départements précis)
//
// Sortie : prospects-mairies.csv à la racine du projet.
// Le script télécharge l'export complet des mairies (un seul appel,
// quelques dizaines de Mo) puis filtre localement par département.

import { writeFileSync } from "node:fs";

const EXPORT_URL =
  "https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/exports/json" +
  '?where=pivot%20LIKE%20%22mairie%22' +
  "&select=nom,adresse_courriel,pivot";

const args = process.argv.slice(2);
const precis = args.filter((a) => /^(\d{1,3}|2[AB])$/i.test(a));
const france = precis.length === 0;
const cibles = france
  ? null
  : new Set(precis.map((a) => a.toUpperCase().padStart(2, "0")));

// Département depuis un code INSEE commune : "76540" → "76", "2A004" → "2A", "97411" → "974"
function deptDepuisInsee(insee) {
  if (!insee) return null;
  if (insee.startsWith("97")) return insee.slice(0, 3);
  return insee.slice(0, 2).toUpperCase();
}

console.log("Téléchargement de l'export des mairies (base DILA)…");
const res = await fetch(EXPORT_URL, { headers: { Accept: "application/json" } });
if (!res.ok) {
  console.error(`Erreur HTTP ${res.status} — réessayez dans quelques minutes.`);
  process.exit(1);
}
const fiches = await res.json();
console.log(`${fiches.length} fiches mairies reçues. Filtrage…`);

const lignes = new Map(); // email -> { nom, departement }

for (const f of fiches) {
  const brut = (f.adresse_courriel ?? "").trim().toLowerCase();
  if (!brut) continue;
  // Parfois plusieurs adresses séparées par ; ou , : on garde la première.
  const email = brut.split(/[;,\s]+/).find((e) => e.includes("@"));
  if (!email) continue;

  // Le champ pivot est une chaîne JSON : [{"type_service_local":"mairie","code_insee_commune":["76540"]}]
  let insee = null;
  try {
    const pivot = JSON.parse(f.pivot ?? "[]");
    insee = pivot?.[0]?.code_insee_commune?.[0] ?? null;
  } catch { /* fiche sans pivot exploitable : ignorée du filtre département */ }

  const dept = deptDepuisInsee(insee);
  if (!france && (!dept || !cibles.has(dept))) continue;

  if (!lignes.has(email)) {
    lignes.set(email, { nom: f.nom ?? "Mairie", departement: dept ?? "" });
  }
}

const csv = ["email;nom;departement"];
for (const [email, { nom, departement }] of lignes) {
  csv.push(`${email};${String(nom).replaceAll(";", ",")};${departement}`);
}
// Le BOM UTF-8 en tête permet à Excel d'afficher correctement les accents.
writeFileSync("prospects-mairies.csv", "\uFEFF" + csv.join("\n"), "utf-8");

console.log(`\n${lignes.size} adresses uniques écrites dans prospects-mairies.csv`);
console.log("Importez ce fichier sur /admin/prospection-clients.");
