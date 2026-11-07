// Données communes de l'espace transporteur. SERVEUR UNIQUEMENT.
import { createClient } from "./supabase/server";
import type { Compteurs } from "@/app/pro/ProTabs";

export const eur = (n: number) => Number(n).toLocaleString("fr-FR") + " €";
export const jourCourt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "");
export const heureFr = (h: string | null | undefined) => (h ? String(h).slice(0, 5).replace(":", "h") : "");
export const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
export const dateFuture = (d: string | null | undefined) => !d || new Date(`${d}T23:59:59`) >= today();
export const joursAvant = (d: string) => Math.ceil((new Date(`${d}T00:00:00`).getTime() - Date.now()) / 86400000);

// Ville lisible depuis une adresse complète
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

export const initiales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]?.toUpperCase()).join("") || "T";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Transporteur connecté + compteurs des onglets. Null si pas transporteur validé.
export async function contexteTransporteur() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: t } = await supabase.from("transporteurs").select("*").eq("id", user.id).maybeSingle();
  if (!t) return { user, transporteur: null, compteurs: null };

  const [{ data: leads }, { data: offres }, { data: missions }, { count: factures }, { count: avis }, { count: messages }] = await Promise.all([
    supabase.from("demandes").select("id, date_aller, mode, enchere_fin").eq("statut", "ouverte"),
    supabase.from("offres").select("id, statut, demande:demandes(statut, date_aller)").eq("transporteur_id", user.id),
    supabase.from("missions").select("id, statut, demande:demandes(date_aller), retour:retours_vide(date_dispo)").eq("transporteur_id", user.id),
    supabase.from("factures").select("id", { count: "exact", head: true }).eq("transporteur_id", user.id).eq("statut", "emise"),
    supabase.from("avis").select("id", { count: "exact", head: true }).eq("transporteur_id", user.id),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("transporteur_id", user.id).neq("auteur_id", user.id).is("lu_le", null),
  ]);
  const now = Date.now();
  const compteurs: Compteurs = {
    demandes: ((leads ?? []) as any[]).filter((d) => dateFuture(d.date_aller) && !(d.mode === "enchere" && d.enchere_fin && new Date(d.enchere_fin).getTime() <= now)).length,
    offres: ((offres ?? []) as any[]).filter((o) => ["envoyee", "consultee"].includes(o.statut) && ["ouverte", "selection"].includes(o.demande?.statut ?? "ouverte") && dateFuture(o.demande?.date_aller)).length,
    missions: ((missions ?? []) as any[]).filter((m) => m.statut === "a_venir" && dateFuture(m.demande?.date_aller ?? m.retour?.date_dispo)).length,
    factures: factures ?? 0,
    avis: avis ?? 0,
    messages: messages ?? 0,
  };
  return { user, transporteur: t, compteurs };
}
