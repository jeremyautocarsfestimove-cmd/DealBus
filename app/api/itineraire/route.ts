import { NextResponse } from "next/server";
import { calcItineraire } from "@/lib/itineraire";
import { createAdminClient } from "@/lib/supabase/admin";

// GET ?depart=…&arrivee=… → { km, geometry } (pour la carte)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const depart = url.searchParams.get("depart");
  const arrivee = url.searchParams.get("arrivee");
  if (!depart || !arrivee) {
    return NextResponse.json({ error: "depart et arrivee requis" }, { status: 400 });
  }
  const itin = await calcItineraire(depart, arrivee);
  if (!itin) return NextResponse.json({ error: "itinéraire introuvable" }, { status: 404 });
  return NextResponse.json(itin);
}

// POST { demande_id } → calcule ET mémorise distance_km sur la demande
export async function POST(req: Request) {
  const { demande_id } = (await req.json().catch(() => ({}))) as { demande_id?: string };
  if (!demande_id) return NextResponse.json({ error: "demande_id requis" }, { status: 400 });

  const admin = createAdminClient();
  const { data: demande } = await admin
    .from("demandes").select("depart_adresse, arrivee_adresse, distance_km")
    .eq("id", demande_id).maybeSingle();
  if (!demande) return NextResponse.json({ error: "demande introuvable" }, { status: 404 });
  if (demande.distance_km) return NextResponse.json({ km: Number(demande.distance_km) });

  const itin = await calcItineraire(demande.depart_adresse, demande.arrivee_adresse);
  if (!itin) return NextResponse.json({ error: "itinéraire introuvable" }, { status: 404 });

  await admin.from("demandes").update({ distance_km: itin.km }).eq("id", demande_id);
  return NextResponse.json({ km: itin.km });
}
