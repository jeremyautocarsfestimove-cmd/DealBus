import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ORGANISMES } from "@/lib/assistant-demande";

export const revalidate = 1800;

/* eslint-disable @typescript-eslint/no-explicit-any */

// Avis publics (accueil) : derniers avis laissés par des clients après une
// mission réalisée. Anonymisés : prénom + initiale, type d'organisme, trajet.
// Aucun avis inventé : s'il n'y en a pas encore en base, la liste est vide.
export async function GET() {
  const admin = createAdminClient();
  const [{ data: avis }, { data: stats }] = await Promise.all([
    admin.from("avis")
      .select("id, note, commentaire, created_at, client:profiles(nom), mission:missions(demande:demandes(depart_adresse, arrivee_adresse, organisme, passagers))")
      .not("commentaire", "is", null)
      .order("created_at", { ascending: false })
      .limit(6),
    admin.from("avis").select("note"),
  ]);

  const liste = (avis ?? []).map((a: any) => {
    const client = Array.isArray(a.client) ? a.client[0] : a.client;
    const mission = Array.isArray(a.mission) ? a.mission[0] : a.mission;
    const d = mission ? (Array.isArray(mission.demande) ? mission.demande[0] : mission.demande) : null;
    const nom = String(client?.nom ?? "").trim().split(/\s+/);
    const auteur = nom.length ? `${nom[0]}${nom[1] ? ` ${nom[1][0]}.` : ""}` : "Client";
    const ville = (s?: string) => (s ?? "").split(",")[0].trim();
    return {
      id: a.id,
      note: a.note,
      commentaire: a.commentaire,
      date: a.created_at,
      auteur,
      organisme: ORGANISMES.find((o) => o.id === d?.organisme)?.label.replace(/^Un(e)? /, "") ?? "",
      trajet: d ? `${ville(d.depart_adresse)} → ${ville(d.arrivee_adresse)}` : "",
      passagers: d?.passagers ?? null,
    };
  });

  const notes = (stats ?? []).map((s: any) => Number(s.note));
  const moyenne = notes.length ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10 : null;

  return NextResponse.json({ avis: liste, total: notes.length, moyenne });
}
