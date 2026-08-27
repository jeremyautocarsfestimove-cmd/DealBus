// Collecte des établissements scolaires (écoles, collèges, lycées) des
// départements DealBus depuis l'annuaire open data de l'Éducation nationale,
// via l'API tabulaire de data.gouv.fr. Produit un CSV directement importable
// dans /admin/prospection-clients (colonnes : email;nom;departement).
//
// Usage :
//   node scripts/campagne/collecte-ecoles.mjs
//   node scripts/campagne/collecte-ecoles.mjs 76 27        (départements précis)
//
// Sortie : prospects-ecoles.csv à la racine du projet.

import { writeFileSync } from "node:fs";

// Ressource "Annuaire de l'éducation" sur data.gouv.fr
const RID = "b22f04bf-64a8-495d-b8bb-d84dbc4c7983";
const BASE = `https://tabular-api.data.gouv.fr/api/resources/${RID}/data/`;

// Départements DealBus par défaut (mêmes que lib/prospection-clients.ts)
const DEFAUT = ["14", "27", "28", "50", "60", "61", "76", "78", "91", "95"];

const arg = process.argv.slice(2).filter((a) => /^\d{1,3}$/.test(a));
const departements = (arg.length ? arg : DEFAUT).map((d) => d.padStart(2, "0"));

// Le dataset code les départements sur 3 caractères : "076", "014"…
const codeDataset = (d) => d.padStart(3, "0");

const lignes = new Map(); // email -> { nom, departement }

for (const dept of departements) {
  let url = `${BASE}?Code_departement__exact=${codeDataset(dept)}&page_size=50`;
  let total = 0;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Erreur HTTP ${res.status} sur ${url}`);
      break;
    }
    const json = await res.json();

    for (const e of json.data ?? []) {
      const mail = (e.Mail ?? "").trim().toLowerCase();
      if (!mail || !mail.includes("@")) continue;
      if (e.etat && e.etat !== "OUVERT") continue;
      // Écoles, collèges, lycées uniquement (exclut CIO, services administratifs…)
      if (!["Ecole", "Collège", "Lycée"].includes(e.Type_etablissement ?? "")) continue;

      const nom = [e.Nom_etablissement, e.Nom_commune].filter(Boolean).join(" · ");
      if (!lignes.has(mail)) lignes.set(mail, { nom, departement: dept });
      total++;
    }

    url = json.links?.next ?? null;
    process.stdout.write(`\rDépt ${dept} : ${total} établissements traités…   `);
  }
  console.log(`\rDépt ${dept} : terminé (${total} établissements).      `);
}

const csv = ["email;nom;departement"];
for (const [email, { nom, departement }] of lignes) {
  // Le point-virgule est le séparateur : on le retire des noms par prudence.
  csv.push(`${email};${nom.replaceAll(";", ",")};${departement}`);
}
writeFileSync("prospects-ecoles.csv", csv.join("\n"), "utf-8");

console.log(`\n${lignes.size} adresses uniques écrites dans prospects-ecoles.csv`);
console.log("Importez ce fichier sur /admin/prospection-clients.");
