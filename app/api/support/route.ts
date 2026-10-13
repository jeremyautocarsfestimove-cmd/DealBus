import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHtml } from "@/lib/email";

export const maxDuration = 30;

/* eslint-disable @typescript-eslint/no-explicit-any */

// Support utilisateur ↔ DealBus.
//  - envoyer  (user)  : écrit dans sa conversation ouverte (créée au besoin) → email aux admins
//  - repondre (admin) : répond dans une conversation → email à l'utilisateur
//  - nouvelle (admin) : ouvre une conversation vers un utilisateur (client ou transporteur) → email
//  - lu               : marque lus les messages de l'autre partie
//  - clore / rouvrir  (admin)

type Corps = {
  action: "envoyer" | "repondre" | "nouvelle" | "lu" | "clore" | "rouvrir";
  conversation_id?: string;
  user_id?: string;
  demande_id?: string | null;
  sujet?: string;
  contenu?: string;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous pour écrire à DealBus" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Corps;
  const admin = createAdminClient();
  const { data: profil } = await admin.from("profiles").select("role, nom, email").eq("id", user.id).maybeSingle();
  const estAdmin = profil?.role === "admin";
  const maintenant = new Date().toISOString();
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const contenu = String(body.contenu ?? "").trim();

  // ---------- Marquer lu ----------
  if (body.action === "lu") {
    if (!body.conversation_id) return NextResponse.json({ error: "conversation_id requis" }, { status: 400 });
    const { data: conv } = await admin.from("support_conversations").select("user_id").eq("id", body.conversation_id).maybeSingle();
    if (!conv || (!estAdmin && conv.user_id !== user.id)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    await admin.from("support_messages").update({ lu_le: maintenant })
      .eq("conversation_id", body.conversation_id).eq("auteur", estAdmin ? "user" : "admin").is("lu_le", null);
    return NextResponse.json({ ok: true });
  }

  // ---------- Clore / rouvrir (admin) ----------
  if (body.action === "clore" || body.action === "rouvrir") {
    if (!estAdmin) return NextResponse.json({ error: "Accès réservé" }, { status: 403 });
    await admin.from("support_conversations")
      .update({ statut: body.action === "clore" ? "close" : "ouverte", updated_at: maintenant })
      .eq("id", body.conversation_id);
    return NextResponse.json({ ok: true });
  }

  if (contenu.length < 2) return NextResponse.json({ error: "Message vide" }, { status: 400 });
  if (contenu.length > 4000) return NextResponse.json({ error: "Message trop long" }, { status: 400 });

  // ---------- Utilisateur → DealBus ----------
  if (body.action === "envoyer") {
    let convId = body.conversation_id ?? null;
    if (convId) {
      const { data: conv } = await admin.from("support_conversations").select("user_id").eq("id", convId).maybeSingle();
      if (!conv || conv.user_id !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    } else {
      // Dernière conversation ouverte de l'utilisateur, sinon création
      const { data: ouverte } = await admin.from("support_conversations").select("id")
        .eq("user_id", user.id).eq("statut", "ouverte").order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (ouverte) convId = ouverte.id;
      else {
        const { data: creee, error } = await admin.from("support_conversations")
          .insert({ user_id: user.id, demande_id: body.demande_id ?? null, sujet: body.sujet ?? contenu.slice(0, 80), ouverte_par: "user" })
          .select("id").single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        convId = creee.id;
      }
    }
    const { data: msg, error } = await admin.from("support_messages")
      .insert({ conversation_id: convId, auteur: "user", contenu }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("support_conversations").update({ updated_at: maintenant, statut: "ouverte" }).eq("id", convId);

    // Email aux admins
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: admins } = await admin.from("profiles").select("email").eq("role", "admin").not("email", "is", null);
        const dest = (admins ?? []).map((a: any) => a.email).filter(Boolean);
        if (dest.length) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const qui = `${profil?.nom ?? user.email ?? "Un utilisateur"} (${profil?.role ?? "client"})`;
          await resend.emails.send({
            from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
            to: dest,
            subject: `🛟 Support : message de ${profil?.nom ?? user.email}`,
            text: `${qui} :\n\n${contenu}\n\nRépondre : ${site}/admin/support?c=${convId}`,
            html: emailHtml({
              titre: "Nouveau message au support",
              paragraphes: [`<strong>${qui}</strong> vous écrit :`, `<em style="color:#5A6170;">« ${contenu.replace(/</g, "&lt;")} »</em>`],
              cta: { label: "Répondre dans l'administration", url: `${site}/admin/support?c=${convId}` },
            }),
          });
        }
      } catch { /* jamais bloquant */ }
    }
    return NextResponse.json({ ok: true, conversation_id: convId, id: msg.id });
  }

  // ---------- DealBus → utilisateur ----------
  if (!estAdmin) return NextResponse.json({ error: "Accès réservé" }, { status: 403 });

  let convId = body.conversation_id ?? null;
  let destinataireId: string | null = null;
  if (body.action === "nouvelle") {
    if (!body.user_id) return NextResponse.json({ error: "user_id requis" }, { status: 400 });
    const { data: creee, error } = await admin.from("support_conversations")
      .insert({ user_id: body.user_id, demande_id: body.demande_id ?? null, sujet: body.sujet ?? contenu.slice(0, 80), ouverte_par: "admin" })
      .select("id, user_id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    convId = creee.id; destinataireId = creee.user_id;
  } else if (body.action === "repondre") {
    const { data: conv } = await admin.from("support_conversations").select("id, user_id").eq("id", convId).maybeSingle();
    if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    destinataireId = conv.user_id;
  } else return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

  const { data: msg, error } = await admin.from("support_messages")
    .insert({ conversation_id: convId, auteur: "admin", contenu }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("support_conversations").update({ updated_at: maintenant, statut: "ouverte" }).eq("id", convId);

  if (process.env.RESEND_API_KEY && destinataireId) {
    try {
      const { data: u } = await admin.auth.admin.getUserById(destinataireId);
      const email = u?.user?.email;
      if (email) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
          to: email,
          subject: "💬 DealBus vous a écrit",
          text: `Message de l'équipe DealBus :\n\n${contenu}\n\nRépondre : ${site}/aide?c=${convId}`,
          html: emailHtml({
            titre: "Un message de l'équipe DealBus",
            paragraphes: [`<em style="color:#5A6170;">« ${contenu.replace(/</g, "&lt;").replace(/\n/g, "<br/>")} »</em>`],
            cta: { label: "Répondre sur DealBus", url: `${site}/aide?c=${convId}` },
            note: "Vous pouvez aussi répondre depuis la bulle « Aide » en bas à droite du site.",
          }),
        });
      }
    } catch { /* jamais bloquant */ }
  }
  return NextResponse.json({ ok: true, conversation_id: convId, id: msg.id });
}
