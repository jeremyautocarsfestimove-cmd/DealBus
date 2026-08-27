import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Webhook Resend : marque automatiquement les prospects dont l'email
// rebondit (statut "erreur") ou qui se plaignent (statut "stop"), dans les
// deux tables de prospection (transporteurs et clients).
//
// Configuration (dashboard Resend → Webhooks) :
//   URL      : https://dealbus.fr/api/webhooks/resend
//   Événements : email.bounced, email.complained
//   Copier le "Signing Secret" (whsec_…) dans la variable d'environnement
//   RESEND_WEBHOOK_SECRET sur Vercel.

export const maxDuration = 30;

// Vérification de la signature Svix (format utilisé par Resend), sans
// dépendance : HMAC-SHA256 base64 de "id.timestamp.payload".
function signatureValide(req: Headers, corps: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return false;
  const id = req.get("svix-id");
  const timestamp = req.get("svix-timestamp");
  const signatures = req.get("svix-signature");
  if (!id || !timestamp || !signatures) return false;

  // Rejette les messages de plus de 5 minutes (anti-rejeu)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const cle = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const attendue = crypto
    .createHmac("sha256", cle)
    .update(`${id}.${timestamp}.${corps}`)
    .digest("base64");

  // L'en-tête peut contenir plusieurs signatures : "v1,xxx v1,yyy"
  return signatures.split(" ").some((s) => {
    const valeur = s.split(",")[1] ?? "";
    try {
      return crypto.timingSafeEqual(Buffer.from(valeur), Buffer.from(attendue));
    } catch {
      return false;
    }
  });
}

export async function POST(req: Request) {
  const corps = await req.text();

  if (!signatureValide(req.headers, corps)) {
    return NextResponse.json({ error: "signature invalide" }, { status: 401 });
  }

  let evenement: { type?: string; data?: { to?: string[] | string } };
  try {
    evenement = JSON.parse(corps);
  } catch {
    return NextResponse.json({ error: "payload invalide" }, { status: 400 });
  }

  const type = evenement.type ?? "";
  if (type !== "email.bounced" && type !== "email.complained") {
    // Autres événements : acquittés sans action.
    return NextResponse.json({ ok: true, ignore: type });
  }

  const brut = evenement.data?.to;
  const destinataires = (Array.isArray(brut) ? brut : [brut])
    .filter((e): e is string => typeof e === "string" && e.includes("@"))
    .map((e) => e.trim().toLowerCase());
  if (!destinataires.length) return NextResponse.json({ ok: true, ignore: "sans destinataire" });

  const admin = createAdminClient();
  const nouveau = type === "email.bounced"
    ? { statut: "erreur", erreur: "hard bounce (signalé par Resend)" }
    : { statut: "stop", erreur: "plainte spam (signalé par Resend)" };

  // Un prospect devenu client reste inscrit : on ne l'écrase jamais.
  await admin.from("prospects").update(nouveau)
    .in("email", destinataires).neq("statut", "inscrit");
  await admin.from("prospects_clients").update(nouveau)
    .in("email", destinataires).neq("statut", "inscrit");

  return NextResponse.json({ ok: true, traites: destinataires.length });
}