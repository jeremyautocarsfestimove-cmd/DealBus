import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CGU_VERSION } from "@/lib/cgu";

// POST { contexte: "inscription" | "reconsentement" }
// Enregistre l'acceptation de la version courante des CGU par l'utilisateur connecté,
// avec IP et navigateur (preuve), et met à jour la fiche transporteur.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { contexte } = (await req.json().catch(() => ({}))) as { contexte?: string };
  const ctx = contexte === "inscription" ? "inscription" : "reconsentement";
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || null;
  const ua = req.headers.get("user-agent")?.slice(0, 300) ?? null;

  const admin = createAdminClient();
  const { error } = await admin.from("cgu_acceptations").insert({ user_id: user.id, version: CGU_VERSION, contexte: ctx, ip, user_agent: ua });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("transporteurs").update({ cgu_version: CGU_VERSION, cgu_acceptees_le: new Date().toISOString() }).eq("id", user.id);
  return NextResponse.json({ ok: true, version: CGU_VERSION });
}
