import { createHmac } from "crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHtml } from "@/lib/email";

// Réponse du client au mail de vérification — lien signé, aucune connexion requise.
// "a_eu_lieu" sur une mission annulée → passage en LITIGE (contournement suspecté).

function sign(missionId: string): string {
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(missionId).digest("hex").slice(0, 32);
}

function page(titre: string, texte: string): Response {
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>DealBus</title></head>
<body style="margin:0;background:#12151B;color:#F5F2EA;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px">
<div><h1 style="font-size:26px;margin-bottom:12px">${titre}</h1><p style="color:rgba(245,242,234,.75);max-width:420px">${texte}</p></div>
</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const missionId = url.searchParams.get("mission");
  const token = url.searchParams.get("token");
  const reponse = url.searchParams.get("reponse");

  if (!missionId || !token || !reponse || !["a_eu_lieu", "bien_annule"].includes(reponse)
      || token !== sign(missionId)) {
    return page("Lien invalide", "Ce lien de vérification est invalide ou a expiré.");
  }

  const admin = createAdminClient();
  await admin.from("missions").update({
    client_confirmation: reponse,
    ...(reponse === "a_eu_lieu" && { statut: "litige" }),
  }).eq("id", missionId);

  // ⚠ Contournement suspecté : alerte immédiate de l'administration
  if (reponse === "a_eu_lieu" && process.env.RESEND_API_KEY) {
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const { data: mission } = await admin
        .from("missions")
        .select("prix_final, commission_montant, annulation_motif, demande:demandes(numero, depart_adresse, arrivee_adresse, date_aller), transporteur:transporteurs(raison_sociale)")
        .eq("id", missionId).single() as { data: any };
      const { data: admins } = await admin
        .from("profiles").select("email").eq("role", "admin").not("email", "is", null);
      const destinataires = (admins ?? []).map((a: any) => a.email).filter(Boolean);
      if (mission && destinataires.length) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
          to: destinataires,
          subject: `⚠ LITIGE — trajet annulé mais réalisé (mission #${mission.demande?.numero ?? ""})`,
          text: `Le client confirme que le trajet ${mission.demande?.depart_adresse} → ${mission.demande?.arrivee_adresse} a eu lieu malgré l'annulation. ${process.env.NEXT_PUBLIC_SITE_URL}/admin`,
          html: emailHtml({
            titre: "⚠ Contournement suspecté",
            paragraphes: [
              `Le client vient de confirmer que le trajet suivant, déclaré <strong>annulé</strong>, a <strong>bien eu lieu</strong> :`,
              `<strong>${mission.demande?.depart_adresse} → ${mission.demande?.arrivee_adresse}</strong> du ${mission.demande?.date_aller ? new Date(mission.demande.date_aller).toLocaleDateString("fr-FR") : "—"}<br/>Transporteur : ${mission.transporteur?.raison_sociale ?? "—"}<br/>Motif d'annulation déclaré : « ${mission.annulation_motif ?? "—"} »`,
            ],
            highlight: {
              label: "Commission en jeu",
              value: `${Number(mission.commission_montant).toLocaleString("fr-FR")} €`,
              detail: `Mission de ${Number(mission.prix_final).toLocaleString("fr-FR")} € — droit de suite applicable (CGU art. 13)`,
            },
            cta: { label: "Instruire le litige", url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin` },
          }),
        });
      }
    } catch { /* l'alerte ne doit pas empêcher la page de réponse */ }
  }

  return reponse === "bien_annule"
    ? page("Merci !", "C'est noté : le trajet a bien été annulé. Merci de nous aider à garder DealBus fiable.")
    : page("Merci pour votre signalement", "C'est noté : le trajet a eu lieu. Notre équipe va examiner la situation — vous n'avez rien d'autre à faire.");
}
