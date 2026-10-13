import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyer, echap, url } from "@/lib/annulations";
import { INCLUS } from "@/lib/assistant-demande";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Relance d'un client dont la demande a reçu des offres sans décision :
// email récapitulatif des offres + message dans la bulle Aide (tracé).
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Accès réservé" }, { status: 403 });

  const { demande_id, message } = (await req.json().catch(() => ({}))) as { demande_id?: string; message?: string };
  if (!demande_id) return NextResponse.json({ error: "demande_id requis" }, { status: 400 });

  const admin = createAdminClient();
  const { data: d } = await admin.from("demandes")
    .select("id, numero, client_id, statut, depart_adresse, arrivee_adresse, date_aller, passagers, nb_relances")
    .eq("id", demande_id).maybeSingle();
  if (!d) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  if (d.statut !== "ouverte") return NextResponse.json({ error: "La demande n'est plus ouverte" }, { status: 409 });

  const { data: offres } = await admin.from("offres")
    .select("prix_ttc, vehicule_type, vehicule_places, vehicule_annee, inclus, validite_jours, created_at, transporteur:transporteurs(numero_anonyme, note_moyenne, nb_avis)")
    .eq("demande_id", d.id).in("statut", ["envoyee", "consultee"]).order("prix_ttc", { ascending: true });
  if (!offres?.length) return NextResponse.json({ error: "Aucune offre en attente sur cette demande" }, { status: 409 });

  const trajet = `${d.depart_adresse} → ${d.arrivee_adresse}`;
  const date = d.date_aller ? new Date(d.date_aller).toLocaleDateString("fr-FR") : "";
  const prixMin = Number(offres[0].prix_ttc), prixMax = Number(offres[offres.length - 1].prix_ttc);
  const lignes = offres.map((o: any) => {
    const t = Array.isArray(o.transporteur) ? o.transporteur[0] : o.transporteur;
    const inclus = (o.inclus ?? []).map((i: string) => INCLUS.find((x) => x.id === i)?.label ?? i).join(", ");
    return `<strong>${Number(o.prix_ttc).toLocaleString("fr-FR")} € TTC</strong> · Transporteur #${t?.numero_anonyme ?? "?"}${t?.nb_avis ? ` (★ ${t.note_moyenne}/5, ${t.nb_avis} avis)` : ""} · ${echap(o.vehicule_type)} ${o.vehicule_places} pl.${o.vehicule_annee ? ` ${o.vehicule_annee}` : ""}${inclus ? ` · inclus : ${echap(inclus)}` : ""}`;
  });

  const texteAdmin = (message ?? "").trim();
  const intro = texteAdmin
    ? echap(texteAdmin).replace(/\n/g, "<br/>")
    : `Votre demande <strong>#${d.numero} ${echap(trajet)}</strong>${date ? ` (départ le ${date})` : ""} a reçu <strong>${offres.length} offre${offres.length > 1 ? "s" : ""}</strong> de transporteurs vérifiés, de ${prixMin.toLocaleString("fr-FR")} à ${prixMax.toLocaleString("fr-FR")} € TTC. Elles attendent votre décision.`;

  // 1. Email
  const { data: cu } = await admin.auth.admin.getUserById(d.client_id);
  if (cu?.user?.email) {
    await envoyer(cu.user.email, `⏳ ${offres.length} offre${offres.length > 1 ? "s" : ""} vous attend${offres.length > 1 ? "ent" : ""} — demande #${d.numero}`,
      "Vos offres attendent votre décision",
      [intro,
       `<ul style="padding-left:18px;margin:0;">${lignes.map((l) => `<li style="margin:0 0 8px;">${l}</li>`).join("")}</ul>`,
       "Les offres ont une durée de validité : passé ce délai, le transporteur peut ne plus être disponible. Si aucune ne vous convient, vous pouvez poser une question au transporteur par la messagerie, ou clore la demande en indiquant le motif."],
      { label: "Comparer et choisir", url: url(`/mes-demandes/${d.id}`) },
      "Vous payez directement le transporteur retenu. Une question ? Répondez-nous depuis la bulle Aide.");
  }

  // 2. Message dans la bulle Aide (tracé, lié à la demande)
  const { data: conv } = await admin.from("support_conversations")
    .insert({ user_id: d.client_id, demande_id: d.id, sujet: `Relance : ${offres.length} offre(s) en attente sur #${d.numero}`, ouverte_par: "admin" })
    .select("id").single();
  if (conv) {
    await admin.from("support_messages").insert({
      conversation_id: conv.id, auteur: "admin",
      contenu: texteAdmin || `Bonjour,\n\nVotre demande #${d.numero} (${trajet}) a reçu ${offres.length} offre${offres.length > 1 ? "s" : ""}, de ${prixMin.toLocaleString("fr-FR")} à ${prixMax.toLocaleString("fr-FR")} € TTC. Elles attendent votre décision : retenez celle qui vous convient depuis « Mes demandes », ou posez vos questions aux transporteurs par la messagerie.\n\nL'équipe DealBus`,
    });
  }

  await admin.from("demandes").update({ relancee_le: new Date().toISOString(), nb_relances: (d.nb_relances ?? 0) + 1 }).eq("id", d.id);
  return NextResponse.json({ ok: true, offres: offres.length });
}
