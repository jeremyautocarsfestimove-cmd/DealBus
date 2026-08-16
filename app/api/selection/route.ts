import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Barème DealBus (identique à la fonction SQL commission_taux)
function commissionTaux(prix: number, source: "devis" | "enchere" | "retour_vide"): number {
  let t = prix <= 2000 ? 9 : prix <= 5000 ? 7 : 5;
  if (source === "enchere") t -= 1;
  if (source === "retour_vide") t -= 2;
  return Math.max(t, 3);
}

async function notifierTransporteur(
  admin: ReturnType<typeof createAdminClient>,
  transporteurId: string,
  clientId: string,
  trajet: string,
  prix: number
) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const [{ data: tUser }, { data: clientProfile }] = await Promise.all([
      admin.auth.admin.getUserById(transporteurId),
      admin.from("profiles").select("nom, telephone, email").eq("id", clientId).single(),
    ]);
    const email = tUser?.user?.email;
    if (!email) return;
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
      to: email,
      subject: "🎉 Votre offre a été retenue !",
      text: [
        `Félicitations,`,
        ``,
        `Votre offre sur le trajet ${trajet} vient d'être retenue, pour ${prix.toLocaleString("fr-FR")} € TTC.`,
        ``,
        `Contact client : ${clientProfile?.nom ?? "voir votre tableau de bord"}${clientProfile?.telephone ? ` · ${clientProfile.telephone}` : ""}${clientProfile?.email ? ` · ${clientProfile.email}` : ""}`,
        ``,
        `Retrouvez tous les détails dans votre espace : ${process.env.NEXT_PUBLIC_SITE_URL}/pro (onglet Mes missions).`,
        `Pensez à déclarer la mission terminée après la prestation — c'est ce qui permet au client de vous laisser un avis.`,
        ``,
        `Bonne route,`,
        `L'équipe DealBus`,
      ].join("\n"),
    });
  } catch {
    // l'email ne doit jamais bloquer la sélection
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = (await req.json()) as
    | { action: "retenir_offre"; offre_id: string }
    | { action: "valider_enchere" | "refuser_enchere"; demande_id: string };

  const admin = createAdminClient();

  /* ---------- DEVIS : retenir une offre ---------- */
  if (body.action === "retenir_offre") {
    const { data: offre } = await admin
      .from("offres")
      .select("*, demande:demandes(id, client_id, statut, mode, depart_adresse, arrivee_adresse)")
      .eq("id", body.offre_id)
      .single();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const d = (offre as any)?.demande;
    if (!offre || !d) return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    if (d.client_id !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    if (d.statut !== "ouverte") return NextResponse.json({ error: "Demande déjà clôturée" }, { status: 409 });

    const prix = Number(offre.prix_ttc);
    const taux = commissionTaux(prix, "devis");

    const { error: mErr } = await admin.from("missions").insert({
      demande_id: d.id,
      client_id: d.client_id,
      transporteur_id: offre.transporteur_id,
      prix_final: prix,
      source: "devis",
      commission_taux: taux,
      commission_montant: Math.round(prix * taux) / 100,
    });
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

    await Promise.all([
      admin.from("offres").update({ statut: "retenue" }).eq("id", offre.id),
      admin.from("offres").update({ statut: "non_retenue" })
        .eq("demande_id", d.id).neq("id", offre.id),
      admin.from("demandes").update({ statut: "confirmee" }).eq("id", d.id),
    ]);

    await notifierTransporteur(admin, offre.transporteur_id, user.id,
      `${d.depart_adresse} → ${d.arrivee_adresse}`, prix);
    return NextResponse.json({ ok: true });
  }

  /* ---------- ENCHÈRE : valider ou refuser après clôture ---------- */
  const { data: demande } = await admin
    .from("demandes").select("*").eq("id", body.demande_id).single();
  if (!demande) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  if (demande.client_id !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (demande.statut !== "ouverte") return NextResponse.json({ error: "Demande déjà clôturée" }, { status: 409 });
  if (demande.mode !== "enchere") return NextResponse.json({ error: "Pas une enchère" }, { status: 400 });
  if (demande.enchere_fin && new Date(demande.enchere_fin) > new Date()) {
    return NextResponse.json({ error: "L'enchère est encore en cours" }, { status: 409 });
  }

  if (body.action === "refuser_enchere") {
    await admin.from("demandes").update({ statut: "expiree" }).eq("id", demande.id);
    return NextResponse.json({ ok: true });
  }

  // valider_enchere : la meilleure (plus basse) relance gagne
  const { data: best } = await admin
    .from("bids")
    .select("transporteur_id, prix_ttc")
    .eq("demande_id", demande.id)
    .order("prix_ttc", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!best) return NextResponse.json({ error: "Aucune enchère reçue" }, { status: 409 });

  const prix = Number(best.prix_ttc);
  const taux = commissionTaux(prix, "enchere");

  const { error: mErr } = await admin.from("missions").insert({
    demande_id: demande.id,
    client_id: demande.client_id,
    transporteur_id: best.transporteur_id,
    prix_final: prix,
    source: "enchere",
    commission_taux: taux,
    commission_montant: Math.round(prix * taux) / 100,
  });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  await admin.from("demandes").update({ statut: "confirmee" }).eq("id", demande.id);
  await notifierTransporteur(admin, best.transporteur_id, user.id,
    `${demande.depart_adresse} → ${demande.arrivee_adresse}`, prix);
  return NextResponse.json({ ok: true });
}
