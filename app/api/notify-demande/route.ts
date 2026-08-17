import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcItineraire, dureeA80 } from "@/lib/itineraire";
import { emailHtml } from "@/lib/email";

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
  // (chemin de jointure : zones → transporteurs → profiles ; pas de lien direct zones→profiles)
  const { data: zones, error: zonesError } = await admin
    .from("transporteur_zones")
    .select("transporteur_id, transporteur:transporteurs!inner(statut, profile:profiles!inner(email))")
    .eq("departement", demande.depart_departement)
    .eq("transporteur.statut", "valide");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const emails = Array.from(new Set(
    (zones ?? []).map((z: any) => z.transporteur?.profile?.email).filter(Boolean)
  )) as string[];

  if (zonesError || !emails.length || !process.env.RESEND_API_KEY) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      debug: {
        departement: demande.depart_departement,
        zones_trouvees: zones?.length ?? 0,
        emails_trouves: emails.length,
        erreur_jointure: zonesError?.message ?? null,
        resend_configure: Boolean(process.env.RESEND_API_KEY),
      },
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const site = process.env.NEXT_PUBLIC_SITE_URL;

  // Kilométrage : calcul + mémorisation (best effort, jamais bloquant)
  let ligneKm: string | null = null;
  try {
    const itin = demande.distance_km
      ? { km: Number(demande.distance_km) }
      : await calcItineraire(demande.depart_adresse, demande.arrivee_adresse);
    if (itin) {
      if (!demande.distance_km) {
        await admin.from("demandes").update({ distance_km: itin.km }).eq("id", demande_id);
      }
      const ar = demande.type_trajet === "aller_retour";
      ligneKm = `≈ ${(ar ? itin.km * 2 : itin.km).toLocaleString("fr-FR")} km${ar ? " A/R" : ""} · ≈ ${dureeA80(itin.km)} de route par trajet (moy. 80 km/h)`;
    }
  } catch { /* sans km, l'email part quand même */ }
  const dateAller = new Date(demande.date_aller).toLocaleDateString("fr-FR")
    + (demande.heure_aller ? ` à ${String(demande.heure_aller).slice(0, 5).replace(":", "h")}` : "");
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
        text: `${demande.depart_adresse} → ${demande.arrivee_adresse} · ${dateAller} · ${demande.passagers} pax · ${modeLabel}. Répondre : ${site}/pro`,
        html: emailHtml({
          titre: demande.mode === "enchere" ? "Nouvelle enchère dans votre zone 🔨" : "Nouveau lead dans votre zone 🚌",
          paragraphes: [
            `Une demande vient d'être publiée au départ de votre zone de chalandise :`,
          ],
          highlight: {
            label: modeLabel,
            value: `${demande.depart_adresse} → ${demande.arrivee_adresse}`,
            detail: [`Le ${dateAller}`, `${demande.passagers} passagers`, ligneKm].filter(Boolean).join(" · "),
          },
          cta: { label: "Répondre à la demande", url: `${site}/pro` },
          note: demande.mode === "enchere" && demande.enchere_fin
            ? `Clôture de l'enchère le ${new Date(demande.enchere_fin).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}. Chaque prix positionné vous engage.`
            : "Devis en tir unique : un seul prix, définitif — soignez-le. Premier arrivé, mieux placé.",
        }),
      });
      sent++;
    } catch { /* on continue avec les suivants */ }
  }

  // ---- Copie de veille à l'administration ----
  try {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { data: admins } = await admin
      .from("profiles").select("email").eq("role", "admin").not("email", "is", null);
    const destinataires = (admins ?? []).map((a: any) => a.email).filter(Boolean);
    if (destinataires.length) {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
        to: destinataires,
        subject: `📥 Lead #${demande.numero} — ${demande.depart_adresse} → ${demande.arrivee_adresse}`,
        text: `${modeLabel} · ${dateAller} · ${demande.passagers} pax · dépt. ${demande.depart_departement} · ${sent} transporteur(s) notifié(s). ${site}/admin`,
        html: emailHtml({
          titre: sent > 0 ? "Nouveau lead sur la plateforme 📥" : "⚠ Lead sans couverture",
          paragraphes: [
            `Une demande vient d'être publiée :`,
          ],
          highlight: {
            label: `${modeLabel} · Demande #${demande.numero}`,
            value: `${demande.depart_adresse} → ${demande.arrivee_adresse}`,
            detail: [`Le ${dateAller}`, `${demande.passagers} passagers`, `Départ dépt. ${demande.depart_departement}`, ligneKm].filter(Boolean).join(" · "),
          },
          cta: { label: "Voir dans le back-office", url: `${site}/admin` },
          note: sent > 0
            ? `${sent} transporteur${sent > 1 ? "s" : ""} de la zone ${sent > 1 ? "ont" : "a"} été notifié${sent > 1 ? "s" : ""} par email.`
            : `Aucun transporteur validé ne couvre le département ${demande.depart_departement} : ce lead ne recevra aucune offre. Piste : recruter dans cette zone, ou répondre via Festimove.`,
        }),
      });
    }
  } catch { /* la veille admin ne bloque jamais le flux */ }

  return NextResponse.json({ ok: true, sent });
}
