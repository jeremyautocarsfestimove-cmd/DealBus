import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHtml } from "@/lib/email";

// Emails transactionnels du cycle de vie :
// - "offre"            → au CLIENT : nouvelle offre de devis reçue (anonyme)
// - "premiere_enchere" → au CLIENT : l'enchère a démarré (1ère relance uniquement)
// - "reservation"      → au TRANSPORTEUR : demande de réservation sur son retour à vide

export async function POST(req: Request) {
  const { type, id } = (await req.json().catch(() => ({}))) as { type?: string; id?: string };
  if (!type || !id) return NextResponse.json({ error: "type et id requis" }, { status: 400 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, sent: 0 });

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const from = process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>";
  /* eslint-disable @typescript-eslint/no-explicit-any */

  try {
    if (type === "offre") {
      const { data: offre } = await admin
        .from("offres")
        .select("prix_ttc, transporteur_id, demande:demandes(id, numero, depart_adresse, arrivee_adresse, client_id)")
        .eq("id", id).single();
      const d = (offre as any)?.demande;
      if (!offre || !d) return NextResponse.json({ error: "offre introuvable" }, { status: 404 });
      const [{ data: client }, { data: anonyme }] = await Promise.all([
        admin.from("profiles").select("email").eq("id", d.client_id).single(),
        admin.from("transporteurs").select("numero_anonyme, note_moyenne, nb_avis").eq("id", offre.transporteur_id).single(),
      ]);
      if (!client?.email) return NextResponse.json({ ok: true, sent: 0 });
      await resend.emails.send({
        from, to: client.email,
        subject: `💶 Nouvelle offre sur votre demande #${d.numero}`,
        text: `Transporteur #${anonyme?.numero_anonyme} propose ${Number(offre.prix_ttc).toLocaleString("fr-FR")} € TTC sur ${d.depart_adresse} → ${d.arrivee_adresse}. Comparer : ${site}/mes-demandes/${d.id}`,
        html: emailHtml({
          titre: "Vous avez reçu une nouvelle offre 💶",
          paragraphes: [
            `Le <strong>Transporteur #${anonyme?.numero_anonyme}</strong>${anonyme?.nb_avis ? ` (★ ${anonyme.note_moyenne}/5 · ${anonyme.nb_avis} avis)` : ""} vient de répondre à votre demande <strong>${d.depart_adresse} → ${d.arrivee_adresse}</strong>.`,
          ],
          highlight: { label: "Son offre, ferme et définitive", value: `${Number(offre.prix_ttc).toLocaleString("fr-FR")} € TTC`, detail: "Tout compris · un seul prix par transporteur, pas de marchandage" },
          cta: { label: "Comparer les offres", url: `${site}/mes-demandes/${d.id}` },
          note: "Les identités restent anonymes jusqu'à votre sélection. Prenez le temps de comparer prix, notes et conditions.",
        }),
      });
      return NextResponse.json({ ok: true, sent: 1 });
    }

    if (type === "premiere_enchere") {
      const { count } = await admin
        .from("bids").select("*", { count: "exact", head: true }).eq("demande_id", id);
      if ((count ?? 0) !== 1) return NextResponse.json({ ok: true, sent: 0, note: "pas la première" });
      const { data: d } = await admin
        .from("demandes").select("id, numero, depart_adresse, arrivee_adresse, client_id, enchere_fin")
        .eq("id", id).single();
      if (!d) return NextResponse.json({ error: "demande introuvable" }, { status: 404 });
      const { data: client } = await admin.from("profiles").select("email").eq("id", d.client_id).single();
      if (!client?.email) return NextResponse.json({ ok: true, sent: 0 });
      await resend.emails.send({
        from, to: client.email,
        subject: `🔨 Votre enchère a démarré (demande #${d.numero})`,
        text: `Premier prix positionné sur ${d.depart_adresse} → ${d.arrivee_adresse}. Suivre : ${site}/mes-demandes/${d.id}`,
        html: emailHtml({
          titre: "Votre enchère a démarré 🔨",
          paragraphes: [
            `Un premier transporteur vient de positionner un prix sur votre trajet <strong>${d.depart_adresse} → ${d.arrivee_adresse}</strong>.`,
            `À partir de maintenant, le prix ne peut que <strong>baisser</strong> : chaque relance doit être inférieure d'au moins 1 % à la meilleure.`,
          ],
          cta: { label: "Suivre l'enchère en direct", url: `${site}/mes-demandes/${d.id}` },
          note: d.enchere_fin
            ? `Clôture le ${new Date(d.enchere_fin).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}. Vous validerez (ou non) la meilleure offre à ce moment-là, rien n'est engagé avant.`
            : "Vous validerez (ou non) la meilleure offre à la clôture, rien n'est engagé avant.",
        }),
      });
      return NextResponse.json({ ok: true, sent: 1 });
    }

    if (type === "reservation") {
      const { data: resa } = await admin
        .from("reservations_retour")
        .select("id, retour:retours_vide(id, depart_adresse, arrivee_adresse, date_dispo, prix_fixe, transporteur_id)")
        .eq("id", id).single();
      const r = (resa as any)?.retour;
      if (!resa || !r) return NextResponse.json({ error: "réservation introuvable" }, { status: 404 });
      const { data: transporteur } = await admin.from("profiles").select("email").eq("id", r.transporteur_id).single();
      if (!transporteur?.email) return NextResponse.json({ ok: true, sent: 0 });
      await resend.emails.send({
        from, to: transporteur.email,
        subject: `🚌 Demande de réservation sur votre retour à vide`,
        text: `Un client souhaite réserver ${r.depart_adresse} → ${r.arrivee_adresse} du ${new Date(r.date_dispo).toLocaleDateString("fr-FR")} (${Number(r.prix_fixe).toLocaleString("fr-FR")} €). Valider : ${site}/pro`,
        html: emailHtml({
          titre: "Quelqu'un veut votre trajet retour 🚌",
          paragraphes: [
            `Un client souhaite réserver votre retour à vide <strong>${r.depart_adresse} → ${r.arrivee_adresse}</strong> du ${new Date(r.date_dispo).toLocaleDateString("fr-FR")}.`,
            `Le trajet lui est réservé <strong>en exclusivité</strong> le temps de votre décision. Répondez vite pour ne pas laisser filer l'opportunité.`,
          ],
          highlight: { label: "Votre prix fixe", value: `${Number(r.prix_fixe).toLocaleString("fr-FR")} € TTC`, detail: "Commission réduite de 2 points sur ce type de trajet" },
          cta: { label: "Valider ou refuser", url: `${site}/pro` },
        }),
      });
      return NextResponse.json({ ok: true, sent: 1 });
    }

    if (type === "inscription_transporteur") {
      const { data: t } = await admin
        .from("transporteurs")
        .select("raison_sociale, siren, secteur, departement_siege, profile:profiles!transporteurs_id_fkey(nom, telephone, email)")
        .eq("id", id).single();
      if (!t) return NextResponse.json({ error: "transporteur introuvable" }, { status: 404 });
      const { data: admins } = await admin
        .from("profiles").select("email").eq("role", "admin").not("email", "is", null);
      const destinataires = (admins ?? []).map((a: any) => a.email).filter(Boolean);
      if (!destinataires.length) return NextResponse.json({ ok: true, sent: 0 });
      const p = (t as any).profile;
      await resend.emails.send({
        from, to: destinataires,
        subject: `🆕 Transporteur à valider : ${t.raison_sociale}`,
        text: `${t.raison_sociale} (SIREN ${t.siren}, ${t.secteur}, dépt. ${t.departement_siege}) attend validation : ${site}/admin`,
        html: emailHtml({
          titre: "Nouvelle inscription à valider",
          paragraphes: [
            `Un transporteur vient de s'inscrire et attend votre validation :`,
            `<strong>${t.raison_sociale}</strong><br/>SIREN ${t.siren} · ${t.secteur} · siège dépt. ${t.departement_siege}<br/>${p?.nom ?? ""}${p?.telephone ? ` · ${p.telephone}` : ""}${p?.email ? ` · ${p.email}` : ""}`,
          ],
          cta: { label: "Examiner et valider", url: `${site}/admin` },
          note: "Vérifications d'usage : titre d'exercice sur le registre officiel, RC Pro à demander. La validation déclenche l'email d'activation.",
        }),
      });
      return NextResponse.json({ ok: true, sent: destinataires.length });
    }

    if (type === "suppression_transporteur") {
      const { data: t } = await admin
        .from("transporteurs")
        .select("raison_sociale, siren, profile:profiles!transporteurs_id_fkey(nom, telephone, email)")
        .eq("id", id).single();
      if (!t) return NextResponse.json({ error: "transporteur introuvable" }, { status: 404 });
      const { data: admins } = await admin
        .from("profiles").select("email").eq("role", "admin").not("email", "is", null);
      const destinataires = (admins ?? []).map((a: any) => a.email).filter(Boolean);
      if (!destinataires.length) return NextResponse.json({ ok: true, sent: 0 });
      const p = (t as any).profile;
      await resend.emails.send({
        from, to: destinataires,
        subject: `🗑️ Demande de suppression de compte : ${t.raison_sociale}`,
        text: `${t.raison_sociale} (SIREN ${t.siren}) demande la suppression de son compte. Traiter : ${site}/admin/transporteurs/${id}`,
        html: emailHtml({
          titre: "Demande de suppression de compte",
          paragraphes: [
            `<strong>${t.raison_sociale}</strong> vient de demander la suppression de son compte transporteur.`,
            `${p?.nom ?? ""}${p?.telephone ? ` · ${p.telephone}` : ""}${p?.email ? ` · ${p.email}` : ""}`,
          ],
          cta: { label: "Traiter la demande", url: `${site}/admin/transporteurs/${id}` },
          note: "Si un historique de missions existe, la suppression anonymise la fiche et bloque le compte sans effacer la comptabilité.",
        }),
      });
      return NextResponse.json({ ok: true, sent: destinataires.length });
    }

    return NextResponse.json({ error: "type inconnu" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}