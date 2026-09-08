import { createClient } from "@/lib/supabase/server";
import { eur, aTraiter, TAG_ALERTE } from "../helpers";
import { PilotageAction } from "../actions";

export const metadata = { title: "Annulations & litiges — Administration" };

export default async function AdminLitigesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("missions")
    .select("*, demande:demandes(numero, depart_adresse, arrivee_adresse), retour:retours_vide(depart_adresse, arrivee_adresse), transporteur:transporteurs(raison_sociale)")
    .in("statut", ["annulee", "litige"])
    .order("created_at", { ascending: false });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const dossiers = (data ?? []) as any[];
  const restants = dossiers.filter(aTraiter);

  return (
    <main className="max-w-6xl mx-auto px-7 py-12">
      <p className="eyebrow mb-4">Administration</p>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
        <div>
          <h1 className="h-display text-4xl mb-2">Annulations &amp; litiges.</h1>
          <p className="text-sm text-blanc-dim">
            Toutes les annulations transporteur et les dossiers nécessitant un arbitrage.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`tag ${restants.length ? TAG_ALERTE : "bg-vert-dim text-vert"}`}>
            {restants.length} à traiter
          </span>
          <span className="tag bg-asphalte-3 text-blanc-dim">{dossiers.length} total</span>
        </div>
      </div>

      <div className="space-y-3">
        {dossiers.map((m) => {
          const traite = m.statut === "annulee" && m.client_confirmation === "bien_annule";

          return (
            <div key={m.id} className={`card ${m.statut === "litige" ? "border-ambre/40" : traite ? "border-vert/25" : "border-[#C2410C]/35"}`}>
              <div className="flex items-start justify-between gap-5 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <span className={`tag ${m.statut === "litige" ? "bg-ambre-dim text-ambre-fort" : traite ? "bg-vert-dim text-vert" : TAG_ALERTE}`}>
                      {m.statut === "litige" ? "Litige" : traite ? "Annulation traitée" : "Annulation à traiter"}
                    </span>
                    <span className="font-mono text-[11px] text-blanc-faint">Mission {String(m.id).slice(0, 8)}</span>
                  </div>

                  <p className="font-semibold text-lg">
                    {m.demande
                      ? `#${m.demande.numero} — ${m.demande.depart_adresse} → ${m.demande.arrivee_adresse}`
                      : `${m.retour?.depart_adresse ?? "?"} → ${m.retour?.arrivee_adresse ?? "?"}`}
                  </p>

                  <p className="font-mono text-xs text-blanc-faint mt-1.5">
                    {m.transporteur?.raison_sociale ?? "Transporteur inconnu"} ·
                    mission {eur(m.prix_final)} · source {m.source}
                  </p>

                  {m.annulation_motif && (
                    <div className="mt-4 rounded-sm border border-ligne bg-asphalte px-4 py-3 max-w-3xl">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mb-1">Motif communiqué</p>
                      <p className="text-sm text-blanc-dim">« {m.annulation_motif} »</p>
                    </div>
                  )}

                  <div className="mt-3 font-mono text-[11px] text-blanc-faint">
                    {m.client_confirmation === "a_eu_lieu" && (
                      <span className="text-[#C2410C]">Le client déclare que le trajet a eu lieu.</span>
                    )}
                    {m.client_confirmation === "bien_annule" && <span className="text-vert">Annulation confirmée ✓</span>}
                    {!m.client_confirmation && m.statut === "litige" && (
                      <span className="text-ambre-fort">En attente de décision administrative.</span>
                    )}
                    {!m.client_confirmation && m.statut === "annulee" && (
                      <span>Annulation enregistrée, validation administrative requise.</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  {m.statut === "annulee" && m.client_confirmation !== "bien_annule" && (
                    <>
                      <PilotageAction entity="mission" id={m.id} action="valider_annulation" label="Valider l'annulation" primary
                        confirm="Confirmer définitivement l'annulation de cette mission ?" />
                      <PilotageAction entity="mission" id={m.id} action="mettre_litige" label="Passer en litige"
                        confirm="Passer ce dossier en litige pour contrôle manuel ?" />
                    </>
                  )}
                  {m.statut === "litige" && (
                    <>
                      <PilotageAction entity="mission" id={m.id} action="resoudre_annulation" label="Confirmer l'annulation"
                        confirm="Clôturer ce litige en confirmant l'annulation ?" />
                      <PilotageAction entity="mission" id={m.id} action="resoudre_realisee" label="Trajet réalisé" primary
                        confirm="Confirmer que le trajet a finalement eu lieu ?" />
                    </>
                  )}
                  {traite && <span className="tag bg-vert-dim text-vert">Dossier clôturé ✓</span>}
                </div>
              </div>
            </div>
          );
        })}

        {dossiers.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-blanc-dim">Aucun dossier d&apos;annulation ou de litige.</p>
          </div>
        )}
      </div>
    </main>
  );
}
