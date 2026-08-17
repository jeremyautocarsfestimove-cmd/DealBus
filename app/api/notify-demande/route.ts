import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

// Notifie par email tous les transporteurs VALIDÉS dont une zone couvre
// le département de départ. Contenu 100 % anonyme (aucune info client).

export async function POST(req: Request) {
  const { demande_id } = (await req.json().catch(() => ({}))) as { demande_id?: string };
  if (!demande_id) return NextResponse.json({ error: "demande_id requis" }, { status: 400 });

  const admin = createAdminClient();

  // Verrou anti-doublon : on ne notifie qu'une fois par demande
  const { data: demande } = await admin
    .from("demandes")
    .update({ notification_envoyee: true })
    .eq("id", demande_id)
    .eq("notification_envoyee", false)
    .eq("statut", "ouverte")
    .select("*")
    .maybeSingle();
  if (!demande) return NextResponse.json({ ok: true, sent: 0, note: "déjà notifiée ou close" });

  // Transporteurs validés couvrant le département de départ
  const { data: zones } = await admin
    .from("transporteur_zones")
    .select("transporteur_id, transporteur:transporteurs!inner(statut), profile:profiles!inner(email)")
    .eq("departement", demande.depart_departement)
    .eq("transporteur.statut", "valide");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const emails = Array.from(new Set(
    (zones ?? []).map((z: any) => z.profile?.email).filter(Boolean)
  )) as string[];

  if (!emails.length || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const dateAller = new Date(demande.date_aller).toLocaleDateString("fr-FR");
  const modeLabel = demande.mode === "enchere" ? "Enchère en direct" : "Demande de devis";
  const sujet = demande.mode === "enchere"
    ? `🔨 Nouvelle enchère : ${demande.depart_adresse} → ${demande.arrivee_adresse}`
    : `🚌 Nouveau lead : ${demande.depart_adresse} → ${demande.arrivee_adresse}`;

  let sent = 0;
  for (const email of emails) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
        to: email,
        subject: sujet,
        text: [
          `Une nouvelle demande vient d'arriver dans votre zone :`,
          ``,
          `${demande.depart_adresse} → ${demande.arrivee_adresse}`,
          `Le ${dateAller} · ${demande.passagers} passagers · ${modeLabel}`,
          demande.mode === "enchere" && demande.enchere_fin
            ? `Clôture de l'enchère : ${new Date(demande.enchere_fin).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`
            : `Devis en tir unique : un seul prix, définitif — soignez-le.`,
          ``,
          `Répondre à la demande : ${site}/pro`,
          ``,
          `Premier arrivé, mieux placé. Bonne route,`,
          `L'équipe DealBus`,
        ].filter(Boolean).join("\n"),
      });
      sent++;
    } catch { /* on continue avec les suivants */ }
  }

  return NextResponse.json({ ok: true, sent });
}
