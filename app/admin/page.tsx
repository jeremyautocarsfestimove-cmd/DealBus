import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { TransporteurActions, PilotageAction, AdminTabs } from "./actions";

const SECTEURS: Record<string, string> = {
  autocariste: "Autocariste", vtc: "VTC", taxi: "Taxi", loti: "LOTI",
};
const MODE_TAG: Record<string, string> = {
  devis: "bg-bleunuit text-[#9DB3DE]", enchere: "bg-vert-dim text-vert",
};
const eur = (n: number) => Number(n).toLocaleString("fr-FR") + " €";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  if (me?.role !== "admin") {
    return (
      <>
        <Nav />
        <main className="max-w-2xl mx-auto px-7 py-24 text-center">
          <h1 className="h-display text-4xl mb-4">Accès réservé.</h1>
          <p className="text-blanc-dim">Cette page est réservée à l&apos;administration DealBus.</p>
        </main>
      </>
    );
  }

  // ---------- Données ----------
  const [{ data: transporteurs }, { data: demandes }, { data: missions }, { data: avis }, { data: retours }] =
    await Promise.all([
      supabase.from("transporteurs")
        .select("*, profile:profiles(nom, telephone), zones:transporteur_zones(departement)")
        .order("created_at", { ascending: false }),
      supabase.from("demandes")
        .select("*, client:profiles(nom)")
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("missions")
        .select("*, demande:demandes(numero, depart_adresse, arrivee_adresse), retour:retours_vide(depart_adresse, arrivee_adresse), transporteur:transporteurs(raison_sociale)")
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("avis")
        .select("*, transporteur:transporteurs(raison_sociale)")
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("retours_vide")
        .select("*, transporteur:transporteurs(raison_sociale)")
        .order("created_at", { ascending: false }).limit(100),
    ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const T = (transporteurs ?? []) as any[];
  const D = (demandes ?? []) as any[];
  const M = (missions ?? []) as any[];
  const A = (avis ?? []) as any[];
  const R = (retours ?? []) as any[];

  const enAttente = T.filter((t) => t.statut === "en_attente");
  const dossiersAnnulationLitige = M.filter(
    (m) => m.statut === "annulee" || m.statut === "litige" || !!m.annulation_motif
  );
  const dossiersATraiter = dossiersAnnulationLitige.filter(
    (m) =>
      m.statut === "litige" ||
      (m.statut === "annulee" && m.client_confirmation !== "bien_annule")
  );
  // Une mission annulée validée ne doit pas gonfler les commissions à facturer.
  const missionsCommissionnables = M.filter((m) => m.statut !== "annulee");
  const caTotal = missionsCommissionnables.reduce((s, m) => s + Number(m.commission_montant), 0);
  const caAFacturer = missionsCommissionnables.filter((m) => m.facturation === "a_facturer").reduce((s, m) => s + Number(m.commission_montant), 0);
  const caFacture = missionsCommissionnables.filter((m) => m.facturation === "facturee").reduce((s, m) => s + Number(m.commission_montant), 0);
  const caPaye = missionsCommissionnables.filter((m) => m.facturation === "payee").reduce((s, m) => s + Number(m.commission_montant), 0);

  const kpis = [
    { num: eur(caPaye), label: "Commissions encaissées", accent: true },
    { num: eur(caAFacturer + caFacture), label: "À facturer + en attente" },
    { num: `${D.filter((d) => d.statut === "ouverte").length} / ${D.length}`, label: "Demandes ouvertes / total" },
    { num: `${M.length}`, label: "Missions confirmées" },
    { num: `${enAttente.length}`, label: "Transporteurs à valider" },
    { num: `${T.filter((t) => t.statut === "valide").length}`, label: "Transporteurs actifs" },
    { num: `${M.filter((m) => m.statut === "litige").length} · ${M.filter((m) => m.statut === "annulee").length}`, label: "Litiges · Annulations", accent: M.some((m) => m.statut === "litige") },
    { num: D.length ? `${Math.round((M.length / D.length) * 100)} %` : "—", label: "Taux de conversion" },
  ];

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">Administration</p>
        <h1 className="h-display text-4xl mb-10">Pilotage DealBus.</h1>

        {/* ---------- KPIs ---------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {kpis.map((k) => (
            <div key={k.label} className={`card ${k.accent ? "border-ambre/40" : ""}`}>
              <p className={`font-mono text-xl font-semibold ${k.accent ? "text-ambre" : "text-blanc"}`}>{k.num}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        <AdminTabs labels={[
          `Transporteurs${enAttente.length ? ` (${enAttente.length} ⚠)` : ""}`,
          `Demandes (${D.length})`,
          `Missions & commissions (${M.length})`,
          `Annulations & litiges${dossiersATraiter.length ? ` (${dossiersATraiter.length})` : ""}`,
          `Avis (${A.length})`,
          `Retours à vide (${R.length})`,
        ]}>
          {[
            /* ---------- ONGLET TRANSPORTEURS ---------- */
            <div key="t">
              {enAttente.length > 0 && (
                <>
                  <h2 className="h-display text-xl mb-4">En attente de validation</h2>
                  <div className="space-y-3 mb-10">
                    {enAttente.map((t) => (
                      <div key={t.id} className="card border-ambre/30">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <p className="font-semibold">{t.raison_sociale}
                              <span className="ml-2.5 tag bg-bleunuit text-[#9DB3DE]">{SECTEURS[t.secteur] ?? t.secteur}</span>
                            </p>
                            <p className="font-mono text-xs text-blanc-faint mt-1.5">
                              SIREN {t.siren} · Titre {t.licence_transport} · Siège {t.departement_siege} ·
                              Zones {t.zones.map((z: { departement: string }) => z.departement).join(", ") || "—"}
                            </p>
                            <p className="font-mono text-xs text-blanc-faint mt-1">
                              {t.profile?.nom ?? "—"} · {t.profile?.telephone ?? "—"} ·
                              inscrit le {new Date(t.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <TransporteurActions id={t.id} statut={t.statut} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <h2 className="h-display text-xl mb-4">Tous les transporteurs</h2>
              <div className="space-y-3">
                {T.filter((t) => t.statut !== "en_attente").map((t) => (
                  <div key={t.id} className="card flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold">{t.raison_sociale}
                        <span className={`ml-2.5 tag ${t.statut === "valide" ? "bg-vert-dim text-vert" : "bg-[#3a2020] text-[#E8735D]"}`}>
                          {t.statut === "valide" ? "Actif" : "Suspendu"}
                        </span>
                      </p>
                      <p className="font-mono text-xs text-blanc-faint mt-1.5">
                        {SECTEURS[t.secteur] ?? t.secteur} · dépt. {t.departement_siege} ·
                        ★ {t.note_moyenne ?? "—"}/5 ({t.nb_avis} avis · {t.nb_missions} missions)
                      </p>
                    </div>
                    <TransporteurActions id={t.id} statut={t.statut} />
                  </div>
                ))}
                {T.length === 0 && <p className="text-blanc-dim text-sm">Aucun transporteur.</p>}
              </div>
            </div>,

            /* ---------- ONGLET DEMANDES ---------- */
            <div key="d" className="space-y-3">
              {D.map((d) => (
                <div key={d.id} className="card flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">
                      <span className={`tag mr-2.5 ${MODE_TAG[d.mode]}`}>{d.mode === "enchere" ? "Enchère" : "Devis"}</span>
                      #{d.numero} — {d.depart_adresse} → {d.arrivee_adresse}
                    </p>
                    <p className="font-mono text-xs text-blanc-faint mt-1.5">
                      {d.client?.nom ?? "Client sans nom"} · {d.passagers} pax ·
                      {" "}{new Date(d.date_aller).toLocaleDateString("fr-FR")} ·
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
            </div>,

            /* ---------- ONGLET MISSIONS & COMMISSIONS ---------- */
            <div key="m">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="card"><p className="font-mono text-lg font-semibold">{eur(caAFacturer)}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">À facturer</p></div>
                <div className="card"><p className="font-mono text-lg font-semibold">{eur(caFacture)}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Facturé, en attente</p></div>
                <div className="card border-ambre/40"><p className="font-mono text-lg font-semibold text-ambre">{eur(caPaye)}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Encaissé · total {eur(caTotal)}</p></div>
              </div>
              <div className="space-y-3">
                {M.map((m) => (
                  <div key={m.id} className="card flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold">
                        {m.demande
                          ? `#${m.demande.numero} — ${m.demande.depart_adresse} → ${m.demande.arrivee_adresse}`
                          : `${m.retour?.depart_adresse ?? "?"} → ${m.retour?.arrivee_adresse ?? "?"}`}
                        <span className="ml-2.5 tag bg-asphalte-3 text-blanc-dim">{m.source}</span>
                      </p>
                      <p className="font-mono text-xs text-blanc-faint mt-1.5">
                        {m.transporteur?.raison_sociale} · mission {eur(m.prix_final)} ·
                        commission <strong className="text-ambre">{eur(m.commission_montant)}</strong> ({m.commission_taux} %) ·
                        {" "}<strong className="text-blanc-dim">{m.statut === "annulee" ? "annulée" : m.statut === "litige" ? "⚠ LITIGE" : m.facturation.replace("_", " ")}</strong>
                      </p>
                      {m.annulation_motif && (
                        <p className="font-mono text-[11px] text-blanc-faint mt-1">
                          Motif d&apos;annulation : « {m.annulation_motif} »
                          {m.client_confirmation === "a_eu_lieu" && <strong className="text-[#E8735D]"> — le client déclare que le trajet A EU LIEU</strong>}
                          {m.client_confirmation === "bien_annule" && " — annulation confirmée par le client ✓"}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {m.statut === "annulee" && m.client_confirmation !== "bien_annule" && (
                        <>
                          <PilotageAction
                            entity="mission"
                            id={m.id}
                            action="valider_annulation"
                            label="Valider l'annulation"
                            primary
                            confirm="Confirmer que cette mission a bien été annulée ? Elle ne sera plus considérée comme une commission à facturer."
                          />
                          <PilotageAction
                            entity="mission"
                            id={m.id}
                            action="mettre_litige"
                            label="Passer en litige"
                            confirm="Passer cette annulation en litige pour contrôle ?"
                          />
                        </>
                      )}

                      {m.statut === "annulee" && m.client_confirmation === "bien_annule" && (
                        <span className="tag bg-vert-dim text-vert">Annulation traitée ✓</span>
                      )}

                      {m.statut === "litige" && (
                        <>
                          <PilotageAction
                            entity="mission"
                            id={m.id}
                            action="resoudre_annulation"
                            label="Confirmer l'annulation"
                            confirm="Clôturer ce litige en confirmant que la mission a bien été annulée ?"
                          />
                          <PilotageAction
                            entity="mission"
                            id={m.id}
                            action="resoudre_realisee"
                            label="Trajet réalisé"
                            primary
                            confirm="Confirmer que le trajet a eu lieu ? La mission redeviendra facturable."
                          />
                        </>
                      )}

                      {!["annulee", "litige"].includes(m.statut) && m.facturation === "a_facturer" && (
                        <PilotageAction entity="mission" id={m.id} action="facturer" label="Marquer facturée" primary />
                      )}
                      {!["annulee", "litige"].includes(m.statut) && m.facturation === "facturee" && (
                        <PilotageAction entity="mission" id={m.id} action="payer" label="Marquer payée" primary />
                      )}
                    </div>
                  </div>
                ))}
                {M.length === 0 && <p className="text-blanc-dim text-sm">Aucune mission confirmée pour l&apos;instant.</p>}
              </div>
            </div>,

            /* ---------- ONGLET ANNULATIONS & LITIGES ---------- */
            <div key="al">
              <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                <div>
                  <h2 className="h-display text-2xl">Annulations & litiges</h2>
                  <p className="text-sm text-blanc-dim mt-1">
                    Toutes les annulations transporteur et les dossiers nécessitant un traitement administratif.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="tag bg-[#3a2020] text-[#E8735D]">
                    {dossiersATraiter.length} à traiter
                  </span>
                  <span className="tag bg-asphalte-3 text-blanc-dim">
                    {dossiersAnnulationLitige.length} total
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {dossiersAnnulationLitige.map((m) => {
                  const traite =
                    m.statut === "annulee" && m.client_confirmation === "bien_annule";

                  return (
                    <div
                      key={m.id}
                      className={`card ${m.statut === "litige"
                        ? "border-ambre/40"
                        : traite
                          ? "border-vert/25"
                          : "border-[#E8735D]/35"}`}
                    >
                      <div className="flex items-start justify-between gap-5 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap mb-2">
                            <span className={`tag ${
                              m.statut === "litige"
                                ? "bg-ambre-dim text-ambre"
                                : traite
                                  ? "bg-vert-dim text-vert"
                                  : "bg-[#3a2020] text-[#E8735D]"
                            }`}>
                              {m.statut === "litige"
                                ? "Litige"
                                : traite
                                  ? "Annulation traitée"
                                  : "Annulation à traiter"}
                            </span>
                            <span className="font-mono text-[11px] text-blanc-faint">
                              Mission {String(m.id).slice(0, 8)}
                            </span>
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
                            <div className="mt-4 rounded-sm border border-ligne bg-asphalte/35 px-4 py-3 max-w-3xl">
                              <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mb-1">
                                Motif communiqué
                              </p>
                              <p className="text-sm text-blanc-dim">« {m.annulation_motif} »</p>
                            </div>
                          )}

                          <div className="mt-3 font-mono text-[11px] text-blanc-faint">
                            {m.client_confirmation === "a_eu_lieu" && (
                              <span className="text-[#E8735D]">
                                Le client déclare que le trajet a eu lieu.
                              </span>
                            )}
                            {m.client_confirmation === "bien_annule" && (
                              <span className="text-vert">
                                Annulation confirmée ✓
                              </span>
                            )}
                            {!m.client_confirmation && m.statut === "litige" && (
                              <span className="text-ambre">
                                En attente de décision administrative.
                              </span>
                            )}
                            {!m.client_confirmation && m.statut === "annulee" && (
                              <span>
                                Annulation enregistrée, validation administrative requise.
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap justify-end">
                          {m.statut === "annulee" && m.client_confirmation !== "bien_annule" && (
                            <>
                              <PilotageAction
                                entity="mission"
                                id={m.id}
                                action="valider_annulation"
                                label="Valider l'annulation"
                                primary
                                confirm="Confirmer définitivement l'annulation de cette mission ?"
                              />
                              <PilotageAction
                                entity="mission"
                                id={m.id}
                                action="mettre_litige"
                                label="Passer en litige"
                                confirm="Passer ce dossier en litige pour contrôle manuel ?"
                              />
                            </>
                          )}

                          {m.statut === "litige" && (
                            <>
                              <PilotageAction
                                entity="mission"
                                id={m.id}
                                action="resoudre_annulation"
                                label="Confirmer l'annulation"
                                confirm="Clôturer ce litige en confirmant l'annulation ?"
                              />
                              <PilotageAction
                                entity="mission"
                                id={m.id}
                                action="resoudre_realisee"
                                label="Trajet réalisé"
                                primary
                                confirm="Confirmer que le trajet a finalement eu lieu ?"
                              />
                            </>
                          )}

                          {traite && (
                            <span className="tag bg-vert-dim text-vert">
                              Dossier clôturé ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {dossiersAnnulationLitige.length === 0 && (
                  <div className="card text-center py-12">
                    <p className="text-blanc-dim">
                      Aucun dossier d&apos;annulation ou de litige.
                    </p>
                  </div>
                )}
              </div>
            </div>,

            /* ---------- ONGLET AVIS ---------- */
            <div key="a" className="space-y-3">
              {A.map((a) => (
                <div key={a.id} className="card flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">
                      <span className="text-ambre">{"★".repeat(a.note)}{"☆".repeat(5 - a.note)}</span>
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
            </div>,

            /* ---------- ONGLET RETOURS À VIDE ---------- */
            <div key="r" className="space-y-3">
              {R.map((r) => (
                <div key={r.id} className="card flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">
                      {r.depart_adresse} → {r.arrivee_adresse}
                      <span className="ml-2.5 tag bg-ambre-dim text-ambre">{eur(r.prix_fixe)}</span>
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
            </div>,
          ]}
        </AdminTabs>
      </main>
    </>
  );
}