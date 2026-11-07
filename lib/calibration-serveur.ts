// Devis réels → points de marché. SERVEUR UNIQUEMENT (client service role). Cache 1 h.
// Les points ne quittent jamais le serveur : seules les fourchettes calculées sont exposées.

import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase/admin";
import { analyser, type Analyse } from "./assistant-demande";
import {
  CALIB, trajetsEnCharge, fourchetteDepuisDevis, fourchetteBareme, repereKmDepuisDevis,
  type PointMarche, type Fourchette,
} from "./calibration-prix";

type Ligne = {
  prix_ttc: number | string;
  demande_id: string;
  demande: {
    type_trajet: string;
    distance_km: number | string | null;
    date_aller: string;
    date_retour: string | null;
  } | null;
};

function nuitsEntre(a: string, b: string | null): number {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

async function charger(): Promise<PointMarche[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("offres")
    .select("prix_ttc, demande_id, demande:demandes(type_trajet, distance_km, date_aller, date_retour)");

  const points: PointMarche[] = [];
  for (const o of (data ?? []) as unknown as Ligne[]) {
    const d = o.demande;
    const km = d?.distance_km ? Number(d.distance_km) : 0;
    const prix = Number(o.prix_ttc);
    if (!d || !km || !prix) continue;
    const kmCharge = km * trajetsEnCharge(d.type_trajet);
    const prixKm = prix / kmCharge;
    if (prixKm < CALIB.prixKmMin || prixKm > CALIB.prixKmMax) continue;
    points.push({
      demandeId: o.demande_id,
      km,
      kmCharge,
      prixKm,
      prixKmAller: prix / km,
      nuits: d.type_trajet === "aller_simple" ? 0 : nuitsEntre(d.date_aller, d.date_retour),
    });
  }
  return points;
}

export const pointsMarche = unstable_cache(charger, ["points-marche-v1"], { revalidate: 3600 });

// Fourchette pour une demande : devis réels si assez de comparables, sinon barème.
// exclureDemandeId : ne pas compter les devis de la demande elle-même (vue admin).
export async function estimerFourchette(
  a: Analyse, typeTrajet: string, exclureDemandeId?: string,
): Promise<Fourchette | null> {
  if (!a.km) return fourchetteBareme(a);
  const tous = await pointsMarche().catch(() => [] as PointMarche[]);
  const points = exclureDemandeId ? tous.filter((p) => p.demandeId !== exclureDemandeId) : tous;
  return fourchetteDepuisDevis(points, a.km, typeTrajet) ?? fourchetteBareme(a);
}

export async function repereKm(km: number | null, nuits: number, exclureDemandeId?: string) {
  const tous = await pointsMarche().catch(() => [] as PointMarche[]);
  const points = exclureDemandeId ? tous.filter((p) => p.demandeId !== exclureDemandeId) : tous;
  return repereKmDepuisDevis(points, km, nuits);
}
