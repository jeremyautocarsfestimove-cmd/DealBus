import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ID_TEST, TABLE, verifierLien } from "@/lib/desinscription";

// Désinscription des campagnes. Appelée par la page /desinscription (bouton
// de confirmation) et directement par les messageries (bouton « Se désabonner »,
// en-tête List-Unsubscribe-Post). Seul un POST désinscrit : un simple
// chargement du lien par un antivirus ne retire personne.
export async function POST(req: Request) {
  const u = new URL(req.url);
  const lien = verifierLien(u.searchParams.get("l"), u.searchParams.get("i"), u.searchParams.get("k"));
  if (!lien) return NextResponse.json({ error: "lien invalide" }, { status: 400 });
  if (lien.id === ID_TEST) return NextResponse.json({ ok: true, test: true });

  const admin = createAdminClient();
  const { error } = await admin.from(TABLE[lien.liste]).update({ statut: "stop" }).eq("id", lien.id);
  if (error) return NextResponse.json({ error: "désinscription impossible pour le moment" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  return NextResponse.redirect(new URL(`/desinscription${u.search}`, u.origin));
}
