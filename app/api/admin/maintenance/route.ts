import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Maintenance } from "@/lib/maintenance";

// Bascule du mode « site en travaux » (admin uniquement).
// Body : { actif: boolean, message?: string, retour?: string (ISO ou datetime-local) }
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Accès réservé" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Partial<Maintenance>;
  if (typeof body.actif !== "boolean") return NextResponse.json({ error: "actif (booléen) requis" }, { status: 400 });

  let retour = "";
  if (body.retour) {
    const d = new Date(body.retour);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Date de retour invalide" }, { status: 400 });
    retour = d.toISOString();
  }

  const valeur: Maintenance = {
    actif: body.actif,
    message: (body.message ?? "").toString().trim().slice(0, 600),
    retour,
  };

  const admin = createAdminClient();
  const { error } = await admin.from("parametres_site")
    .upsert({ cle: "maintenance", valeur, maj_le: new Date().toISOString(), maj_par: user.id }, { onConflict: "cle" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, maintenance: valeur });
}
