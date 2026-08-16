import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

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

  return reponse === "bien_annule"
    ? page("Merci !", "C'est noté : le trajet a bien été annulé. Merci de nous aider à garder DealBus fiable.")
    : page("Merci pour votre signalement", "C'est noté : le trajet a eu lieu. Notre équipe va examiner la situation — vous n'avez rien d'autre à faire.");
}
