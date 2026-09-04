import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RESEAUX_DEF } from "@/lib/reseaux";

const CLES = new Set<string>(RESEAUX_DEF.map((r) => r.cle));

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const rows: { cle: string; valeur: string | null; updated_at: string }[] = [];

  for (const [cle, brut] of Object.entries(body)) {
    if (!CLES.has(cle)) continue;
    const valeur = typeof brut === "string" ? brut.trim() : "";
    if (valeur && !/^https?:\/\/\S+$/i.test(valeur)) {
      return NextResponse.json({ error: `URL invalide pour ${cle.replace("reseau_", "")}` }, { status: 400 });
    }
    rows.push({ cle, valeur: valeur || null, updated_at: new Date().toISOString() });
  }

  if (!rows.length) return NextResponse.json({ error: "Aucune donnée" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("parametres").upsert(rows, { onConflict: "cle" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
