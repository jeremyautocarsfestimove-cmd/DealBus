import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exigerAdmin } from "@/lib/admin-crm";
import { missionsAFacturer, emettreFacture, emettreFacturesDues } from "@/lib/facturation";
import { qontoConfigure, envoyerFacture, lireFacture, marquerPayee } from "@/lib/qonto";

export const maxDuration = 60;

// POST { action: "emettre", mission_id? }  → émet la facture d'une mission (ou toutes les factures dues)
// POST { action: "synchroniser" }          → récupère les paiements depuis Qonto
// POST { action: "payee", facture_id }     → marque payée (et dans Qonto)
// POST { action: "renvoyer", facture_id }  → renvoie la facture par email (relance)
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(req: Request) {
  if (!(await exigerAdmin())) return NextResponse.json({ error: "Accès réservé" }, { status: 403 });
  if (!qontoConfigure()) return NextResponse.json({ error: "Qonto n'est pas configuré : ajoutez QONTO_LOGIN, QONTO_SECRET_KEY et QONTO_IBAN dans Vercel." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { action?: string; mission_id?: string; facture_id?: string };
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  try {
    if (body.action === "emettre") {
      if (!body.mission_id) return NextResponse.json(await emettreFacturesDues());
      const m = (await missionsAFacturer()).find((x) => x.id === body.mission_id);
      if (!m) return NextResponse.json({ error: "Mission non facturable (déjà facturée, transport non terminé, annulée ou en litige)" }, { status: 400 });
      const r = await emettreFacture(m);
      return NextResponse.json({ ok: 1, erreurs: [], numero: r.numero });
    }

    if (body.action === "synchroniser") {
      const { data } = await admin.from("factures").select("id, mission_id, qonto_invoice_id, numero").eq("statut", "emise").not("qonto_invoice_id", "is", null);
      let payees = 0;
      for (const f of (data ?? []) as any[]) {
        const q = await lireFacture(f.qonto_invoice_id);
        const maj: Record<string, unknown> = {};
        if (q.number && q.number !== f.numero) maj.numero = q.number;
        if (q.status === "paid") { maj.statut = "payee"; maj.payee_le = q.paid_at ?? new Date().toISOString(); payees++; }
        if (q.status === "canceled") maj.statut = "annulee";
        if (Object.keys(maj).length) await admin.from("factures").update(maj).eq("id", f.id);
        if (maj.statut === "payee") await admin.from("missions").update({ facturation: "payee" }).eq("id", f.mission_id);
      }
      return NextResponse.json({ ok: true, verifiees: data?.length ?? 0, payees });
    }

    if (body.action === "payee" || body.action === "renvoyer") {
      const { data: f } = await admin.from("factures")
        .select("*, transporteur:transporteurs(raison_sociale, profile:profiles(email))").eq("id", body.facture_id).single();
      const fa = f as any;
      if (!fa) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

      if (body.action === "payee") {
        if (fa.qonto_invoice_id) await marquerPayee(fa.qonto_invoice_id, today);
        await admin.from("factures").update({ statut: "payee", payee_le: new Date().toISOString() }).eq("id", fa.id);
        await admin.from("missions").update({ facturation: "payee" }).eq("id", fa.mission_id);
        return NextResponse.json({ ok: true });
      }

      const email = fa.transporteur?.profile?.email;
      if (!email || !fa.qonto_invoice_id) return NextResponse.json({ error: "Email ou facture Qonto manquant" }, { status: 400 });
      const dateFr = new Date(fa.date_transport).toLocaleDateString("fr-FR");
      await envoyerFacture(fa.qonto_invoice_id, email, `Rappel : facture de commission DealBus ${fa.numero ?? ""}`,
        `Bonjour,\n\nSauf erreur de notre part, la facture de commission DealBus ${fa.numero ?? ""} (transport du ${dateFr}, ${Number(fa.montant_ttc).toLocaleString("fr-FR")} € TTC) reste à régler. Elle était payable à réception.\n\nSi le règlement est en cours, merci de ne pas tenir compte de ce message.\n\nL'équipe DealBus\ncontact@dealbus.fr`);
      await admin.from("factures").update({ nb_relances: (fa.nb_relances ?? 0) + 1, relancee_le: new Date().toISOString() }).eq("id", fa.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
