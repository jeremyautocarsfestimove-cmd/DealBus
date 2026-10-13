import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyer, echap, url } from "@/lib/annulations";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Demande d'annulation d'une mission, par le client OU le transporteur.
// Motif obligatoire. La mission reste « à venir » jusqu'à la décision de DealBus
// (validation ou refus depuis Admin → Annulations & litiges).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: missionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { motif } = (await req.json().catch(() => ({}))) as { motif?: string };
  const motifNettoye = motif?.trim();
  if (!motifNettoye || motifNettoye.length < 10) {
    return NextResponse.json({ error: "Expliquez le motif de l'annulation (10 caractères minimum)" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: mission } = await admin.from("missions")
    .select("id, demande_id, client_id, transporteur_id, statut, prix_final, commission_montant, annulation_demandee_at, annulation_decision, demande:demandes(id, numero, depart_adresse, arrivee_adresse, date_aller)")
    .eq("id", missionId).single();
  if (!mission) return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });

  const role = user.id === mission.transporteur_id ? "transporteur" : user.id === mission.client_id ? "client" : null;
  if (!role) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (mission.statut === "annulee") return NextResponse.json({ ok: true, already_cancelled: true });
  if (mission.statut !== "a_venir") return NextResponse.json({ error: "Cette mission ne peut plus être annulée" }, { status: 409 });
  if (mission.annulation_demandee_at && !mission.annulation_decision) {
    return NextResponse.json({ error: "Une demande d'annulation est déjà en cours d'examen" }, { status: 409 });
  }

  const { error } = await admin.from("missions").update({
    annulation_motif: motifNettoye,
    annulation_demandee_par: user.id,
    annulation_demandee_role: role,
    annulation_demandee_at: new Date().toISOString(),
    annulation_decision: null,
    annulation_decidee_at: null,
  }).eq("id", missionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ---------- Notifications ----------
  const demande: any = Array.isArray(mission.demande) ? mission.demande[0] : mission.demande;
  const trajet = demande ? `${demande.depart_adresse} → ${demande.arrivee_adresse}` : "votre trajet";
  const date = demande?.date_aller ? ` prévu le ${new Date(demande.date_aller).toLocaleDateString("fr-FR")}` : "";
  const [{ data: admins }, { data: tFiche }, { data: clientUser }, { data: tUser }] = await Promise.all([
    admin.from("profiles").select("email").eq("role", "admin").not("email", "is", null),
    admin.from("transporteurs").select("raison_sociale").eq("id", mission.transporteur_id).single(),
    admin.auth.admin.getUserById(mission.client_id),
    admin.auth.admin.getUserById(mission.transporteur_id),
  ]);
  const qui = role === "transporteur" ? (tFiche?.raison_sociale ?? "Le transporteur") : "Le client";

  // Admin : à traiter
  await envoyer((admins ?? []).map((a: any) => a.email).filter(Boolean),
    `⚠️ Demande d'annulation (${role}) — #${demande?.numero ?? "?"}`,
    "Demande d'annulation à traiter",
    [`<strong>${echap(qui)}</strong> demande l'annulation de la mission <strong>${echap(trajet)}</strong>${date}.`,
     `<strong>Motif :</strong> « ${echap(motifNettoye)} »`,
     `Commission en jeu : ${Number(mission.commission_montant ?? 0).toLocaleString("fr-FR")} € sur ${Number(mission.prix_final).toLocaleString("fr-FR")} €.`],
    { label: "Valider ou refuser", url: url("/admin/litiges") });

  // L'autre partie : informée, rien n'est annulé pour l'instant
  const autreEmail = role === "transporteur" ? clientUser?.user?.email : tUser?.user?.email;
  const lienAutre = role === "transporteur" ? url(`/mes-demandes/${demande?.id ?? ""}`) : url(`/pro/missions/${missionId}`);
  if (autreEmail) {
    await envoyer(autreEmail, `⚠️ Demande d'annulation sur ${trajet}`, "Une annulation a été demandée",
      [`${echap(qui)} a demandé l'annulation de la mission <strong>${echap(trajet)}</strong>${date}.`,
       `<strong>Motif communiqué :</strong> « ${echap(motifNettoye)} »`,
       "Rien n'est annulé pour l'instant : DealBus examine la demande et vous informe de sa décision. Si vous contestez ce motif, écrivez-nous depuis la bulle Aide."],
      { label: "Voir le dossier", url: lienAutre });
  }
  // Le demandeur : accusé de réception
  const monEmail = role === "transporteur" ? tUser?.user?.email : clientUser?.user?.email;
  if (monEmail) {
    await envoyer(monEmail, `Demande d'annulation enregistrée — ${trajet}`, "Votre demande d'annulation est enregistrée",
      [`Nous avons bien reçu votre demande d'annulation pour <strong>${echap(trajet)}</strong>${date}.`,
       "DealBus l'examine et vous répond rapidement. Tant qu'elle n'est pas validée, la mission reste prévue."],
      undefined, "Une annulation non justifiée ou un trajet finalement réalisé en direct constituent un contournement de la plateforme.");
  }

  return NextResponse.json({ ok: true, en_attente: true });
}
