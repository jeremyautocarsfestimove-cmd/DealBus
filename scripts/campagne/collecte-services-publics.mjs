// Collecte des emails officiels des CCAS (centres communaux d'action sociale,
// organisateurs des sorties et voyages séniors) et des intercommunalités
// (EPCI) depuis l'annuaire de l'administration (base DILA, licence ouverte).
// Produit un CSV directement importable dans /admin/prospection-clients
// (colonnes : email;nom;departement).
//
// Usage :
//   node scripts/campagne/collecte-services-publics.mjs                 (CCAS + EPCI, toute la France)
//   node scripts/campagne/collecte-services-publics.mjs ccas            (un seul type)
//   node scripts/campagne/collecte-services-publics.mjs ccas 76 27      (type + départements précis)
//
// Types disponibles : ccas, epci
// Sortie : prospects-services-publics.csv à la racine du projet.

import { writeFileSync } from "node:fs";

const LIBELLES = {
  ccas: "CCAS",
  epci: "Intercommunalité",
};

const args = process.argv.slice(2);
const pivots = args.filter((a) => Object.keys(LIBELLES).includes(a.toLowerCase())).map((a) => a.toLowerCase());
const types = pivots.length ? pivots : ["ccas", "epci"];

const precis = args.filter((a) => /^(\d{1,3}|2[AB])$/i.test(a)).map((a) => a.toUpperCase().padStart(2, "0"));
const france = precis.length === 0;
const cibles = france ? null : new Set(precis);

// Département depuis un code INSEE commune : "76540" → "76", "2A004" → "2A", "97411" → "974"
function deptDepuisInsee(insee) {
  if (!insee) return null;
  if (insee.startsWith("97")) return insee.slice(0, 3);
  return insee.slice(0, 2).toUpperCase();
}

const lignes = new Map(); // email -> { nom, departement }

for (const type of types) {
  const url =
    "https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/exports/json" +
    `?where=pivot%20LIKE%20%22${type}%22` +
    "&select=nom,adresse_courriel,pivot";

  console.log(`Téléchargement des ${LIBELLES[type]} (base DILA)…`);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    console.error(`Erreur HTTP ${res.status} sur ${type} — réessayez dans quelques minutes.`);
    continue;
  }
  const fiches = await res.json();
  let gardees = 0;

  for (const f of fiches) {
    const brut = (f.adresse_courriel ?? "").trim().toLowerCase();
    if (!brut) continue;
    const email = brut.split(/[;,\s]+/).find((e) => e.includes("@"));
    if (!email) continue;

    // Le champ pivot est une chaîne JSON : [{"type_service_local":"ccas","code_insee_commune":["76540"]}]
    let insee = null;
    try {
      const pivot = JSON.parse(f.pivot ?? "[]");
      insee = pivot?.[0]?.code_insee_commune?.[0] ?? null;
    } catch { /* fiche sans pivot exploitable : ignorée du filtre département */ }

    const dept = deptDepuisInsee(insee);
    if (!france && (!dept || !cibles.has(dept))) continue;

    if (!lignes.has(email)) {
      lignes.set(email, { nom: f.nom ?? LIBELLES[type], departement: dept ?? "" });
      gardees++;
    }
  }
  console.log(`${LIBELLES[type]} : ${fiches.length} fiches reçues, ${gardees} adresses retenues.`);
}

const csv = ["email;nom;departement"];
for (const [email, { nom, departement }] of lignes) {
  csv.push(`${email};${String(nom).replaceAll(";", ",")};${departement}`);
}
// Le BOM UTF-8 en tête permet à Excel d'afficher correctement les accents.
writeFileSync("prospects-services-publics.csv", "\uFEFF" + csv.join("\n"), "utf-8");

console.log(`\n${lignes.size} adresses uniques écrites dans prospects-services-publics.csv`);
console.log("Importez ce fichier sur /admin/prospection-clients.");
