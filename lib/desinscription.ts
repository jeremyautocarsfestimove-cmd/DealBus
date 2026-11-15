// Lien de désinscription des campagnes (prospection clients et transporteurs).
// Le lien porte l'identifiant du prospect et une signature : il ne contient
// jamais l'adresse e-mail et ne peut pas être fabriqué pour quelqu'un d'autre.
import { createHmac, timingSafeEqual } from "crypto";

export type Liste = "clients" | "transporteurs";

export const TABLE: Record<Liste, string> = { clients: "prospects_clients", transporteurs: "prospects" };
const CODE: Record<Liste, string> = { clients: "c", transporteurs: "t" };
const SITE = "https://dealbus.fr";

// Identifiant factice pour les e-mails de test : le lien s'ouvre mais ne désinscrit personne.
export const ID_TEST = "00000000-0000-0000-0000-000000000000";

function secret() {
  return process.env.DESINSCRIPTION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

function signature(liste: Liste, id: string) {
  return createHmac("sha256", secret()).update(`${liste}:${id}`).digest("hex").slice(0, 32);
}

function requete(liste: Liste, id: string) {
  return `l=${CODE[liste]}&i=${id}&k=${signature(liste, id)}`;
}

// Page de confirmation, pour le lien visible dans l'e-mail.
export function lienDesinscription(liste: Liste, id: string) {
  return `${SITE}/desinscription?${requete(liste, id)}`;
}

// En-têtes lus par Gmail, Outlook, etc. pour afficher leur bouton « Se désabonner ».
export function enTetesDesinscription(liste: Liste, id: string) {
  return {
    "List-Unsubscribe": `<${SITE}/api/desinscription?${requete(liste, id)}>, <mailto:contact@dealbus.fr?subject=STOP>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

// Vérifie un lien reçu. Renvoie la liste et l'identifiant, ou null si le lien est faux.
export function verifierLien(l: string | null, i: string | null, k: string | null): { liste: Liste; id: string } | null {
  const liste = l === "c" ? "clients" : l === "t" ? "transporteurs" : null;
  if (!liste || !i || !k || !secret()) return null;
  if (!/^[0-9a-f-]{36}$/i.test(i)) return null;
  const attendu = Buffer.from(signature(liste, i));
  const recu = Buffer.from(k);
  if (attendu.length !== recu.length || !timingSafeEqual(attendu, recu)) return null;
  return { liste, id: i };
}
