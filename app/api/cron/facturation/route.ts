import { NextResponse } from "next/server";
import { emettreFacturesDues } from "@/lib/facturation";
import { qontoConfigure } from "@/lib/qonto";

export const maxDuration = 60;

// 🧾 Chaque matin (vercel.json) : émet la facture de commission de chaque mission
// dont le transport s'est terminé la veille (ou avant, si une émission a échoué).
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!qontoConfigure()) return NextResponse.json({ ok: true, note: "Qonto non configuré" });
  const r = await emettreFacturesDues();
  return NextResponse.json({ succes: true, emises: r.ok, erreurs: r.erreurs });
}
