import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcItineraire } from "@/lib/itineraire";

// Modification ou clôture d'une demande par son client.
// Règle : modifiable tant qu'aucune offre n'a été reçue ; après, impossible.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { action?: "modifier" | "clore"; demande_id?: string; champs?: Record<string, unknown> };
  if (!body.demande_id) return NextResponse.json({ error: "demande_id requis" }, { status: 400 });

  const admin = createAdminClient();
  const { data: d } = await admin.from("demandes").select("id, client_id, statut, depart_adresse, arrivee_adresse").eq("id", body.demande_id).maybeSingle();
  if (!d) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  if (d.client_id !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (d.statut !== "ouverte") return NextResponse.json({ error: "Cette demande n'est plus ouverte" }, { status: 409 });

  const { count: nbOffres } = await admin.from("offres").select("id", { count: "exact", head: true }).eq("demande_id", d.id);

  if (body.action === "clore") {
    await admin.from("demandes").update({ statut: "expiree" }).eq("id", d.id);
    if ((nbOffres ?? 0) > 0) {
      await admin.from("offres").update({ statut: "non_retenue" }).eq("demande_id", d.id).in("statut", ["envoyee", "consultee"]);
    }
    return NextResponse.json({ ok: true });
  }

  if ((nbOffres ?? 0) > 0) {
    return NextResponse.json({ error: "Des offres ont déjà été reçues : la demande ne peut plus être modifiée. Clôturez-la et déposez-en une nouvelle." }, { status: 409 });
  }

  // Champs autorisés à la modification
  const c = body.champs ?? {};
  const autorises = ["type_trajet", "depart_adresse", "depart_departement", "arrivee_adresse", "date_aller", "heure_aller", "heure_arrivee",
    "date_retour", "heure_retour", "passagers", "vehicule_utilise_sur_place", "sur_place_repondu", "organisme", "motif", "equipements",
    "budget", "precisions", "completude"] as const;
  const maj: Record<string, unknown> = {};
  for (const k of autorises) if (k in c) maj[k] = c[k];
  if (!maj.depart_adresse || !maj.arrivee_adresse || !maj.date_aller || !(Number(maj.passagers) > 0)) {
    return NextResponse.json({ error: "Trajet, date et passagers sont obligatoires" }, { status: 400 });
  }
  if (maj.depart_adresse !== d.depart_adresse || maj.arrivee_adresse !== d.arrivee_adresse) {
    const itin = await calcItineraire(String(maj.depart_adresse), String(maj.arrivee_adresse));
    maj.distance_km = itin?.km ?? null;
  }
  const { error } = await admin.from("demandes").update(maj).eq("id", d.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
