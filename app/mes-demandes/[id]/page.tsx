import Link from "next/link";
import { Nav } from "@/components/Nav";
import { StatusChip } from "@/components/StatusChip";
import { createClient } from "@/lib/supabase/server";
import type { Demande } from "@/lib/types";

export default async function MesDemandesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: demandes } = await supabase
    .from("demandes")
    .select("*")
    .eq("client_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: missions } = await supabase
    .from("missions")
    .select("demande_id, statut, annulation_motif")
    .eq("client_id", user!.id);

  const missionParDemande = new Map(
    (missions ?? [])
      .filter((m) => m.demande_id)
      .map((m) => [m.demande_id as string, m])
  );

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">Espace client</p>
        <h1 className="h-display text-4xl mb-10">Vos demandes.</h1>

        <div className="space-y-3.5">
          {(demandes as Demande[] | null)?.map((d) => {
            const mission = missionParDemande.get(d.id);

            const annulationSignalee =
              !!mission?.annulation_motif &&
              (mission.statut === "annulee" || mission.statut === "litige");

            const annulationConfirmee = mission?.statut === "annulee";

            const enchereTerminee =
              d.mode === "enchere" &&
              d.statut === "ouverte" &&
              !!d.enchere_fin &&
              new Date(d.enchere_fin).getTime() <= Date.now();

            return (
              <Link
                key={d.id}
                href={`/mes-demandes/${d.id}`}
                className={`card group block transition ${
                  annulationSignalee
                    ? "border-[#E8735D]/35 hover:border-[#E8735D]/60"
                    : "hover:border-ligne-strong"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                  <span className="flex items-center gap-3 font-condensed font-semibold text-xl uppercase">
                    <span className={d.mode === "enchere" ? "tag-enchere" : "tag-devis"}>
                      {d.mode === "enchere" ? "Enchère" : "Devis"}
                    </span>
                    {d.depart_adresse}
                    <span className="text-blanc-faint font-sans normal-case font-normal">→</span>
                    {d.arrivee_adresse}
                  </span>

                  {annulationSignalee ? (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-[#E8735D]/40 bg-[#E8735D]/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E8735D]">
                      <span className="inline-flex h-2 w-2 rounded-full bg-[#E8735D]" />
                      {annulationConfirmee ? "Mission annulée" : "Annulation signalée"}
                    </span>
                  ) : d.statut === "ouverte" && d.mode === "enchere" ? (
                    enchereTerminee ? (
                      <span className="inline-flex items-center justify-center rounded-lg border border-ambre/45 bg-ambre/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ambre transition group-hover:bg-ambre group-hover:text-asphalte">
                        Voir l&apos;enchère
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-lg border border-vert/30 bg-vert/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-vert">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vert opacity-60" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-vert" />
                        </span>
                        En direct
                      </span>
                    )
                  ) : (
                    <StatusChip kind={d.statut === "confirmee" ? "confirmee" : "ouverte"}>
                      {d.statut === "ouverte"
                        ? "En attente d'offres"
                        : d.statut === "confirmee"
                          ? "Transporteur sélectionné"
                          : d.statut}
                    </StatusChip>
                  )}
                </div>

                <p className="font-mono text-xs text-blanc-faint">
                  {new Date(d.date_aller).toLocaleDateString("fr-FR")}{d.heure_aller ? ` à ${String(d.heure_aller).slice(0, 5).replace(":", "h")}` : ""} · {d.passagers} passagers · Demande #{d.numero}
                </p>

                {annulationSignalee && (
                  <div className="mt-3 border-t border-[#E8735D]/20 pt-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#E8735D]">
                      {annulationConfirmee
                        ? "Annulation confirmée"
                        : "En attente de traitement DealBus"}
                    </p>
                    <p className="mt-1 text-xs text-blanc-dim">
                      Motif : {mission?.annulation_motif}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}

          {!demandes?.length && (
            <div className="card text-center py-12">
              <p className="text-blanc-dim mb-5">Aucune demande pour le moment.</p>
              <Link href="/demande" className="btn-primary">
                Faire ma première demande →
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}