#!/usr/bin/env node
// ============================================================
// CAMPAGNE EMAIL TRANSPORTEURS — DealBus
// Usage :
//   node scripts/campagne/campagne.mjs --fichier contacts.csv --test
//   node scripts/campagne/campagne.mjs --fichier contacts.csv --limite 40
//
// CSV attendu (en-têtes flexibles, détectées automatiquement) :
//   email (obligatoire) · societe/nom (optionnel) · departement/dept (optionnel)
//
// Garde-fous intégrés :
//   - anti-doublons : journal envoyes.json (jamais deux envois à la même adresse)
//   - stop-list : stop.txt (une adresse par ligne = ne jamais contacter)
//   - cadence : pause de 2 s entre chaque envoi, limite quotidienne par défaut 40
//   - mode --test : tout s'affiche, rien ne part
// ============================================================

import { readFileSync, writeFileSync, existsSync } from "fs";
import { Resend } from "resend";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : def;
};
const FICHIER = opt("fichier", null);
const LIMITE = Number(opt("limite", 40));
const TEST = args.includes("--test");
const DIR = new URL(".", import.meta.url).pathname;

if (!FICHIER) { console.error("❌ --fichier contacts.csv requis"); process.exit(1); }
if (!TEST && !process.env.RESEND_API_KEY) { console.error("❌ RESEND_API_KEY manquante (export RESEND_API_KEY=re_…)"); process.exit(1); }

// ---------- Lecture CSV ----------
const raw = readFileSync(FICHIER, "utf8").replace(/^\uFEFF/, "");
const sep = raw.split("\n")[0].includes(";") ? ";" : ",";
const lignes = raw.split(/\r?\n/).filter((l) => l.trim());
const entetes = lignes[0].split(sep).map((h) => h.trim().toLowerCase());
const idx = {
  email: entetes.findIndex((h) => h.includes("mail")),
  nom: entetes.findIndex((h) => h.includes("societe") || h.includes("société") || h.includes("nom") || h.includes("raison")),
  dept: entetes.findIndex((h) => h.includes("dep") || h.includes("dpt") || h.includes("cp")),
};
if (idx.email < 0) { console.error(`❌ Colonne email introuvable dans : ${entetes.join(", ")}`); process.exit(1); }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const contacts = lignes.slice(1).map((l) => {
  const c = l.split(sep);
  return {
    email: (c[idx.email] ?? "").trim().toLowerCase(),
    nom: idx.nom >= 0 ? (c[idx.nom] ?? "").trim() : "",
    dept: idx.dept >= 0 ? (c[idx.dept] ?? "").trim().slice(0, 2) : "",
  };
}).filter((c) => EMAIL_RE.test(c.email));

// ---------- Journal + stop-list ----------
const logPath = DIR + "envoyes.json";
const envoyes = existsSync(logPath) ? JSON.parse(readFileSync(logPath, "utf8")) : {};
const stopPath = DIR + "stop.txt";
const stop = new Set(existsSync(stopPath)
  ? readFileSync(stopPath, "utf8").split(/\r?\n/).map((l) => l.trim().toLowerCase()).filter(Boolean)
  : []);

const dejaVus = new Set();
const file = contacts.filter((c) => {
  if (envoyes[c.email] || stop.has(c.email) || dejaVus.has(c.email)) return false;
  dejaVus.add(c.email);
  return true;
}).slice(0, LIMITE);

console.log(`📋 ${contacts.length} contacts valides · ${Object.keys(envoyes).length} déjà contactés · ${stop.size} en stop-list`);
console.log(`▶ ${file.length} envois prévus${TEST ? " (MODE TEST — rien ne part)" : ""}\n`);

// ---------- Le message ----------
const DEPTS = { "14": "le Calvados", "27": "l'Eure", "28": "l'Eure-et-Loir", "50": "la Manche", "60": "l'Oise", "61": "l'Orne", "76": "la Seine-Maritime", "78": "les Yvelines", "91": "l'Essonne", "95": "le Val-d'Oise" };

function sujet(c) {
  const zone = DEPTS[c.dept];
  return zone
    ? `Nouvelle plateforme — nous cherchons nos autocaristes partenaires dans ${zone}`
    : `Nouvelle plateforme — nous cherchons nos autocaristes partenaires`;
}

function corpsTexte(c) {
  const bonjour = c.nom ? `Bonjour,\n\n(Message à l'attention de ${c.nom})` : "Bonjour,";
  return `${bonjour}

DealBus est une plateforme toute neuve, et nous cherchons nos premiers transporteurs partenaires. Pas de chiffres gonflés, pas de promesses de milliers de clients — juste une réalité de marketplace que vous connaissez aussi bien que nous : les clients arriveront, mais sans transporteurs pour leur répondre, il n'y a pas de clients. C'est donc par vous que tout commence.

Pourquoi nous rejoindre maintenant ? Parce que je l'ai pensée en connaissant votre métier de l'intérieur — les devis envoyés le soir restés sans réponse, les plateformes qui prélèvent 10 à 13 % en apportant de moins en moins, et ces cars qui rentrent vides après une dépose, conducteur payé et gasoil brûlé pour zéro euro de chiffre.

Ce que j'ai construit pour y répondre :

→ Des demandes qualifiées, directement par email. Les groupes (associations, CSE, mariages, écoles, clubs) publient leurs trajets ; vous recevez ceux qui partent de vos départements. Vous répondez si ça vous arrange, au prix que VOUS fixez — un devis ferme, la règle du prix unique s'appliquant à tous.

→ Vos retours à vide, enfin monétisés. Vous rentrez de Barcelone, de Bretagne, des stations ? Publiez le trajet retour à votre prix : un groupe peut réserver le car complet. Le kilomètre subi devient du chiffre — aucune autre plateforme ne le propose.

→ Des conditions de partenaires. Zéro abonnement, zéro frais d'inscription, zéro engagement. Une commission uniquement quand vous gagnez une mission : 5 à 9 % selon le montant, encore réduite sur les retours à vide, facturée après la prestation — jamais avant. Et le client vous règle en direct : la plateforme ne touche jamais votre argent.

Être parmi les premiers a un avantage concret : les premiers inscrits de chaque département recevront naturellement les premières demandes de leur zone, sans concurrence ou presque.

L'inscription prend 2 minutes, chaque compte est vérifié et validé sous 24 h :

→ https://dealbus.fr/pro

Une question, un doute ? Répondez simplement à cet email — c'est moi qui vous lirai.

Bonne route,
Jeremy, de DealBus™
contact@dealbus.fr · https://dealbus.fr

—
Pour ne plus recevoir nos messages : répondez « STOP » et votre adresse sera retirée immédiatement.`;
}

function corpsHtml(cont) {
  const zone = DEPTS[cont.dept];
  const p = (t) => `<p style="margin:0 0 15px;font-size:14.5px;line-height:1.65;color:#3A4150;">${t}</p>`;
  const bloc = (titre, texte) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr>
    <td style="background:#FBF6EA;border-left:3px solid #E8A63D;border-radius:0 6px 6px 0;padding:12px 16px;">
      <div style="font-size:14px;font-weight:700;color:#12151B;margin-bottom:3px;">${titre}</div>
      <div style="font-size:13.5px;line-height:1.55;color:#5A6170;">${texte}</div>
    </td></tr></table>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#EDEAE2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDEAE2;padding:26px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:8px;overflow:hidden;border:1px solid #DDD8CC;">
<tr><td style="background:#12151B;padding:17px 30px;">
  <span style="display:inline-block;width:11px;height:11px;background:#E8A63D;border-radius:2px;margin-right:9px;vertical-align:middle;"></span>
  <span style="font-family:Arial Black,Arial,sans-serif;font-size:16px;font-weight:900;letter-spacing:2.5px;color:#F5F2EA;vertical-align:middle;">DEAL<span style="color:#E8A63D;">BUS</span><sup style="font-size:8px;font-weight:400;opacity:0.6;">™</sup></span>
</td></tr>
<tr><td style="padding:28px 30px 24px;font-family:Arial,Helvetica,sans-serif;">
  <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;color:#12151B;">Nous cherchons nos autocaristes partenaires${zone ? ` dans ${zone}` : ""}.</h1>
  ${p(`Bonjour${cont.nom ? ` <strong>${cont.nom}</strong>` : ""},`)}
  ${p(`<strong>DealBus est une plateforme toute neuve</strong>, et nous cherchons nos premiers transporteurs partenaires. Pas de chiffres gonflés — juste une réalité de marketplace que vous connaissez : les clients arriveront, mais <strong>sans transporteurs pour leur répondre, il n'y a pas de clients</strong>. C'est par vous que tout commence.`)}
  ${p(`Je l'ai pensée en connaissant votre métier de l'intérieur — les devis restés sans réponse, les plateformes qui prélèvent 10 à 13 %, et ces cars qui rentrent <strong>vides</strong> après une dépose, conducteur payé et gasoil brûlé pour zéro euro de chiffre.`)}
  ${bloc("Des demandes qualifiées, par email", "Les groupes (associations, CSE, mariages, écoles) publient leurs trajets ; vous recevez ceux de vos départements. Vous répondez si ça vous arrange, au prix que VOUS fixez.")}
  ${bloc("Vos retours à vide, enfin monétisés", "Publiez vos trajets retour à votre prix : un groupe réserve le car complet. Le kilomètre subi devient du chiffre — personne d'autre ne le propose.")}
  ${bloc("Des conditions de partenaires", "0 € d'abonnement, 0 engagement. Commission uniquement sur les missions gagnées : 5 à 9 %, réduite sur les retours à vide, facturée après la prestation. Le client vous règle en direct.")}
  ${p(`Avantage concret d'être parmi les premiers : <strong>les premiers inscrits de chaque département recevront les premières demandes de leur zone</strong>, sans concurrence ou presque.`)}
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;"><tr><td style="border-radius:5px;background:#E8A63D;">
    <a href="https://dealbus.fr/pro" target="_blank" style="display:inline-block;padding:13px 26px;font-size:14.5px;font-weight:700;color:#12151B;text-decoration:none;font-family:Arial,sans-serif;">S'inscrire en 2 minutes &rarr;</a>
  </td></tr></table>
  ${p(`<span style="font-size:13px;color:#6B7280;">Compte vérifié et validé sous 24 h. Une question ? Répondez à cet email — c'est moi qui vous lirai.</span>`)}
  ${p(`Bonne route,<br/><strong>Jeremy, de DealBus™</strong>`)}
</td></tr>
<tr><td style="padding:15px 30px;background:#F7F4EC;border-top:1px solid #E7E1D3;">
  <p style="margin:0;font-family:Consolas,Menlo,monospace;font-size:10px;letter-spacing:0.8px;color:#9AA0AB;">
    DEALBUS™ · LA PLACE DE MARCHÉ DU TRANSPORT DE GROUPE — MARQUE DÉPOSÉE (INPI)<br/>
    <a href="https://dealbus.fr" style="color:#A85D00;text-decoration:none;">dealbus.fr</a> &nbsp;·&nbsp; contact@dealbus.fr<br/><br/>
    <span style="color:#B4B9C2;">Pour ne plus recevoir nos messages, répondez « STOP » — votre adresse sera retirée immédiatement.</span>
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}

// ---------- Envoi cadencé ----------
const resend = TEST ? null : new Resend(process.env.RESEND_API_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, ko = 0;

for (const c of file) {
  const s = sujet(c);
  if (TEST) {
    console.log(`🧪 ${c.email}${c.dept ? ` (dépt ${c.dept})` : ""} — "${s}"`);
    ok++;
    continue;
  }
  try {
    const { error } = await resend.emails.send({
      from: process.env.CAMPAGNE_FROM ?? "Jeremy de DealBus <contact@dealbus.fr>",
      to: c.email,
      replyTo: "contact@dealbus.fr",
      subject: s,
      text: corpsTexte(c),
      html: corpsHtml(c),
      headers: { "List-Unsubscribe": "<mailto:contact@dealbus.fr?subject=STOP>" },
    });
    if (error) throw new Error(error.message);
    envoyes[c.email] = { date: new Date().toISOString(), dept: c.dept || null };
    writeFileSync(logPath, JSON.stringify(envoyes, null, 2));
    console.log(`✅ ${c.email}`);
    ok++;
  } catch (e) {
    console.log(`❌ ${c.email} — ${e.message}`);
    ko++;
  }
  await pause(2000);
}

console.log(`\n📊 Terminé : ${ok} envoyé${ok > 1 ? "s" : ""}, ${ko} échec${ko > 1 ? "s" : ""}.`);
if (!TEST) console.log(`Journal : scripts/campagne/envoyes.json — relancez demain, les adresses déjà contactées seront ignorées.`);
