import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MODE_TAG, eur } from "../helpers";
import { PilotageAction } from "../actions";

export const metadata = { title: "Demandes — Administration" };

export default async function AdminDemandesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("demandes")
    .select("*, client:profiles(nom)")
    .order("created_at", { ascending: false }).limit(100);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const D = (data ?? []) as any[];

  // Une seule requête pour toutes les offres des demandes affichées :
  // on agrège ensuite en mémoire plutôt que de faire 100 requêtes.
  const { data: offres } = D.length
    ? await supabase.from("offres").select("demande_id, prix_ttc").in("demande_id", D.map((d) => d.id))
    : { data: [] };

  const parDemande = new Map<string, number[]>();
  for (const o of (offres ?? []) as any[]) {
    const l = parDemande.get(o.demande_id) ?? [];
    l.push(Number(o.prix_ttc));
    parDemande.set(o.demande_id, l);
  }

  return (
    <main>
      <p className="eyebrow mb-4">Administration</p>
      <h1 className="h-display text-4xl mb-2">Demandes.</h1>
      <p className="text-sm text-blanc-dim mb-10">
        Les 100 dernières demandes déposées. Ouvrez une demande pour voir le détail des offres reçues,
        les prix proposés et les écarts entre transporteurs.
      </p>

      <div className="space-y-3">
        {D.map((d) => {
          const p = parDemande.get(d.id) ?? [];
          const min = p.length ? Math.min(...p) : null;
          const max = p.length ? Math.max(...p) : null;

          return (
            <div key={d.id} className="card flex items-center justify-between gap-4 flex-wrap hover:border-ligne-strong transition">
              <div className="min-w-0">
                <p className="font-semibold">
                  <span className={`tag mr-2.5 ${MODE_TAG[d.mode]}`}>{d.mode === "enchere" ? "Enchère" : "Devis"}</span>
                  <Link href={`/admin/demandes/${d.id}`} className="hover:underline">
                    #{d.numero} — {d.depart_adresse} → {d.arrivee_adresse}
                  </Link>
                </p>
                <p className="font-mono text-xs text-blanc-faint mt-1.5">
                  {d.client?.nom ?? "Client sans nom"} · {d.passagers} pax ·
                  {" "}{new Date(d.date_aller).toLocaleDateString("fr-FR")}{d.heure_aller ? ` à ${String(d.heure_aller).slice(0, 5).replace(":", "h")}` : ""} ·
                  statut <strong className="text-blanc-dim">{d.statut}</strong> ·
                  créée le {new Date(d.created_at).toLocaleDateString("fr-FR")}
                </p>
                <p className="font-mono text-xs mt-1.5">
                  {p.length === 0 ? (
                    <span className="text-blanc-faint">Aucune offre reçue</span>
                  ) : (
                    <>
                      <strong className="text-blanc">{p.length} offre{p.length > 1 ? "s" : ""}</strong>
                      <span className="text-blanc-faint"> · de </span>
                      <strong className="text-vert">{eur(min!)}</strong>
                      <span className="text-blanc-faint"> à </span>
                      <strong className="text-blanc-dim">{eur(max!)}</strong>
                      {d.prix_estime && (
                        <span className="text-blanc-faint"> · estimation affichée {eur(d.prix_estime)}</span>
                      )}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <Link href={`/admin/demandes/${d.id}`} className="btn-ghost text-xs px-4 py-2">Détail →</Link>
                {d.statut === "ouverte" && (
                  <PilotageAction entity="demande" id={d.id} action="annuler" label="Annuler"
                    confirm="Annuler cette demande ? Les transporteurs ne la verront plus." />
                )}
              </div>
            </div>
          );
        })}
        {D.length === 0 && <p className="text-blanc-dim text-sm">Aucune demande.</p>}
      </div>
    </main>
  );
}
