import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

// Cron quotidien (vercel.json) : pour chaque mission ANNULÉE dont la date de
// trajet est passée, on demande au client si le trajet a réellement eu lieu.
// Déclarations divergentes = signal fort de contournement de commission.

function sign(missionId: string): string {
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(missionId).digest("hex").slice(0, 32);
}

export async function GET(req: Request) {
  // Protection : Vercel Cron envoie Authorization: Bearer CRON_SECRET
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, sent: 0, note: "RESEND_API_KEY absent" });
  }

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const site = process.env.NEXT_PUBLIC_SITE_URL;

  const { data: missions } = await admin
    .from("missions")
    .select("id, demande:demandes(client_id, depart_adresse, arrivee_adresse, date_aller)")
    .eq("statut", "annulee")
    .eq("verification_envoyee", false);

  let sent = 0;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  for (const m of (missions ?? []) as any[]) {
    const d = m.demande;
    if (!d?.date_aller || new Date(d.date_aller) > new Date()) continue; // date pas encore passée

    const { data: authUser } = await admin.auth.admin.getUserById(d.client_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    const token = sign(m.id);
    const base = `${site}/api/verification?mission=${m.id}&token=${token}&reponse=`;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
        to: email,
        subject: "Votre trajet a-t-il finalement eu lieu ?",
        text: [
          `Bonjour,`,
          ``,
          `Votre trajet ${d.depart_adresse} → ${d.arrivee_adresse} du ${new Date(d.date_aller).toLocaleDateString("fr-FR")} a été déclaré annulé.`,
          ``,
          `Pour la qualité du service, pouvez-vous nous confirmer ce qui s'est passé ? Un clic suffit :`,
          ``,
          `→ Le trajet a bien été ANNULÉ : ${base}bien_annule`,
          `→ Le trajet A EU LIEU malgré tout : ${base}a_eu_lieu`,
          ``,
          `Merci de votre aide,`,
          `L'équipe DealBus`,
        ].join("\n"),
      });
      await admin.from("missions").update({ verification_envoyee: true }).eq("id", m.id);
      sent++;
    } catch {
      // on retentera au prochain passage du cron
    }
  }

  return NextResponse.json({ ok: true, sent });
}
