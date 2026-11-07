// Données du CRM admin. SERVEUR UNIQUEMENT.
// Toujours appeler exigerAdmin() avant d'utiliser le client service role.

import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { demandeActive } from "./demandes";

export async function exigerAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return me?.role === "admin";
}

export type StatutClient = "prospect" | "en_cours" | "client" | "inactif";

export const STATUT_CLIENT: Record<StatutClient, { label: string; classe: string; aide: string }> = {
  en_cours: { label: "En cours", classe: "bg-ambre-dim text-ambre-fort", aide: "Au moins une demande active" },
  client: { label: "Client", classe: "bg-vert-dim text-vert", aide: "Au moins une mission confirmée" },
  prospect: { label: "Inscrit", classe: "bg-bleunuit text-bleunuit-fort", aide: "Compte créé, aucune demande" },
  inactif: { label: "Inactif", classe: "bg-asphalte-3 text-blanc-faint", aide: "Demandes passées, sans mission" },
};

export type LigneClient = {
  id: string;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  inscritLe: string;
  organisme: string | null;
  nbDemandes: number;
  nbActives: number;
  nbOffres: number;
  nbMissions: number;
  montantMissions: number;
  commissions: number;
  derniereActivite: string;
  statut: StatutClient;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function chargerClients(): Promise<LigneClient[]> {
  const admin = createAdminClient();
  const [{ data: profils }, { data: demandes }, { data: missions }] = await Promise.all([
    admin.from("profiles").select("id, nom, email, telephone, created_at").eq("role", "client"),
    admin.from("demandes").select("id, client_id, statut, date_aller, date_retour, created_at, organisme"),
    admin.from("missions").select("client_id, demande_id, prix_final, commission_montant, statut"),
  ]);
  const D = (demandes ?? []) as any[];
  const { data: offres } = D.length
    ? await admin.from("offres").select("demande_id, created_at").in("demande_id", D.map((d) => d.id))
    : { data: [] as any[] };

  const offresParDemande = new Map<string, { n: number; derniere: string }>();
  for (const o of (offres ?? []) as any[]) {
    const e = offresParDemande.get(o.demande_id) ?? { n: 0, derniere: o.created_at };
    e.n++; if (o.created_at > e.derniere) e.derniere = o.created_at;
    offresParDemande.set(o.demande_id, e);
  }

  return ((profils ?? []) as any[]).map((p) => {
    const ds = D.filter((d) => d.client_id === p.id);
    const ms = ((missions ?? []) as any[]).filter((m) => m.client_id === p.id && m.statut !== "annulee");
    const nbOffres = ds.reduce((s, d) => s + (offresParDemande.get(d.id)?.n ?? 0), 0);
    const nbActives = ds.filter(demandeActive).length;
    const dates = [p.created_at, ...ds.map((d) => d.created_at), ...ds.map((d) => offresParDemande.get(d.id)?.derniere).filter(Boolean)];
    const statut: StatutClient = ms.length ? "client" : nbActives ? "en_cours" : ds.length ? "inactif" : "prospect";
    const recente = [...ds].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
    return {
      id: p.id, nom: p.nom, email: p.email, telephone: p.telephone, inscritLe: p.created_at,
      organisme: recente?.organisme ?? null,
      nbDemandes: ds.length, nbActives, nbOffres, nbMissions: ms.length,
      montantMissions: ms.reduce((s, m) => s + Number(m.prix_final), 0),
      commissions: ms.reduce((s, m) => s + Number(m.commission_montant), 0),
      derniereActivite: dates.sort().reverse()[0],
      statut,
    };
  }).sort((a, b) => (a.derniereActivite < b.derniereActivite ? 1 : -1));
}

export function depuis(iso: string): string {
  const j = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (j <= 0) return "aujourd'hui";
  if (j === 1) return "hier";
  if (j < 30) return `il y a ${j} j`;
  const m = Math.floor(j / 30);
  return m < 12 ? `il y a ${m} mois` : `il y a ${Math.floor(m / 12)} an${m >= 24 ? "s" : ""}`;
}

// Ville lisible depuis une adresse complète (« 12 rue X, 75015 Paris » → « Paris »)
export function ville(adresse: string): string {
  const parts = adresse.split(",").map((x) => x.trim()).filter(Boolean);
  const avecCp = parts.find((x) => /\d{5}/.test(x));
  if (avecCp) {
    const v = avecCp.replace(/.*\d{5}\s*/, "").trim();
    if (v) return v;
    const i = parts.indexOf(avecCp);
    if (parts[i + 1]) return parts[i + 1];
  }
  return parts[0] ?? adresse;
}
