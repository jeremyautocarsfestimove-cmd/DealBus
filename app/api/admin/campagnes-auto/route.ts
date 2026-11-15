import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TABLE, type Liste } from "@/lib/desinscription";

// Réglage de l'envoi automatique (lundi au vendredi) pour une liste de prospection.

async function verifierAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return me?.role === "admin" ? user : null;
}

const estListe = (v: unknown): v is Liste => v === "clients" || v === "transporteurs";

export async function GET(req: Request) {
  if (!(await verifierAdmin())) return NextResponse.json({ error: "réservé à l'administration" }, { status: 403 });
  const liste = new URL(req.url).searchParams.get("liste");
  if (!estListe(liste)) return NextResponse.json({ error: "liste inconnue" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("campagnes_auto").select("actif, par_jour, dernier_envoi, dernier_resultat")
    .eq("liste", liste).maybeSingle();
  if (error) return NextResponse.json({ ok: true, installe: false });

  const { count } = await admin.from(TABLE[liste]).select("*", { count: "exact", head: true }).eq("statut", "a_contacter");
  return NextResponse.json({
    ok: true, installe: true,
    actif: data?.actif ?? false,
    par_jour: data?.par_jour ?? 30,
    dernier_envoi: data?.dernier_envoi ?? null,
    dernier_resultat: data?.dernier_resultat ?? null,
    restants: count ?? 0,
  });
}

export async function POST(req: Request) {
  if (!(await verifierAdmin())) return NextResponse.json({ error: "réservé à l'administration" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!estListe(body.liste)) return NextResponse.json({ error: "liste inconnue" }, { status: 400 });
  const par_jour = Math.min(Math.max(Math.round(Number(body.par_jour)) || 30, 1), 200);

  const admin = createAdminClient();
  const { error } = await admin.from("campagnes_auto").upsert(
    { liste: body.liste, actif: body.actif === true, par_jour, updated_at: new Date().toISOString() },
    { onConflict: "liste" },
  );
  if (error) return NextResponse.json({ error: "réglage impossible : la migration 0031 est-elle appliquée ?" }, { status: 500 });
  return NextResponse.json({ ok: true, actif: body.actif === true, par_jour });
}
