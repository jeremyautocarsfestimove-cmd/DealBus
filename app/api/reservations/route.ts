import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHtml } from "@/lib/email";

// Barème DealBus — retour à vide : -2 points, plancher 3 %
function commissionTaux(prix: number): number {
  const base = prix <= 2000 ? 9 : prix <= 5000 ? 7 : 5;
  return Math.max(base - 2, 3);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { reservation_id, action } = (await req.json()) as {
    reservation_id: string;
    action: "valider" | "refuser";
  };
  if (!reservation_id || !["valider", "refuser"].includes(action)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: resa } = await admin
    .from("reservations_retour")
    .select("*, retour:retours_vide(*)")
    .eq("id", reservation_id)
    .single();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const retour = (resa as any)?.retour;
  if (!resa || !retour) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  if (retour.transporteur_id !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (resa.statut !== "en_attente") {
    return NextResponse.json({ error: "Réservation déjà traitée" }, { status: 409 });
  }

  if (action === "refuser") {
    await admin.from("reservations_retour").update({ statut: "refusee" }).eq("id", resa.id);
    await admin.from("retours_vide").update({ statut: "publie" }).eq("id", retour.id);
    return NextResponse.json({ ok: true });
  }

  // ----- VALIDATION : mission + commission retour à vide -----
  const prix = Number(retour.prix_fixe);
  const taux = commissionTaux(prix);

  const { error: mErr } = await admin.from("missions").insert({
    retour_id: retour.id,
    transporteur_id: retour.transporteur_id,
    client_id: resa.client_id,
    prix_final: prix,
    source: "retour_vide",
    commission_taux: taux,
    commission_montant: Math.round(prix * taux) / 100,
  });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  await Promise.all([
    admin.from("reservations_retour").update({ statut: "validee" }).eq("id", resa.id),
    admin.from("reservations_retour").update({ statut: "refusee" })
      .eq("retour_id", retour.id).neq("id", resa.id).eq("statut", "en_attente"),
    admin.from("retours_vide").update({ statut: "confirme" }).eq("id", retour.id),
  ]);

  // Email au client : réservation confirmée + contact du transporteur
  if (process.env.RESEND_API_KEY) {
    try {
      const [{ data: clientUser }, { data: tProfile }, { data: tFiche }] = await Promise.all([
        admin.auth.admin.getUserById(resa.client_id),
        admin.from("profiles").select("nom, telephone, email").eq("id", retour.transporteur_id).single(),
        admin.from("transporteurs").select("raison_sociale").eq("id", retour.transporteur_id).single(),
      ]);
      const email = clientUser?.user?.email;
      if (email) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
          to: email,
          subject: "✅ Votre trajet retour est confirmé",
          text: `Réservation validée : ${retour.depart_adresse} → ${retour.arrivee_adresse} le ${new Date(retour.date_dispo).toLocaleDateString("fr-FR")}, ${prix.toLocaleString("fr-FR")} € TTC.`,
          html: emailHtml({
            titre: "Votre trajet retour est confirmé ✅",
            paragraphes: [
              `Le transporteur a validé votre réservation sur le trajet <strong>${retour.depart_adresse} → ${retour.arrivee_adresse}</strong>, le ${new Date(retour.date_dispo).toLocaleDateString("fr-FR")}.`,
              `<strong>Votre transporteur :</strong> ${tFiche?.raison_sociale ?? ""}<br/>${tProfile?.nom ?? ""}${tProfile?.telephone ? ` · ${tProfile.telephone}` : ""}${tProfile?.email ? ` · ${tProfile.email}` : ""}`,
            ],
            highlight: { label: "Prix fixe — autocar complet", value: `${prix.toLocaleString("fr-FR")} € TTC`, detail: "Vous payez le transporteur directement — DealBus ne prélève rien côté client" },
            note: "Un imprévu ? Contactez directement votre transporteur, puis signalez toute annulation sur la plateforme.",
          }),
        });
      }
    } catch { /* jamais bloquant */ }
  }

  return NextResponse.json({ ok: true });
}
