import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyerVague } from "@/lib/campagnes";
import type { Liste } from "@/lib/desinscription";

export const maxDuration = 60;

// Envoi automatique des campagnes, du lundi au vendredi (voir vercel.json).
// Pour chaque liste activée dans l'admin, envoie le nombre d'e-mails réglé
// aux prochains prospects « à contacter ». Une seule vague par jour et par liste.

const jourParis = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }

  const maintenant = new Date();
  const jour = maintenant.toLocaleDateString("en-US", { weekday: "short", timeZone: "Europe/Paris" });
  if (jour === "Sat" || jour === "Sun") return NextResponse.json({ ok: true, note: "week-end, aucun envoi" });

  const admin = createAdminClient();
  const { data: reglages, error } = await admin
    .from("campagnes_auto").select("liste, actif, par_jour, dernier_envoi").eq("actif", true);
  if (error) return NextResponse.json({ ok: true, note: "table campagnes_auto absente (migration 0031)" });

  const bilan: Record<string, unknown> = {};
  for (const r of reglages ?? []) {
    if (r.dernier_envoi && jourParis(new Date(r.dernier_envoi)) === jourParis(maintenant)) {
      bilan[r.liste] = "déjà envoyé aujourd'hui";
      continue;
    }
    const limite = Math.min(Math.max(Number(r.par_jour) || 30, 1), 200);
    const res = await envoyerVague(admin, r.liste as Liste, limite);
    const resume = res.note ?? `${res.envoyes} envoyé${res.envoyes > 1 ? "s" : ""}${res.erreurs ? `, ${res.erreurs} en erreur` : ""}`;
    await admin.from("campagnes_auto")
      .update({ dernier_envoi: maintenant.toISOString(), dernier_resultat: resume, updated_at: maintenant.toISOString() })
      .eq("liste", r.liste);
    bilan[r.liste] = resume;
  }
  return NextResponse.json({ ok: true, bilan });
}
