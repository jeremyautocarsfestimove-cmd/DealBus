// Calcul de la calibration des prix à partir des offres en base.
// SERVEUR UNIQUEMENT (utilise le client service role). Mis en cache 1 h.

import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase/admin";
import { analyser } from "./assistant-demande";
import { CALIB, cleSegment, stats, type Calibration } from "./calibration-prix";

type Ligne = {
  prix_ttc: number | string;
  demande: {
    type_trajet: string;
    distance_km: number | string | null;
    date_aller: string;
    heure_aller: string | null;
    date_retour: string | null;
    heure_retour: string | null;
    passagers: number;
    vehicule_utilise_sur_place: boolean | null;
  } | null;
};

async function calculer(): Promise<Calibration> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("offres")
    .select("prix_ttc, demande:demandes(type_trajet, distance_km, date_aller, heure_aller, date_retour, heure_retour, passagers, vehicule_utilise_sur_place)");

  const parSegment: Record<string, number[]> = {};
  const kmParSegment: Record<string, number[]> = {};
  const tous: number[] = [];

  for (const o of (data ?? []) as unknown as Ligne[]) {
    const d = o.demande;
    if (!d || !d.distance_km) continue;
    const a = analyser({
      type_trajet: d.type_trajet,
      km: Number(d.distance_km),
      date_aller: d.date_aller,
      heure_aller: d.heure_aller ? String(d.heure_aller).slice(0, 5) : "",
      date_retour: d.date_retour ?? "",
      heure_retour: d.heure_retour ? String(d.heure_retour).slice(0, 5) : "",
      passagers: d.passagers,
      vehicule_utilise_sur_place: !!d.vehicule_utilise_sur_place,
    });
    if (!a.estimationTtc || !a.km) continue;
    const r = Number(o.prix_ttc) / a.estimationTtc;
    if (!Number.isFinite(r) || r < CALIB.ratioMin || r > CALIB.ratioMax) continue;
    const cle = cleSegment(a.km, a.nuits);
    (parSegment[cle] ??= []).push(r);
    (kmParSegment[cle] ??= []).push(Number(o.prix_ttc) / a.km);
    tous.push(r);
  }

  const segments: Calibration["segments"] = {};
  for (const [cle, ratios] of Object.entries(parSegment)) segments[cle] = stats(ratios);

  const parKm: Calibration["parKm"] = {};
  for (const [cle, v] of Object.entries(kmParSegment)) parKm[cle] = stats(v);

  return { segments, parKm, global: tous.length ? stats(tous) : null, maj: new Date().toISOString() };
}

export const calibrationPrix = unstable_cache(calculer, ["calibration-prix-v3"], { revalidate: 3600 });
