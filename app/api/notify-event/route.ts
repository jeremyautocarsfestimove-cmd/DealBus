import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

// Emails transactionnels du cycle de vie :
// - "offre"            → au CLIENT : nouvelle offre de devis reçue (anonyme)
// - "premiere_enchere" → au CLIENT : l'enchère a démarré (1ère relance uniquement)
// - "reservation"      → au TRANSPORTEUR : demande de réservation sur son retour à vide

export async function POST(req: Request) {
  const { type, id } = (await req.json().catch(() => ({}))) as { type?: string; id?: string };
  if (!type || !id) return NextResponse.json({ error: "type et id requis" }, { status: 400 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, sent: 0 });

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const from = process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>";
  /* eslint-disable @typescript-eslint/no-explicit-any */

  try {
    if (type === "offre") {
      const { data: offre } = await admin
        .from("offres")
        .select("prix_ttc, transporteur_id, demande:demandes(id, numero, depart_adresse, arrivee_adresse, client_id)")
        .eq("id", id).single();
      const d = (offre as any)?.demande;
      if (!offre || !d) return NextResponse.json({ error: "offre introuvable" }, { status: 404 });
      const [{ data: client }, { data: anonyme }] = await Promise.all([
        admin.from("profiles").select("email").eq("id", d.client_id).single(),
        admin.from("transporteurs").select("numero_anonyme, note_moyenne, nb_avis").eq("id", offre.transporteur_id).single(),
      ]);
      if (!client?.email) return NextResponse.json({ ok: true, sent: 0 });
      await resend.emails.send({
        from, to: client.email,
        subject: `💶 Nouvelle offre sur votre demande #${d.numero}`,
        text: [
          `Bonne nouvelle,`,
          ``,
          `Le Transporteur #${anonyme?.numero_anonyme}${anonyme?.nb_avis ? ` (★ ${anonyme.note_moyenne}/5, ${anonyme.nb_avis} avis)` : ""} vient de répondre à votre demande ${d.depart_adresse} → ${d.arrivee_adresse} :`,
          ``,
          `${Number(offre.prix_ttc).toLocaleString("fr-FR")} € TTC, tout compris`,
          ``,
          `Comparez et retenez l'offre de votre choix : ${site}/mes-demandes/${d.id}`,
          ``,
          `Chaque transporteur n'a droit qu'à un seul prix — pas de marchandage, pas de relance.`,
          `L'équipe DealBus`,
        ].join("\n"),
      });
      return NextResponse.json({ ok: true, sent: 1 });
    }

    if (type === "premiere_enchere") {
      const { count } = await admin
        .from("bids").select("*", { count: "exact", head: true }).eq("demande_id", id);
      if ((count ?? 0) !== 1) return NextResponse.json({ ok: true, sent: 0, note: "pas la première" });
      const { data: d } = await admin
        .from("demandes").select("id, numero, depart_adresse, arrivee_adresse, client_id, enchere_fin")
        .eq("id", id).single();
      if (!d) return NextResponse.json({ error: "demande introuvable" }, { status: 404 });
      const { data: client } = await admin.from("profiles").select("email").eq("id", d.client_id).single();
      if (!client?.email) return NextResponse.json({ ok: true, sent: 0 });
      await resend.emails.send({
        from, to: client.email,
        subject: `🔨 Votre enchère a démarré — demande #${d.numero}`,
        text: [
          `C'est parti,`,
          ``,
          `Un premier transporteur vient d'enchérir sur votre trajet ${d.depart_adresse} → ${d.arrivee_adresse}.`,
          `Le prix ne peut désormais que baisser, jusqu'à la clôture${d.enchere_fin ? ` le ${new Date(d.enchere_fin).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}` : ""}.`,
          ``,
          `Suivre l'enchère en direct : ${site}/mes-demandes/${d.id}`,
          ``,
          `L'équipe DealBus`,
        ].join("\n"),
      });
      return NextResponse.json({ ok: true, sent: 1 });
    }

    if (type === "reservation") {
      const { data: resa } = await admin
        .from("reservations_retour")
        .select("id, retour:retours_vide(id, depart_adresse, arrivee_adresse, date_dispo, prix_fixe, transporteur_id)")
        .eq("id", id).single();
      const r = (resa as any)?.retour;
      if (!resa || !r) return NextResponse.json({ error: "réservation introuvable" }, { status: 404 });
      const { data: transporteur } = await admin.from("profiles").select("email").eq("id", r.transporteur_id).single();
      if (!transporteur?.email) return NextResponse.json({ ok: true, sent: 0 });
      await resend.emails.send({
        from, to: transporteur.email,
        subject: `🚌 Demande de réservation sur votre retour à vide`,
        text: [
          `Bonne nouvelle,`,
          ``,
          `Un client souhaite réserver votre trajet retour ${r.depart_adresse} → ${r.arrivee_adresse} du ${new Date(r.date_dispo).toLocaleDateString("fr-FR")} (${Number(r.prix_fixe).toLocaleString("fr-FR")} € prix fixe).`,
          ``,
          `Le trajet lui est réservé en exclusivité le temps de votre décision — validez ou refusez rapidement :`,
          `${site}/pro (onglet Mes retours à vide)`,
          ``,
          `L'équipe DealBus`,
        ].join("\n"),
      });
      return NextResponse.json({ ok: true, sent: 1 });
    }

    return NextResponse.json({ error: "type inconnu" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
