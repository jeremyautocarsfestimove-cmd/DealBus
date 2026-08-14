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

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">Espace client</p>
        <h1 className="h-display text-4xl mb-10">Vos demandes.</h1>

        <div className="space-y-3.5">
          {(demandes as Demande[] | null)?.map((d) => (
            <Link key={d.id} href={`/mes-demandes/${d.id}`} className="card block hover:border-ligne-strong transition">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                <span className="flex items-center gap-3 font-condensed font-semibold text-xl uppercase">
                  <span className={d.mode === "enchere" ? "tag-enchere" : "tag-devis"}>
                    {d.mode === "enchere" ? "Enchère" : "Devis"}
                  </span>
                  {d.depart_adresse} <span className="text-blanc-faint font-sans normal-case font-normal">→</span> {d.arrivee_adresse}
                </span>
                <StatusChip kind={d.mode === "enchere" && d.statut === "ouverte" ? "live" : d.statut === "confirmee" ? "confirmee" : "ouverte"}>
                  {d.statut === "ouverte"
                    ? d.mode === "enchere" ? "En direct" : "En attente d'offres"
                    : d.statut === "confirmee" ? "Transporteur sélectionné" : d.statut}
                </StatusChip>
              </div>
              <p className="font-mono text-xs text-blanc-faint">
                {new Date(d.date_aller).toLocaleDateString("fr-FR")} · {d.passagers} passagers · Demande #{d.numero}
              </p>
            </Link>
          ))}
          {!demandes?.length && (
            <div className="card text-center py-12">
              <p className="text-blanc-dim mb-5">Aucune demande pour le moment.</p>
              <Link href="/demande" className="btn-primary">Faire ma première demande →</Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
