import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHtml } from "@/lib/email";

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
    const base = `${site}/api/verifications?mission=${m.id}&token=${token}&reponse=`;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
        to: email,
        subject: "Votre trajet a-t-il finalement eu lieu ?",
        text: `Votre trajet ${d.depart_adresse} → ${d.arrivee_adresse} du ${new Date(d.date_aller).toLocaleDateString("fr-FR")} a été déclaré annulé. Annulé : ${base}bien_annule — A eu lieu : ${base}a_eu_lieu`,
        html: emailHtml({
          titre: "Un dernier mot sur votre trajet",
          paragraphes: [
            `Votre trajet <strong>${d.depart_adresse} → ${d.arrivee_adresse}</strong> du ${new Date(d.date_aller).toLocaleDateString("fr-FR")} a été déclaré <strong>annulé</strong>.`,
            `Pour la fiabilité du service, pouvez-vous nous confirmer ce qui s'est passé ? Un simple clic suffit :`,
            `<a href="${base}bien_annule" style="color:#146C43;font-weight:700;">→ Le trajet a bien été annulé</a><br/><br/><a href="${base}a_eu_lieu" style="color:#A85D00;font-weight:700;">→ Le trajet a eu lieu malgré tout</a>`,
          ],
          note: "Votre réponse reste confidentielle et nous aide à garantir des règles identiques pour tous.",
        }),
      });
      await admin.from("missions").update({ verification_envoyee: true }).eq("id", m.id);
      sent++;
    } catch {
      // on retentera au prochain passage du cron
    }
  }

  // ---------- Expiration automatique ----------
  // Demandes ouvertes dont la date de départ est passée → expirées
  const hier = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
  const { data: expDemandes } = await admin
    .from("demandes")
    .update({ statut: "expiree" })
    .eq("statut", "ouverte")
    .lt("date_aller", hier)
    .select("id");
  // Retours à vide dont la date est passée → expirés
  const { data: expRetours } = await admin
    .from("retours_vide")
    .update({ statut: "expire" })
    .in("statut", ["publie", "demande_recue"])
    .lt("date_dispo", hier)
    .select("id");

  return NextResponse.json({ ok: true, sent });
}