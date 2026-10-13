// ============================================================
// Messagerie — règles de contenu (article « Messagerie » des CGU)
// Fonctions pures, utilisées côté serveur (/api/messages) et côté client
// pour prévenir avant l'envoi.
// ============================================================

export type Infraction = "email" | "telephone" | "site" | "reseau";

const RE_EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
// 06 12 34 56 78 · 06.12.34.56.78 · 0612345678 · +33 6 12 34 56 78 · 0033612345678
const RE_TEL = /(?:(?:\+|00)33[\s.-]?[1-9]|0[1-9])(?:[\s.-]?\d{2}){4}/;
const RE_URL = /(?:https?:\/\/|www\.)[^\s]+|\b[a-z0-9-]+\.(?:fr|com|net|org|eu|io|co|info|biz)\b/i;
const RE_RESEAU = /\b(?:instagram|facebook|whatsapp|snapchat|tiktok|linkedin|telegram|signal)\b/i;

export function detecterContacts(texte: string): Infraction[] {
  const t = texte.normalize("NFKC");
  const r: Infraction[] = [];
  if (RE_EMAIL.test(t)) r.push("email");
  if (RE_TEL.test(t)) r.push("telephone");
  if (RE_URL.test(t)) r.push("site");
  if (RE_RESEAU.test(t)) r.push("reseau");
  return r;
}

// Montants en euros : « 2 590 € », « 2590€ », « 2 590 euros », « 1.250,00 EUR »
const RE_PRIX = /(\d{1,3}(?:[\s. ]?\d{3})*(?:[.,]\d{1,2})?)\s?(?:€|euros?|eur)\b/gi;

export function detecterPrix(texte: string): number[] {
  const t = texte.normalize("NFKC");
  const out: number[] = [];
  for (const m of t.matchAll(RE_PRIX)) {
    const n = Number(m[1].replace(/[\s. ]/g, "").replace(",", "."));
    if (!Number.isNaN(n) && n >= 50) out.push(n);
  }
  return out;
}

export const LIBELLES_INFRACTION: Record<Infraction, string> = {
  email: "une adresse email",
  telephone: "un numéro de téléphone",
  site: "une adresse de site internet",
  reseau: "un réseau social ou une messagerie externe",
};

export const REGLES_MESSAGERIE = [
  "La messagerie sert uniquement à échanger sur la demande.",
  "Un prix se communique par une offre, pas dans un message.",
  "Pas de téléphone, email, site internet ni raison sociale avant la sélection.",
  "Répondez sous 24 h : le délai de réponse est visible par l'autre partie.",
  "DealBus peut lire les échanges en cas de litige ou de signalement.",
];
