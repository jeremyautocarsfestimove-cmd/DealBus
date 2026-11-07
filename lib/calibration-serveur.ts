// Devis réels → prix au km. SERVEUR UNIQUEMENT (client service role). Cache 1 h.
// Les devis ne quittent jamais le serveur : seules les fourchettes calculées sont exposées.

import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase/admin";
import { gabaritPour, type Analyse } from "./assistant-demande";
import {
  CALIB, kmTransport, fourchetteDepuisDevis, fourchetteBareme, prixKmObserve,
  type PointMarche, type Fourchette,
} from "./calibration-prix";

type Ligne = {
  prix_ttc: number | string;
  demande_id: string;
  demande: { type_trajet: string; distance_km: number | string | null; passagers: number } | null;
};

async function charger(): Promise<PointMarche[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("offres")
    .select("prix_ttc, demande_id, demande:demandes(type_trajet, distance_km, passagers)");

  const points: PointMarche[] = [];
  for (const o of (data ?? []) as unknown as Ligne[]) {
    const d = o.demande;
    const kmAller = d?.distance_km ? Number(d.distance_km) : 0;
    const prix = Number(o.prix_ttc);
    if (!d || !kmAller || !prix) continue;
    const km = kmTransport(kmAller, d.type_trajet);
    const cars = gabaritPour(d.passagers)?.nbVehicules ?? 1;
    const prixKm = prix / (km * cars);
    if (prixKm < CALIB.prixKmMin || prixKm > CALIB.prixKmMax) continue;
    points.push({ demandeId: o.demande_id, km, prixKm });
  }
  return points;
}

export const pointsMarche = unstable_cache(charger, ["points-marche-v5"], { revalidate: 3600 });

async function points(exclureDemandeId?: string) {
  const tous = await pointsMarche().catch(() => [] as PointMarche[]);
  return exclureDemandeId ? tous.filter((p) => p.demandeId !== exclureDemandeId) : tous;
}

// Fourchette : prix au km des devis si assez de distances proches, sinon barème.
// exclureDemandeId : ne pas compter les devis de la demande elle-même (vue admin).
export async function estimerFourchette(a: Analyse, typeTrajet: string, exclureDemandeId?: string): Promise<Fourchette | null> {
  if (!a.km) return fourchetteBareme(a);
  return fourchetteDepuisDevis(await points(exclureDemandeId), a.km, typeTrajet, a.gabarit?.nbVehicules ?? 1) ?? fourchetteBareme(a);
}

// Prix au km observé (par car) pour la distance de transport de la demande
export async function repereKm(kmAller: number | null, typeTrajet: string, exclureDemandeId?: string) {
  if (!kmAller) return null;
  return prixKmObserve(await points(exclureDemandeId), kmTransport(kmAller, typeTrajet));
}
