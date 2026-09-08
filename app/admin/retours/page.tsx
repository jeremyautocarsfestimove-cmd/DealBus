import { createClient } from "@/lib/supabase/server";
import { eur } from "../helpers";
import { PilotageAction } from "../actions";

export const metadata = { title: "Retours à vide — Administration" };

export default async function AdminRetoursPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("retours_vide")
    .select("*, transporteur:transporteurs(raison_sociale)")
    .order("created_at", { ascending: false }).limit(100);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const R = (data ?? []) as any[];

  return (
    <main>
      <p className="eyebrow mb-4">Administration</p>
      <h1 className="h-display text-4xl mb-2">Retours à vide.</h1>
      <p className="text-sm text-blanc-dim mb-10">Annonces publiées par les transporteurs sur la page publique.</p>

      <div className="space-y-3">
        {R.map((r) => (
          <div key={r.id} className="card flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold">
                {r.depart_adresse} → {r.arrivee_adresse}
                <span className="ml-2.5 tag bg-ambre-dim text-ambre-fort">{eur(r.prix_fixe)}</span>
                <span className={`ml-2 tag ${["publie", "demande_recue"].includes(r.statut) ? "bg-vert-dim text-vert" : "bg-asphalte-3 text-blanc-faint"}`}>{r.statut}</span>
              </p>
              <p className="font-mono text-xs text-blanc-faint mt-1.5">
                {r.transporteur?.raison_sociale} · {new Date(r.date_dispo).toLocaleDateString("fr-FR")} ·
                {" "}{r.places} places
              </p>
            </div>
            {["publie", "demande_recue"].includes(r.statut) && (
              <PilotageAction entity="retour" id={r.id} action="retirer" label="Retirer"
                confirm="Retirer cette annonce de la liste publique ?" />
            )}
          </div>
        ))}
        {R.length === 0 && <p className="text-blanc-dim text-sm">Aucun retour à vide publié.</p>}
      </div>
    </main>
  );
}
