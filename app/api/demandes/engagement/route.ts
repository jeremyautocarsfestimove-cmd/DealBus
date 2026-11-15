import { NextResponse } from "next/server";
import { createHash, randomInt } from "node:crypto";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHtml } from "@/lib/email";
import { ENGAGEMENT_TEXTE, ENGAGEMENT_VERSION, CODE_MINUTES, CODE_ESSAIS_MAX } from "@/lib/engagement";

// Code de validation à l'envoi d'une demande.
//  - envoyer   : génère un code à 6 chiffres et l'envoie à l'e-mail du compte
//  - valider   : vérifie le code et enregistre la preuve (date, IP, navigateur, texte accepté)
//  - rattacher : relie la preuve à la demande qui vient d'être créée

const hash = (userId: string, code: string) => createHash("sha256").update(`${userId}:${code}`).digest("hex");
const masquer = (email: string) => email.replace(/^(.{2}).*(@.*)$/, "$1•••$2");

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { action?: "envoyer" | "valider" | "rattacher"; code?: string; demande_id?: string };
  const admin = createAdminClient();

  // ---------- Envoi du code ----------
  if (body.action === "envoyer") {
    const { data: recents } = await admin.from("demande_engagements").select("created_at")
      .eq("user_id", user.id).gte("created_at", new Date(Date.now() - 3600 * 1000).toISOString())
      .order("created_at", { ascending: false });
    if (recents?.[0] && Date.now() - new Date(recents[0].created_at).getTime() < 45 * 1000) {
      return NextResponse.json({ error: "Un code vient d'être envoyé. Patientez quelques secondes avant d'en demander un autre." }, { status: 429 });
    }
    if ((recents?.length ?? 0) >= 6) {
      return NextResponse.json({ error: "Trop de codes demandés. Réessayez dans une heure." }, { status: 429 });
    }
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Envoi d'e-mail indisponible" }, { status: 500 });

    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    const { error: errInsert } = await admin.from("demande_engagements").insert({
      user_id: user.id, email: user.email, code_hash: hash(user.id, code),
      expire_le: new Date(Date.now() + CODE_MINUTES * 60 * 1000).toISOString(),
      texte: ENGAGEMENT_TEXTE, texte_version: ENGAGEMENT_VERSION,
    });
    if (errInsert) return NextResponse.json({ error: "Impossible de préparer le code" }, { status: 500 });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: errMail } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
      to: user.email,
      subject: `${code} : votre code pour envoyer votre demande DealBus`,
      html: emailHtml({
        titre: "Votre code de validation",
        paragraphes: ["Saisissez ce code sur DealBus pour envoyer votre demande de devis aux autocaristes."],
        highlight: { label: "Code de validation", value: code, detail: `Valable ${CODE_MINUTES} minutes` },
        note: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : rien ne sera envoyé.",
      }),
    });
    if (errMail) return NextResponse.json({ error: "L'e-mail n'a pas pu être envoyé" }, { status: 502 });
    return NextResponse.json({ ok: true, email: masquer(user.email), minutes: CODE_MINUTES });
  }

  // ---------- Vérification du code ----------
  if (body.action === "valider") {
    const code = String(body.code ?? "").replace(/\D/g, "");
    if (code.length !== 6) return NextResponse.json({ error: "Le code comporte 6 chiffres." }, { status: 400 });

    const { data: e } = await admin.from("demande_engagements").select("id, code_hash, essais, expire_le")
      .eq("user_id", user.id).is("valide_le", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!e || new Date(e.expire_le).getTime() < Date.now()) {
      return NextResponse.json({ error: "Ce code a expiré. Demandez-en un nouveau." }, { status: 410 });
    }
    if (e.essais >= CODE_ESSAIS_MAX) {
      return NextResponse.json({ error: "Trop d'essais. Demandez un nouveau code." }, { status: 429 });
    }
    if (e.code_hash !== hash(user.id, code)) {
      await admin.from("demande_engagements").update({ essais: e.essais + 1 }).eq("id", e.id);
      const reste = CODE_ESSAIS_MAX - e.essais - 1;
      return NextResponse.json({ error: reste > 0 ? `Code incorrect. Il vous reste ${reste} essai${reste > 1 ? "s" : ""}.` : "Code incorrect. Demandez un nouveau code." }, { status: 400 });
    }
    await admin.from("demande_engagements").update({
      valide_le: new Date().toISOString(),
      ip: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
      user_agent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
    }).eq("id", e.id);
    return NextResponse.json({ ok: true });
  }

  // ---------- Rattachement à la demande créée ----------
  if (body.action === "rattacher") {
    if (!body.demande_id) return NextResponse.json({ error: "demande_id requis" }, { status: 400 });
    const { data: d } = await admin.from("demandes").select("id, client_id").eq("id", body.demande_id).maybeSingle();
    if (!d || d.client_id !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const { data: e } = await admin.from("demande_engagements").select("id")
      .eq("user_id", user.id).is("demande_id", null).not("valide_le", "is", null)
      .gte("valide_le", new Date(Date.now() - 3600 * 1000).toISOString())
      .order("valide_le", { ascending: false }).limit(1).maybeSingle();
    if (!e) return NextResponse.json({ error: "Aucune validation récente" }, { status: 409 });
    await admin.from("demande_engagements").update({ demande_id: d.id }).eq("id", e.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
