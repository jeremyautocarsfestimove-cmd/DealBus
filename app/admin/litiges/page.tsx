import { createClient } from "@/lib/supabase/server";
import { eur, aTraiter, TAG_ALERTE } from "../helpers";
import { PilotageAction } from "../actions";

export const metadata = { title: "Annulations & litiges — Administration" };

export default async function AdminLitigesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("missions")
    .select("*, demande:demandes(id, numero, depart_adresse, arrivee_adresse, date_aller), retour:retours_vide(depart_adresse, arrivee_adresse), transporteur:transporteurs(raison_sociale), client:profiles!missions_client_id_fkey(nom)")
    .or("statut.in.(annulee,litige),and(annulation_demandee_at.not.is.null,annulation_decision.is.null)")
    .order("created_at", { ascending: false });

  // Demandes (sans mission) dont le client demande l'annulation
  const { data: demandesAnnul } = await supabase.from("demandes")
    .select("id, numero, depart_adresse, arrivee_adresse, date_aller, annulation_motif, annulation_demandee_at, client:profiles(nom)")
    .not("annulation_demandee_at", "is", null).is("annulation_decision", null)
    .order("annulation_demandee_at", { ascending: false });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const dossiers = (data ?? []) as any[];
  const enAttente = dossiers.filter((m) => m.annulation_demandee_at && !m.annulation_decision && m.statut === "a_venir");
  const autres = dossiers.filter((m) => !enAttente.includes(m));
  const restants = dossiers.filter(aTraiter).length + (demandesAnnul ?? []).length;

  return (
    <main>
      <p className="eyebrow mb-4">Administration</p>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
        <div>
          <h1 className="h-display text-4xl mb-2">Annulations &amp; litiges.</h1>
          <p className="text-sm text-blanc-dim">
            Toutes les annulations transporteur et les dossiers nécessitant un arbitrage.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`tag ${restants ? TAG_ALERTE : "bg-vert-dim text-vert"}`}>
            {restants} à traiter
          </span>
          <span className="tag bg-asphalte-3 text-blanc-dim">{dossiers.length} total</span>
        </div>
      </div>

      {(enAttente.length > 0 || (demandesAnnul ?? []).length > 0) && (
        <div className="mb-10">
          <h2 className="h-display text-2xl mb-1">Demandes d&apos;annulation à valider</h2>
          <p className="text-sm text-blanc-dim mb-4">Rien n&apos;est annulé tant que vous n&apos;avez pas tranché. Les deux parties sont prévenues par email de votre décision.</p>
          <div className="space-y-3">
            {enAttente.map((m) => (
              <div key={m.id} className="card border-ambre/50">
                <div className="flex items-start justify-between gap-5 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-2">
                      <span className="tag bg-ambre-dim text-ambre-fort">Mission · demandée par {m.annulation_demandee_role === "client" ? "le client" : "le transporteur"}</span>
                      <span className="font-mono text-[11px] text-blanc-faint">{m.annulation_demandee_at ? new Date(m.annulation_demandee_at).toLocaleString("fr-FR") : ""}</span>
                    </div>
                    <p className="font-semibold text-lg">#{m.demande?.numero} — {m.demande?.depart_adresse} → {m.demande?.arrivee_adresse}</p>
                    <p className="font-mono text-xs text-blanc-faint mt-1.5">
                      {m.demande?.date_aller ? `Départ ${new Date(m.demande.date_aller).toLocaleDateString("fr-FR")} · ` : ""}{m.transporteur?.raison_sociale ?? "?"} · client {m.client?.nom ?? "?"} · mission {eur(m.prix_final)} · commission {eur(m.commission_montant)}
                    </p>
                    <div className="mt-4 rounded-sm border border-ligne bg-asphalte px-4 py-3 max-w-3xl">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mb-1">Motif</p>
                      <p className="text-sm text-blanc-dim">« {m.annulation_motif} »</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <PilotageAction entity="mission" id={m.id} action="valider_annulation" label="Valider l'annulation" primary
                      confirm="Valider : la mission passe en annulée, aucune commission, les deux parties sont prévenues." />
                    <PilotageAction entity="mission" id={m.id} action="refuser_annulation" label="Refuser"
                      confirm="Refuser : la mission reste prévue, le demandeur est prévenu." />
                  </div>
                </div>
              </div>
            ))}
            {(demandesAnnul ?? []).map((d: any) => (
              <div key={d.id} className="card border-ambre/50">
                <div className="flex items-start justify-between gap-5 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-2">
                      <span className="tag bg-ambre-dim text-ambre-fort">Demande · offres reçues · client</span>
                      <span className="font-mono text-[11px] text-blanc-faint">{new Date(d.annulation_demandee_at).toLocaleString("fr-FR")}</span>
                    </div>
                    <p className="font-semibold text-lg">#{d.numero} — {d.depart_adresse} → {d.arrivee_adresse}</p>
                    <p className="font-mono text-xs text-blanc-faint mt-1.5">Départ {new Date(d.date_aller).toLocaleDateString("fr-FR")} · client {d.client?.nom ?? "?"}</p>
                    <div className="mt-4 rounded-sm border border-ligne bg-asphalte px-4 py-3 max-w-3xl">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mb-1">Motif</p>
                      <p className="text-sm text-blanc-dim">« {d.annulation_motif} »</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <PilotageAction entity="demande" id={d.id} action="valider_annulation" label="Valider l'annulation" primary
                      confirm="Valider : la demande est annulée, les transporteurs ayant répondu sont prévenus." />
                    <PilotageAction entity="demande" id={d.id} action="refuser_annulation" label="Refuser"
                      confirm="Refuser : la demande reste ouverte, le client est prévenu." />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="h-display text-2xl mb-4">Annulations et litiges</h2>
      <div className="space-y-3">
        {autres.map((m) => {
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

        {autres.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-blanc-dim">Aucun dossier d&apos;annulation ou de litige.</p>
          </div>
        )}
      </div>
    </main>
  );
}
