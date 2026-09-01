import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sujetProspectionClient, texteProspectionClient, htmlProspectionClient,
  sujetRelanceClient, texteRelanceClient, htmlRelanceClient,
} from "@/lib/prospection-clients";

export const maxDuration = 60;

// Toutes les actions exigent un compte admin authentifié.
async function verifierAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  return me?.role === "admin" ? user : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// GET ?preview=1 → aperçu de l'email exactement tel qu'il partira
export async function GET(req: Request) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "réservé à l'administration" }, { status: 403 });
  }
  const url = new URL(req.url);
  if (!url.searchParams.get("preview")) {
    return NextResponse.json({ error: "?preview=1 attendu" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data: premier } = await admin
    .from("prospects_clients").select("email, nom, departement")
    .eq("statut", "a_contacter").limit(1).maybeSingle();
  const echantillon = premier ?? { email: "contact@exemple.fr", nom: "Association Exemple", departement: "76" };
  const sujet = sujetProspectionClient(echantillon);
  const bandeau = `<div style="background:#12151B;color:#F5F2EA;font-family:Consolas,monospace;font-size:12px;padding:12px 20px;">
    APERÇU — Objet : <strong style="color:#E8A63D;">${sujet}</strong>
    &nbsp;·&nbsp; Expéditeur : ${process.env.CAMPAGNE_FROM ?? process.env.RESEND_FROM ?? "Jeremy de DealBus <contact@dealbus.fr>"}
    &nbsp;·&nbsp; Exemple : ${echantillon.email}${echantillon.departement ? ` (dépt ${echantillon.departement})` : ""}
  </div>`;
  return new Response(bandeau + htmlProspectionClient(echantillon), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "réservé à l'administration" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();

  /* eslint-disable @typescript-eslint/no-explicit-any */

  // ---------- IMPORT CSV ----------
  if (body.action === "import") {
    const contacts = (body.contacts ?? []) as { email?: string; nom?: string; departement?: string }[];
    const propres = contacts
      .map((c) => ({
        email: (c.email ?? "").trim().toLowerCase(),
        nom: (c.nom ?? "").trim() || null,
        departement: (c.departement ?? "").trim().slice(0, 2) || null,
      }))
      .filter((c) => EMAIL_RE.test(c.email));

    // dédoublonnage interne au fichier
    const vus = new Set<string>();
    const uniques = propres.filter((c) => (vus.has(c.email) ? false : (vus.add(c.email), true)));

    let inseres = 0;
    for (let i = 0; i < uniques.length; i += 500) {
      const lot = uniques.slice(i, i + 500);
      const { data } = await admin
        .from("prospects_clients")
        .upsert(lot, { onConflict: "email", ignoreDuplicates: true })
        .select("id");
      inseres += data?.length ?? 0;
    }
    return NextResponse.json({
      ok: true,
      recus: contacts.length,
      valides: uniques.length,
      nouveaux: inseres,
      deja_connus: uniques.length - inseres,
    });
  }

  // ---------- ENVOYER UNE VAGUE ----------
  if (body.action === "envoyer") {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY non configurée" }, { status: 500 });
    }
    const limite = Math.min(Math.max(Number(body.limite) || 40, 1), 1000);
    const { data: cibles } = await admin
      .from("prospects_clients")
      .select("id, email, nom, departement")
      .eq("statut", "a_contacter")
      .order("created_at", { ascending: true })
      .limit(limite);

    if (!cibles?.length) return NextResponse.json({ ok: true, envoyes: 0, note: "aucun prospect à contacter" });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.CAMPAGNE_FROM ?? process.env.RESEND_FROM ?? "Jeremy de DealBus <contact@dealbus.fr>";
    let envoyes = 0, erreurs = 0;

    // Envoi par lots de 20 via l'API batch (évite les timeouts serverless)
    for (let i = 0; i < cibles.length; i += 50) {
      const lot = cibles.slice(i, i + 50);
      try {
        const { data, error } = await resend.batch.send(
          lot.map((p: any) => ({
            from,
            to: p.email,
            replyTo: "contact@dealbus.fr",
            subject: sujetProspectionClient(p),
            text: texteProspectionClient(p),
            html: htmlProspectionClient(p),
            headers: { "List-Unsubscribe": "<mailto:contact@dealbus.fr?subject=STOP>" },
          }))
        );
        if (error) throw new Error(error.message);
        const ids = lot.map((p: any) => p.id);
        await admin.from("prospects_clients")
          .update({ statut: "envoye", envoye_le: new Date().toISOString() })
          .in("id", ids);
        envoyes += data?.data?.length ?? lot.length;
      } catch (e) {
        const ids = lot.map((p: any) => p.id);
        await admin.from("prospects_clients")
          .update({ statut: "erreur", erreur: (e as Error).message })
          .in("id", ids);
        erreurs += lot.length;
      }
    }
    return NextResponse.json({ ok: true, envoyes, erreurs });
  }

  // ---------- ENVOI DE TEST À UNE ADRESSE ----------
  if (body.action === "test") {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY non configurée" }, { status: 500 });
    }
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "adresse email invalide" }, { status: 400 });
    }
    const { data: premier } = await admin
      .from("prospects_clients").select("nom, departement")
      .eq("statut", "a_contacter").limit(1).maybeSingle();
    const echantillon = {
      email,
      nom: premier?.nom ?? "Association Exemple",
      departement: premier?.departement ?? "76",
    };
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.CAMPAGNE_FROM ?? process.env.RESEND_FROM ?? "Jeremy de DealBus <contact@dealbus.fr>";
    const { error } = await resend.emails.send({
      from,
      to: email,
      replyTo: "contact@dealbus.fr",
      subject: `[TEST] ${sujetProspectionClient(echantillon)}`,
      text: texteProspectionClient(echantillon),
      html: htmlProspectionClient(echantillon),
      headers: { "List-Unsubscribe": "<mailto:contact@dealbus.fr?subject=STOP>" },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, envoye_a: email });
  }

  // ---------- RELANCE INDIVIDUELLE ----------
  if (body.action === "relance") {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY non configurée" }, { status: 500 });
    }
    const email = String(body.email ?? "").trim().toLowerCase();
    const { data: p } = await admin
      .from("prospects_clients").select("id, email, nom, departement, statut, nb_relances")
      .eq("email", email).maybeSingle();
    if (!p) return NextResponse.json({ error: "prospect introuvable" }, { status: 404 });
    if (p.statut !== "envoye") {
      return NextResponse.json({ error: `relance impossible (statut : ${p.statut})` }, { status: 400 });
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.CAMPAGNE_FROM ?? process.env.RESEND_FROM ?? "Jeremy de DealBus <contact@dealbus.fr>";
    const { error } = await resend.emails.send({
      from,
      to: p.email,
      replyTo: "contact@dealbus.fr",
      subject: sujetRelanceClient(p),
      text: texteRelanceClient(p),
      html: htmlRelanceClient(p),
      headers: { "List-Unsubscribe": "<mailto:contact@dealbus.fr?subject=STOP>" },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("prospects_clients")
      .update({ relance_le: new Date().toISOString(), nb_relances: (p.nb_relances ?? 0) + 1 })
      .eq("id", p.id);
    return NextResponse.json({ ok: true, relances: (p.nb_relances ?? 0) + 1 });
  }

  // ---------- MARQUER STOP / RÉARMER ----------
  if (body.action === "stop") {
    const { email, retour } = body as { email?: string; retour?: boolean };
    if (!email) return NextResponse.json({ error: "email requis" }, { status: 400 });
    await admin.from("prospects_clients")
      .update({ statut: retour ? "a_contacter" : "stop" })
      .eq("email", email.trim().toLowerCase());
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
