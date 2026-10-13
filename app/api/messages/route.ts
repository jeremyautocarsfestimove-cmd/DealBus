import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHtml } from "@/lib/email";
import { detecterContacts, detecterPrix, LIBELLES_INFRACTION } from "@/lib/messagerie";

export const maxDuration = 30;

/* eslint-disable @typescript-eslint/no-explicit-any */

type Corps =
  | { action?: "envoyer"; demande_id: string; transporteur_id: string; contenu: string }
  | { action: "lu"; demande_id: string; transporteur_id: string };

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Corps;
  if (!body.demande_id || !body.transporteur_id) {
    return NextResponse.json({ error: "demande_id et transporteur_id requis" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: demande } = await admin
    .from("demandes").select("id, numero, client_id, statut, depart_adresse, arrivee_adresse")
    .eq("id", body.demande_id).maybeSingle();
  if (!demande) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

  // Qui parle ? Le client de la demande, ou le transporteur de la conversation (validé).
  let role: "client" | "transporteur";
  if (user.id === demande.client_id) role = "client";
  else if (user.id === body.transporteur_id) {
    const { data: t } = await admin.from("transporteurs").select("statut").eq("id", user.id).maybeSingle();
    if (t?.statut !== "valide") return NextResponse.json({ error: "Compte transporteur non validé" }, { status: 403 });
    role = "transporteur";
  } else return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // ---------- Marquer comme lu ----------
  if (body.action === "lu") {
    await admin.from("messages")
      .update({ lu_le: new Date().toISOString() })
      .eq("demande_id", body.demande_id).eq("transporteur_id", body.transporteur_id)
      .neq("auteur_id", user.id).is("lu_le", null);
    return NextResponse.json({ ok: true });
  }

  // ---------- Envoyer ----------
  const contenu = String((body as any).contenu ?? "").trim();
  if (contenu.length < 2) return NextResponse.json({ error: "Message vide" }, { status: 400 });
  if (contenu.length > 2000) return NextResponse.json({ error: "Message trop long (2 000 caractères maximum)" }, { status: 400 });
  if (!["ouverte", "selection", "confirmee"].includes(demande.statut)) {
    return NextResponse.json({ error: "Cette demande est close" }, { status: 409 });
  }

  // Identités révélées ? Seulement si la mission lie ces deux parties.
  const { data: mission } = await admin.from("missions").select("id")
    .eq("demande_id", demande.id).eq("transporteur_id", body.transporteur_id).maybeSingle();
  const anonyme = !mission;

  const motifs: string[] = [];
  if (anonyme) {
    const infractions = detecterContacts(contenu);
    if (infractions.length) {
      motifs.push(`Il contient ${infractions.map((i) => LIBELLES_INFRACTION[i]).join(", ")} : les coordonnées ne s'échangent qu'après la sélection.`);
    }
  }
  if (role === "transporteur" && anonyme) {
    const prix = detecterPrix(contenu);
    if (prix.length) {
      const { data: offre } = await admin.from("offres").select("prix_ttc")
        .eq("demande_id", demande.id).eq("transporteur_id", user.id).maybeSingle();
      const monPrix = offre ? Number(offre.prix_ttc) : null;
      const autre = prix.some((p) => monPrix === null || Math.abs(p - monPrix) > 1);
      if (autre) {
        motifs.push(monPrix === null
          ? "Il contient un prix : un prix se communique en publiant une offre, pas dans un message."
          : `Il contient un prix différent de votre offre (${monPrix.toLocaleString("fr-FR")} €) : une offre est définitive, le prix ne se renégocie pas par message.`);
      }
    }
  }
  if (motifs.length) return NextResponse.json({ error: "Message non envoyé", motifs }, { status: 422 });

  const { data: msg, error } = await admin.from("messages").insert({
    demande_id: demande.id,
    transporteur_id: body.transporteur_id,
    auteur_id: user.id,
    auteur_role: role,
    contenu,
  }).select("id, created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ---------- Email à l'autre partie (jamais bloquant) ----------
  if (process.env.RESEND_API_KEY) {
    try {
      const site = process.env.NEXT_PUBLIC_SITE_URL;
      const destinataireId = role === "client" ? body.transporteur_id : demande.client_id;
      const { data: dest } = await admin.auth.admin.getUserById(destinataireId);
      const email = dest?.user?.email;
      if (email) {
        const { data: anon } = await admin.from("transporteurs").select("numero_anonyme").eq("id", body.transporteur_id).single();
        const expediteur = role === "client" ? "Le client" : `Le Transporteur #${anon?.numero_anonyme ?? ""}`;
        const url = role === "client" ? `${site}/pro/leads/${demande.id}` : `${site}/mes-demandes/${demande.id}`;
        const extrait = contenu.length > 280 ? contenu.slice(0, 277) + "…" : contenu;
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
          to: email,
          subject: `💬 Nouveau message sur la demande #${demande.numero}`,
          text: `${expediteur} vous a écrit au sujet de ${demande.depart_adresse} → ${demande.arrivee_adresse} :\n\n${extrait}\n\nRépondre : ${url}`,
          html: emailHtml({
            titre: "Vous avez un nouveau message 💬",
            paragraphes: [
              `${expediteur} vous a écrit au sujet de la demande <strong>${demande.depart_adresse} → ${demande.arrivee_adresse}</strong> :`,
              `<em style="color:#5A6170;">« ${extrait.replace(/</g, "&lt;")} »</em>`,
            ],
            cta: { label: "Répondre sur DealBus", url },
            note: "Les échanges se font sur la plateforme : ne répondez pas à cet email.",
          }),
        });
      }
    } catch { /* jamais bloquant */ }
  }

  return NextResponse.json({ ok: true, id: msg.id });
}
