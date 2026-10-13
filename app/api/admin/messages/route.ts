import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Modération de la messagerie : suppression d'un message (admin uniquement).
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Accès réservé" }, { status: 403 });

  const { id, action } = (await req.json().catch(() => ({}))) as { id?: string; action?: string };
  if (!id || action !== "supprimer") return NextResponse.json({ error: "Requête invalide" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("messages")
    .update({ contenu: "[Message supprimé par DealBus]" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
