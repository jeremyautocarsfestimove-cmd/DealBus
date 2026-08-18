import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHtml } from "@/lib/email";

export const maxDuration = 60;

// 📊 Récap quotidien de l'activité DealBus, envoyé chaque matin aux admins.
// Déclenché par Vercel Cron (voir vercel.json).

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, note: "Resend absent" });

  const admin = createAdminClient();
  const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  /* eslint-disable @typescript-eslint/no-explicit-any */

  const nb = async (table: string, filtres?: (q: any) => any) => {
    let q = admin.from(table).select("*", { count: "exact", head: true });
    if (filtres) q = filtres(q);
    const { count } = await q;
    return count ?? 0;
  };

  // ---------- Activité des dernières 24 h ----------
  const [demandes24, offres24, bids24, missions24, terminees24, avis24,
         inscriptions24, resas24, annulations24] = await Promise.all([
    nb("demandes", (q) => q.gte("created_at", depuis)),
    nb("offres", (q) => q.gte("created_at", depuis)),
    nb("bids", (q) => q.gte("created_at", depuis)),
    nb("missions", (q) => q.gte("created_at", depuis)),
    nb("missions", (q) => q.eq("statut", "terminee").gte("terminee_declaree_at", depuis)),
    nb("avis", (q) => q.gte("created_at", depuis)),
    nb("transporteurs", (q) => q.gte("created_at", depuis)),
    nb("reservations_retour", (q) => q.gte("created_at", depuis)),
    nb("missions", (q) => q.eq("statut", "annulee").gte("annulee_at", depuis)),
  ]);

  // ---------- État général ----------
  const [demandesOuvertes, transporteursActifs, transporteursAttente,
         retoursActifs, litiges] = await Promise.all([
    nb("demandes", (q) => q.eq("statut", "ouverte")),
    nb("transporteurs", (q) => q.eq("statut", "valide")),
    nb("transporteurs", (q) => q.eq("statut", "en_attente")),
    nb("retours_vide", (q) => q.eq("statut", "disponible")),
    nb("missions", (q) => q.eq("statut", "litige")),
  ]);

  // Commissions (missions terminées, total)
  const { data: commissions } = await admin
    .from("missions").select("commission_montant").eq("statut", "terminee");
  const totalCommissions = (commissions ?? [])
    .reduce((s: number, m: any) => s + Number(m.commission_montant ?? 0), 0);

  // ---------- Prospection ----------
  const [prospEnvoyes24, prospRestants, prospStops, prospEnvoyesTotal] = await Promise.all([
    nb("prospects", (q) => q.gte("envoye_le", depuis)),
    nb("prospects", (q) => q.eq("statut", "a_contacter")),
    nb("prospects", (q) => q.eq("statut", "stop")),
    nb("prospects", (q) => q.in("statut", ["envoye", "inscrit"])),
  ]);

  // ---------- Destinataires : tous les admins ----------
  const { data: admins } = await admin
    .from("profiles").select("email").eq("role", "admin").not("email", "is", null);
  const destinataires = (admins ?? []).map((a: any) => a.email).filter(Boolean);
  if (!destinataires.length) return NextResponse.json({ ok: true, sent: 0 });

  // ---------- Mise en forme ----------
  const date = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const ligne = (label: string, valeur: string | number, accent = false) =>
    `<tr>
      <td style="padding:7px 0;font-size:13.5px;color:#5A6170;border-bottom:1px solid #EFEBE0;">${label}</td>
      <td style="padding:7px 0;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #EFEBE0;color:${accent ? "#A85D00" : "#12151B"};">${valeur}</td>
    </tr>`;
  const section = (titre: string, lignes: string) =>
    `<div style="font-family:Consolas,Menlo,monospace;font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:#8A8272;margin:18px 0 4px;">${titre}</div>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lignes}</table>`;

  const activite = [
    ligne("Nouvelles demandes", demandes24, demandes24 > 0),
    ligne("Offres déposées", offres24, offres24 > 0),
    ligne("Relances d'enchère", bids24),
    ligne("Sélections (missions créées)", missions24, missions24 > 0),
    ligne("Missions terminées", terminees24),
    ligne("Réservations de retours", resas24),
    ligne("Nouveaux avis", avis24),
    ligne("Inscriptions transporteur", inscriptions24, inscriptions24 > 0),
    ligne("Annulations", annulations24, annulations24 > 0),
  ].join("");

  const etat = [
    ligne("Demandes ouvertes", demandesOuvertes),
    ligne("Transporteurs actifs", transporteursActifs),
    ligne("En attente de validation", transporteursAttente, transporteursAttente > 0),
    ligne("Retours à vide en ligne", retoursActifs),
    ligne("Litiges en cours", litiges, litiges > 0),
    ligne("Commissions cumulées", `${totalCommissions.toLocaleString("fr-FR")} €`, true),
  ].join("");

  const prospection = [
    ligne("Emails envoyés (24 h)", prospEnvoyes24),
    ligne("Total contactés", prospEnvoyesTotal),
    ligne("Restants à contacter", prospRestants),
    ligne("Désinscriptions (STOP)", prospStops),
  ].join("");

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
    to: destinataires,
    subject: `📊 DealBus — récap du ${new Date().toLocaleDateString("fr-FR")} : ${demandes24} demande${demandes24 > 1 ? "s" : ""}, ${offres24 + bids24} réponse${offres24 + bids24 > 1 ? "s" : ""}, ${inscriptions24} inscription${inscriptions24 > 1 ? "s" : ""}`,
    text: `Récap DealBus — ${date}\n\nActivité 24h : ${demandes24} demandes · ${offres24} offres · ${bids24} bids · ${missions24} sélections · ${inscriptions24} inscriptions transporteur\nÉtat : ${demandesOuvertes} demandes ouvertes · ${transporteursActifs} transporteurs actifs · ${transporteursAttente} à valider · ${litiges} litiges\nProspection : ${prospEnvoyes24} envoyés (24h) · ${prospRestants} restants\n\n${process.env.NEXT_PUBLIC_SITE_URL}/admin`,
    html: emailHtml({
      titre: `Votre journée DealBus — ${date}`,
      paragraphes: [
        section("Activité des dernières 24 h", activite),
        section("État de la plateforme", etat),
        section("Campagne de prospection", prospection),
      ],
      cta: { label: "Ouvrir le back-office", url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin` },
      note: transporteursAttente > 0
        ? `⚠ ${transporteursAttente} transporteur${transporteursAttente > 1 ? "s" : ""} en attente de validation — un tour dans le back-office s'impose.`
        : "Rapport généré automatiquement chaque matin à 7h.",
    }),
  });

  return NextResponse.json({ ok: true, sent: destinataires.length });
}
