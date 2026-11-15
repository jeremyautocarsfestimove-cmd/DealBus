import { NextResponse } from "next/server";
import { CAMPAGNE_FROM } from "@/lib/expediteur";
import { envoyerVague } from "@/lib/campagnes";
import { enTetesDesinscription, lienDesinscription, ID_TEST } from "@/lib/desinscription";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sujetProspection, texteProspection, htmlProspection, sujetRelance, texteRelance, htmlRelance } from "@/lib/prospection";

export const maxDuration = 60;

// Chaque e-mail porte son lien de désinscription (factice pour les tests et l'aperçu).
/* eslint-disable @typescript-eslint/no-explicit-any */
const perso = (p: any) => ({ ...p, lien: lienDesinscription("transporteurs", p.id ?? ID_TEST) });
const entetes = (p: any) => enTetesDesinscription("transporteurs", p.id ?? ID_TEST);
/* eslint-enable @typescript-eslint/no-explicit-any */


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
  const enRelance = url.searchParams.get("preview") === "relance";
  // Données du premier prospect à contacter (sinon un exemple)
  const admin = createAdminClient();
  const { data: premier } = await admin
    .from("prospects").select("email, societe, departement")
    .eq("statut", enRelance ? "envoye" : "a_contacter").limit(1).maybeSingle();
  const echantillon = premier ?? { email: "contact@exemple.fr", societe: "Autocars Exemple", departement: "76" };
  const sujet = enRelance ? sujetRelance(perso(echantillon)) : sujetProspection(perso(echantillon));
  const bandeau = `<div style="background:#12151B;color:#F5F2EA;font-family:Consolas,monospace;font-size:12px;padding:12px 20px;">
    APERÇU${enRelance ? " (RELANCE)" : ""} — Objet : <strong style="color:#E8A63D;">${sujet}</strong>
    &nbsp;·&nbsp; Expéditeur : ${CAMPAGNE_FROM}
    &nbsp;·&nbsp; Exemple : ${echantillon.email}${echantillon.departement ? ` (dépt ${echantillon.departement})` : ""}
  </div>`;
  return new Response(bandeau + (enRelance ? htmlRelance(perso(echantillon)) : htmlProspection(perso(echantillon))), {
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
    const contacts = (body.contacts ?? []) as { email?: string; societe?: string; departement?: string }[];
    const propres = contacts
      .map((c) => ({
        email: (c.email ?? "").trim().toLowerCase(),
        societe: (c.societe ?? "").trim() || null,
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
        .from("prospects")
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
    const r = await envoyerVague(admin, "transporteurs", limite);
    return NextResponse.json({ ok: true, ...r });
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
    // Échantillon réaliste : le prochain prospect de la file (sinon un exemple)
    const { data: premier } = await admin
      .from("prospects").select("societe, departement")
      .eq("statut", "a_contacter").limit(1).maybeSingle();
    const echantillon = {
      email,
      societe: premier?.societe ?? "Autocars Exemple",
      departement: premier?.departement ?? "76",
    };
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = CAMPAGNE_FROM;
    const { error } = await resend.emails.send({
      from,
      to: email,
      replyTo: "contact@dealbus.fr",
      subject: `[TEST] ${sujetProspection(perso(echantillon))}`,
      text: texteProspection(perso(echantillon)),
      html: htmlProspection(perso(echantillon)),
      headers: entetes(echantillon),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, envoye_a: email });
  }

  // ---------- RELANCE EN MASSE ----------
  // Relance les prospects contactés il y a plus de 7 jours, jamais relancés
  // (ou relancés il y a plus de 14 jours), 2 relances maximum par prospect.
  if (body.action === "relance_masse") {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY non configurée" }, { status: 500 });
    }
    const limite = Math.min(Math.max(Number(body.limite) || 40, 1), 1000);
    const il_y_a_7j = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const il_y_a_14j = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

    const { data: cibles } = await admin
      .from("prospects")
      .select("id, email, societe, departement, nb_relances")
      .eq("statut", "envoye")
      .lt("envoye_le", il_y_a_7j)
      .lt("nb_relances", 2)
      .or(`relance_le.is.null,relance_le.lt.${il_y_a_14j}`)
      .order("envoye_le", { ascending: true })
      .limit(limite);

    if (!cibles?.length) {
      return NextResponse.json({ ok: true, envoyes: 0, note: "aucun prospect éligible (contactés il y a moins de 7 jours, déjà relancés 2 fois, ou relancés il y a moins de 14 jours)" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = CAMPAGNE_FROM;
    let envoyes = 0, erreurs = 0;

    for (let i = 0; i < cibles.length; i += 50) {
      const lot = cibles.slice(i, i + 50);
      try {
        const { error } = await resend.batch.send(
          lot.map((p: any) => ({
            from,
            to: p.email,
            replyTo: "contact@dealbus.fr",
            subject: sujetRelance(perso(p)),
            text: texteRelance(perso(p)),
            html: htmlRelance(perso(p)),
            headers: entetes(p),
          }))
        );
        if (error) throw new Error(error.message);
        const maintenant = new Date().toISOString();
        await Promise.all(lot.map((p: any) =>
          admin.from("prospects")
            .update({ relance_le: maintenant, nb_relances: (p.nb_relances ?? 0) + 1 })
            .eq("id", p.id)
        ));
        envoyes += lot.length;
      } catch (e) {
        erreurs += lot.length;
        void e;
      }
    }
    return NextResponse.json({ ok: true, envoyes, erreurs });
  }

  // ---------- ENVOI DE TEST DE LA RELANCE À UNE ADRESSE ----------
  if (body.action === "test_relance") {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY non configurée" }, { status: 500 });
    }
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "adresse email invalide" }, { status: 400 });
    }
    const { data: premier } = await admin
      .from("prospects").select("societe, departement")
      .eq("statut", "envoye").limit(1).maybeSingle();
    const echantillon = {
      email,
      societe: premier?.societe ?? "Autocars Exemple",
      departement: premier?.departement ?? "76",
    };
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = CAMPAGNE_FROM;
    const { error } = await resend.emails.send({
      from,
      to: email,
      replyTo: "contact@dealbus.fr",
      subject: `[TEST] ${sujetRelance(perso(echantillon))}`,
      text: texteRelance(perso(echantillon)),
      html: htmlRelance(perso(echantillon)),
      headers: entetes(echantillon),
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
      .from("prospects").select("id, email, societe, departement, statut, nb_relances")
      .eq("email", email).maybeSingle();
    if (!p) return NextResponse.json({ error: "prospect introuvable" }, { status: 404 });
    if (p.statut !== "envoye") {
      return NextResponse.json({ error: `relance impossible (statut : ${p.statut})` }, { status: 400 });
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = CAMPAGNE_FROM;
    const { error } = await resend.emails.send({
      from,
      to: p.email,
      replyTo: "contact@dealbus.fr",
      subject: sujetRelance(perso(p)),
      text: texteRelance(perso(p)),
      html: htmlRelance(perso(p)),
      headers: entetes(p),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("prospects")
      .update({ relance_le: new Date().toISOString(), nb_relances: (p.nb_relances ?? 0) + 1 })
      .eq("id", p.id);
    return NextResponse.json({ ok: true, relances: (p.nb_relances ?? 0) + 1 });
  }

  // ---------- MARQUER STOP / RÉARMER ----------
  if (body.action === "stop") {
    const { email, retour } = body as { email?: string; retour?: boolean };
    if (!email) return NextResponse.json({ error: "email requis" }, { status: 400 });
    await admin.from("prospects")
      .update({ statut: retour ? "a_contacter" : "stop" })
      .eq("email", email.trim().toLowerCase());
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
