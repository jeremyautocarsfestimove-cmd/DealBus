import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: missionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { motif } = (await req.json().catch(() => ({}))) as { motif?: string };
  const motifNettoye = motif?.trim();
  if (!motifNettoye) {
    return NextResponse.json({ error: "Le motif d'annulation est obligatoire" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: mission, error: missionError } = await admin
    .from("missions")
    .select(`
      id,
      demande_id,
      client_id,
      transporteur_id,
      statut,
      prix_final,
      demande:demandes(id, numero, depart_adresse, arrivee_adresse, date_aller)
    `)
    .eq("id", missionId)
    .single();

  if (missionError || !mission) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  if (mission.transporteur_id !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (mission.statut === "annulee") {
    return NextResponse.json({ ok: true, already_cancelled: true });
  }

  if (mission.statut !== "a_venir") {
    return NextResponse.json({ error: "Cette mission ne peut plus être annulée" }, { status: 409 });
  }

  const { error: updateError } = await admin
    .from("missions")
    .update({
      statut: "annulee",
      annulee_par: user.id,
      annulation_motif: motifNettoye,
      annulee_at: new Date().toISOString(),
    })
    .eq("id", missionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // L'annulation reste portée par la mission. La demande reste accessible au client,
  // et les pages client affichent explicitement l'annulation et son motif.
  let emailSent = false;

  if (process.env.RESEND_API_KEY && mission.client_id) {
    try {
      const [{ data: clientUser }, { data: transporteur }] = await Promise.all([
        admin.auth.admin.getUserById(mission.client_id),
        admin.from("transporteurs").select("raison_sociale").eq("id", mission.transporteur_id).single(),
      ]);

      const email = clientUser?.user?.email;
      if (email) {
        const demande = Array.isArray(mission.demande) ? mission.demande[0] : mission.demande;
        const trajet = demande
          ? `${demande.depart_adresse} → ${demande.arrivee_adresse}`
          : "votre trajet";
        const date = demande?.date_aller
          ? new Date(demande.date_aller).toLocaleDateString("fr-FR")
          : null;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? new URL(req.url).origin;
        const demandeUrl = demande?.id ? `${siteUrl}/mes-demandes/${demande.id}` : `${siteUrl}/mes-demandes`;
        const transporteurNom = transporteur?.raison_sociale ?? "Le transporteur";

        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
          to: email,
          subject: `⚠️ Annulation de votre transport ${trajet}`,
          text: [
            "Bonjour,",
            "",
            `${transporteurNom} vient d'annuler la mission ${trajet}${date ? ` prévue le ${date}` : ""}.`,
            "",
            `Motif communiqué : ${motifNettoye}`,
            "",
            "L'annulation apparaît également dans votre espace DealBus.",
            `Consulter ma demande : ${demandeUrl}`,
            "",
            "L'équipe DealBus",
          ].join("\n"),
          html: `
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#171a1f">
              <div style="background:#171a1f;color:#fff;padding:24px 28px;border-radius:10px 10px 0 0">
                <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#f0aa35">DealBus</div>
                <h1 style="margin:10px 0 0;font-size:26px">Votre transporteur a annulé la mission</h1>
              </div>
              <div style="padding:28px;border:1px solid #ddd;border-top:0;border-radius:0 0 10px 10px">
                <p><strong>${transporteurNom}</strong> vient d'annuler votre transport <strong>${trajet}</strong>${date ? ` prévu le <strong>${date}</strong>` : ""}.</p>
                <div style="margin:22px 0;padding:16px 18px;background:#fff4e1;border-left:4px solid #f0aa35;border-radius:6px">
                  <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#777;margin-bottom:6px">Motif communiqué</div>
                  <strong>${motifNettoye.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong>
                </div>
                <p>Cette annulation est également signalée dans votre espace DealBus.</p>
                <p style="margin:28px 0 8px"><a href="${demandeUrl}" style="display:inline-block;background:#f0aa35;color:#111;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:7px">Voir ma demande</a></p>
                <p style="font-size:12px;color:#777;margin-top:28px">L'équipe DealBus</p>
              </div>
            </div>
          `,
        });
        emailSent = true;
      }
    } catch (error) {
      console.error("[DealBus] Email annulation client non envoyé:", error);
      // L'échec email ne doit pas annuler l'annulation métier.
    }
  }

  return NextResponse.json({ ok: true, email_sent: emailSent });
}