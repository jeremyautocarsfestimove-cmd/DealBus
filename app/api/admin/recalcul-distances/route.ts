import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcItineraire } from "@/lib/itineraire";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Recalcule la distance des demandes ouvertes sans aucune offre (admin).
// Utile après une correction du géocodage : les demandes déjà publiées
// gardaient une distance fausse. Les demandes avec offres ne sont pas touchées
// (les transporteurs ont chiffré sur la base affichée).
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Accès réservé" }, { status: 403 });

  const admin = createAdminClient();
  const { data: demandes } = await admin.from("demandes")
    .select("id, numero, depart_adresse, arrivee_adresse, distance_km")
    .eq("statut", "ouverte")
    .gte("date_aller", new Date().toISOString().slice(0, 10));
  const ids = (demandes ?? []).map((d: any) => d.id);
  const { data: offres } = ids.length
    ? await admin.from("offres").select("demande_id").in("demande_id", ids)
    : { data: [] };
  const avecOffre = new Set((offres ?? []).map((o: any) => o.demande_id));

  const resultats: { numero: string; avant: number | null; apres: number | null; etat: "modifiee" | "identique" | "introuvable" }[] = [];
  for (const d of (demandes ?? []) as any[]) {
    if (avecOffre.has(d.id)) continue;
    const itin = await calcItineraire(d.depart_adresse, d.arrivee_adresse);
    const avant = d.distance_km != null ? Number(d.distance_km) : null;
    if (!itin) { resultats.push({ numero: d.numero, avant, apres: null, etat: "introuvable" }); continue; }
    if (avant === itin.km) { resultats.push({ numero: d.numero, avant, apres: itin.km, etat: "identique" }); continue; }
    await admin.from("demandes").update({ distance_km: itin.km }).eq("id", d.id);
    resultats.push({ numero: d.numero, avant, apres: itin.km, etat: "modifiee" });
  }

  return NextResponse.json({
    total: resultats.length,
    modifiees: resultats.filter((r) => r.etat === "modifiee").length,
    ignorees: avecOffre.size,
    resultats,
  });
}
