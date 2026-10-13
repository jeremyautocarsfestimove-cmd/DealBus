import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyer, echap, url } from "@/lib/annulations";
import { ORGANISMES, EQUIPEMENTS, gabaritPour } from "@/lib/assistant-demande";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Relance des transporteurs sur une demande ouverte sans offre :
// email aux transporteurs validés couvrant le département de départ
// (ou tous les validés avec « elargir »), sans ceux qui ont déjà répondu.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Accès réservé" }, { status: 403 });

  const { demande_id, message, elargir } = (await req.json().catch(() => ({}))) as { demande_id?: string; message?: string; elargir?: boolean };
  if (!demande_id) return NextResponse.json({ error: "demande_id requis" }, { status: 400 });

  const admin = createAdminClient();
  const { data: d } = await admin.from("demandes").select("*").eq("id", demande_id).maybeSingle();
  if (!d) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  if (d.statut !== "ouverte") return NextResponse.json({ error: "La demande n'est plus ouverte" }, { status: 409 });

  // Transporteurs ciblés
  let ids: string[] = [];
  if (elargir) {
    const { data: tous } = await admin.from("transporteurs").select("id").eq("statut", "valide");
    ids = (tous ?? []).map((t: any) => t.id);
  } else {
    const { data: zones } = await admin.from("transporteur_zones")
      .select("transporteur_id, transporteur:transporteurs!inner(statut)")
      .eq("departement", d.depart_departement).eq("transporteur.statut", "valide");
    ids = Array.from(new Set((zones ?? []).map((z: any) => z.transporteur_id)));
  }
  // Exclure ceux qui ont déjà répondu
  const { data: dejaOffert } = await admin.from("offres").select("transporteur_id").eq("demande_id", d.id);
  const exclus = new Set((dejaOffert ?? []).map((o: any) => o.transporteur_id));
  ids = ids.filter((id) => !exclus.has(id));
  if (!ids.length) return NextResponse.json({ error: elargir ? "Aucun transporteur validé à relancer" : "Aucun transporteur validé sur ce département n'est encore sans offre. Essayez « élargir à tous les transporteurs »." }, { status: 409 });

  const { data: profils } = await admin.from("profiles").select("id, email").in("id", ids).not("email", "is", null);
  const emails = Array.from(new Set((profils ?? []).map((p: any) => p.email).filter(Boolean))) as string[];

  const trajet = `${d.depart_adresse} → ${d.arrivee_adresse}`;
  const dateAller = new Date(d.date_aller).toLocaleDateString("fr-FR") + (d.heure_aller ? ` à ${String(d.heure_aller).slice(0, 5).replace(":", "h")}` : "");
  const retour = d.date_retour ? ` → ${new Date(d.date_retour).toLocaleDateString("fr-FR")}${d.heure_retour ? ` à ${String(d.heure_retour).slice(0, 5).replace(":", "h")}` : ""}` : "";
  const gabarit = gabaritPour(d.passagers);
  const organisme = ORGANISMES.find((o) => o.id === d.organisme)?.label;
  const equipements = (d.equipements ?? []).map((e: string) => EQUIPEMENTS.find((x) => x.id === e)?.label ?? e).join(", ");
  const details = [
    `<strong>${echap(trajet)}</strong>`,
    `${dateAller}${retour} · ${d.passagers} passagers${gabarit ? ` (${gabarit.label})` : ""} · ${String(d.type_trajet).replace("_", "-")}`,
    d.distance_km ? `≈ ${Number(d.distance_km).toLocaleString("fr-FR")} km par trajet` : "",
    organisme ? `${organisme}${d.motif ? ` · ${d.motif}` : ""}` : (d.motif ?? ""),
    equipements ? `Équipements : ${echap(equipements)}` : "",
    d.vehicule_utilise_sur_place ? "Car et chauffeur sur place entre l'aller et le retour" : "",
  ].filter(Boolean).join("<br/>");

  const texteAdmin = (message ?? "").trim();
  const intro = texteAdmin
    ? echap(texteAdmin).replace(/\n/g, "<br/>")
    : `Cette demande déposée le ${new Date(d.created_at).toLocaleDateString("fr-FR")} n'a encore reçu <strong>aucune offre</strong>. Un client attend : si votre planning le permet, une offre claire a toutes les chances d'être retenue.`;

  let sent = 0;
  for (const email of emails) {
    await envoyer(email, `🔔 Relance : aucune offre encore sur ${trajet}`, "Un client attend une offre",
      [intro, details, "Le client reste anonyme jusqu'à sa sélection. Vous publiez une seule offre, ferme, et vous ne payez une commission que si vous êtes retenu."],
      { label: "Voir la demande et répondre", url: url(`/pro/leads/${d.id}`) });
    sent++;
  }

  await admin.from("demandes").update({ relance_transporteurs_le: new Date().toISOString(), nb_relances_transporteurs: (d.nb_relances_transporteurs ?? 0) + 1 }).eq("id", d.id);
  return NextResponse.json({ ok: true, envoyes: sent, elargi: !!elargir });
}
