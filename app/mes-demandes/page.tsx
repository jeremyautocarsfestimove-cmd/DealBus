import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import type { Demande } from "@/lib/types";
import { ListeDemandes, type MissionResume, type OffresResume } from "./Liste";

export const metadata = { title: "Mes demandes" };

export default async function MesDemandesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: demandes } = await supabase
    .from("demandes")
    .select("*")
    .eq("client_id", user!.id)
    .order("created_at", { ascending: false });
  const D = (demandes ?? []) as Demande[];

  const [{ data: missions }, { data: nonLus }, { data: offres }] = await Promise.all([
    supabase.from("missions")
      .select("demande_id, statut, annulation_motif, annulation_demandee_at, annulation_decision")
      .eq("client_id", user!.id),
    // Messages non lus (écrits par les transporteurs) par demande
    supabase.from("messages").select("demande_id").neq("auteur_id", user!.id).is("lu_le", null),
    D.length
      ? supabase.from("offres").select("demande_id, prix_ttc, statut").in("demande_id", D.map((d) => d.id))
      : Promise.resolve({ data: [] as { demande_id: string; prix_ttc: number; statut: string }[] }),
  ]);

  const nonLusParDemande: Record<string, number> = {};
  for (const m of nonLus ?? []) nonLusParDemande[m.demande_id] = (nonLusParDemande[m.demande_id] ?? 0) + 1;

  // Nombre d'offres encore valables et prix le plus bas, par demande
  const offresParDemande: Record<string, OffresResume> = {};
  for (const o of offres ?? []) {
    if (o.statut === "non_retenue") continue;
    const r = (offresParDemande[o.demande_id] ??= { nb: 0, min: null });
    r.nb += 1;
    const prix = Number(o.prix_ttc);
    if (prix > 0 && (r.min === null || prix < r.min)) r.min = prix;
  }

  return (
    <>
      <Nav />
      <ListeDemandes demandes={D} missions={(missions ?? []) as MissionResume[]} offres={offresParDemande} nonLus={nonLusParDemande} />
    </>
  );
}
