import { createClient } from "@/lib/supabase/server";
import { MODE_TAG } from "../helpers";
import { PilotageAction } from "../actions";

export const metadata = { title: "Demandes — Administration" };

export default async function AdminDemandesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("demandes")
    .select("*, client:profiles(nom)")
    .order("created_at", { ascending: false }).limit(100);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const D = (data ?? []) as any[];

  return (
    <main className="max-w-6xl mx-auto px-7 py-12">
      <p className="eyebrow mb-4">Administration</p>
      <h1 className="h-display text-4xl mb-2">Demandes.</h1>
      <p className="text-sm text-blanc-dim mb-10">Les 100 dernières demandes déposées, toutes issues confondues.</p>

      <div className="space-y-3">
        {D.map((d) => (
          <div key={d.id} className="card flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold">
                <span className={`tag mr-2.5 ${MODE_TAG[d.mode]}`}>{d.mode === "enchere" ? "Enchère" : "Devis"}</span>
                #{d.numero} — {d.depart_adresse} → {d.arrivee_adresse}
              </p>
              <p className="font-mono text-xs text-blanc-faint mt-1.5">
                {d.client?.nom ?? "Client sans nom"} · {d.passagers} pax ·
                {" "}{new Date(d.date_aller).toLocaleDateString("fr-FR")}{d.heure_aller ? ` à ${String(d.heure_aller).slice(0, 5).replace(":", "h")}` : ""} ·
                statut <strong className="text-blanc-dim">{d.statut}</strong> ·
                créée le {new Date(d.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            {d.statut === "ouverte" && (
              <PilotageAction entity="demande" id={d.id} action="annuler" label="Annuler"
                confirm="Annuler cette demande ? Les transporteurs ne la verront plus." />
            )}
          </div>
        ))}
        {D.length === 0 && <p className="text-blanc-dim text-sm">Aucune demande.</p>}
      </div>
    </main>
  );
}
