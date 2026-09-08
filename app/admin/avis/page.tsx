import { createClient } from "@/lib/supabase/server";
import { PilotageAction } from "../actions";

export const metadata = { title: "Avis — Administration" };

export default async function AdminAvisPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("avis")
    .select("*, transporteur:transporteurs(raison_sociale)")
    .order("created_at", { ascending: false }).limit(100);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const A = (data ?? []) as any[];

  return (
    <main className="max-w-6xl mx-auto px-7 py-12">
      <p className="eyebrow mb-4">Administration</p>
      <h1 className="h-display text-4xl mb-2">Avis.</h1>
      <p className="text-sm text-blanc-dim mb-10">
        Supprimer un avis recalcule automatiquement la note du transporteur.
      </p>

      <div className="space-y-3">
        {A.map((a) => (
          <div key={a.id} className="card flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold">
                <span className="text-ambre-fort">{"★".repeat(a.note)}{"☆".repeat(5 - a.note)}</span>
                <span className="ml-2.5">{a.transporteur?.raison_sociale}</span>
              </p>
              {a.commentaire && <p className="text-sm text-blanc-dim mt-1.5 max-w-xl">« {a.commentaire} »</p>}
              <p className="font-mono text-[11px] text-blanc-faint mt-1.5">
                {new Date(a.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <PilotageAction entity="avis" id={a.id} action="supprimer" label="Supprimer"
              confirm="Supprimer cet avis ? La note du transporteur sera recalculée." />
          </div>
        ))}
        {A.length === 0 && <p className="text-blanc-dim text-sm">Aucun avis publié.</p>}
      </div>
    </main>
  );
}
