import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Tabs } from "@/components/Tabs";
import { createClient } from "@/lib/supabase/server";
import type { Demande } from "@/lib/types";
import { InscriptionTransporteur } from "./InscriptionTransporteur";
import { DeclarerTerminee, ReservationActions, PublierRetour, AnnulerMission, GererVehicules, CgvForm, GererZones } from "./pro-actions";

const eur = (n: number) => Number(n).toLocaleString("fr-FR") + " €";
const OFFRE_STATUT: Record<string, { label: string; cls: string }> = {
  envoyee: { label: "En attente", cls: "bg-asphalte-3 text-blanc-dim" },
  consultee: { label: "Consultée", cls: "bg-bleunuit text-[#9DB3DE]" },
  retenue: { label: "Retenue ✓", cls: "bg-vert-dim text-vert" },
  non_retenue: { label: "Non retenue", cls: "bg-[#3a2020] text-[#E8735D]" },
};

export default async function ProPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: transporteur } = user
    ? await supabase.from("transporteurs").select("*").eq("id", user.id).maybeSingle()
    : { data: null };

  if (!transporteur) {
    return (
      <>
        <Nav />
        <main className="max-w-2xl mx-auto px-7 py-14">
          <p className="eyebrow mb-4">Espace transporteur</p>
          <h1 className="h-display text-4xl mb-4">Devenir partenaire.</h1>
          <p className="text-blanc-dim mb-8">
            Inscription gratuite. Votre titre d&apos;exercice et votre RC Pro sont
            vérifiés manuellement avant l&apos;accès aux demandes.
          </p>
          <InscriptionTransporteur />
        </main>
      </>
    );
  }

  if (transporteur.statut !== "valide") {
    return (
      <>
        <Nav />
        <main className="max-w-2xl mx-auto px-7 py-14">
          <h1 className="h-display text-4xl mb-4">
            {transporteur.statut === "suspendu" ? "Compte suspendu." : "Compte en cours de validation."}
          </h1>
          <p className="text-blanc-dim">
            {transporteur.statut === "suspendu"
              ? "Votre accès aux demandes est suspendu. Contactez-nous pour en savoir plus."
              : "Nos équipes vérifient votre titre d'exercice et votre RC Pro. Vous recevrez un email dès l'activation de votre accès aux demandes."}
          </p>
        </main>
      </>
    );
  }

  // ---------- Données du tableau de bord ----------
  const [{ data: leads }, { data: offres }, { data: mesBids }, { data: missions }, { data: retours }] =
    await Promise.all([
      supabase.from("demandes").select("*").eq("statut", "ouverte").order("created_at", { ascending: false }),
      supabase.from("offres")
        .select("*, demande:demandes(numero, depart_adresse, arrivee_adresse, date_aller, passagers)")
        .eq("transporteur_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("bids")
        .select("*, demande:demandes(id, numero, depart_adresse, arrivee_adresse, enchere_fin, statut)")
        .eq("transporteur_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("missions")
        .select("*, demande:demandes(numero, depart_adresse, arrivee_adresse, date_aller, passagers), retour:retours_vide(depart_adresse, arrivee_adresse, date_dispo, places), client:profiles!missions_client_id_fkey(nom, telephone, email)")
        .eq("transporteur_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("retours_vide")
        .select("*, reservations:reservations_retour(*, client:profiles(nom, telephone, email))")
        .eq("transporteur_id", user!.id).order("created_at", { ascending: false }),
    ]);

  const { data: vehicules } = await supabase
    .from("vehicules").select("*")
    .eq("transporteur_id", user!.id).order("created_at", { ascending: true });

  const { data: zones } = await supabase
    .from("transporteur_zones").select("departement")
    .eq("transporteur_id", user!.id).order("departement", { ascending: true });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const L = (leads ?? []) as Demande[];
  const O = (offres ?? []) as any[];
  const B = (mesBids ?? []) as any[];
  const M = (missions ?? []) as any[];
  const R = (retours ?? []) as any[];

  // Enchères : regrouper mes relances par demande (ma meilleure offre par enchère)
  const encheresMap = new Map<string, { demande: any; mienne: number; nb: number }>();
  for (const b of B) {
    const key = b.demande?.id ?? b.demande_id;
    const cur = encheresMap.get(key);
    if (!cur) encheresMap.set(key, { demande: b.demande, mienne: Number(b.prix_ttc), nb: 1 });
    else { cur.mienne = Math.min(cur.mienne, Number(b.prix_ttc)); cur.nb++; }
  }
  const encheres = Array.from(encheresMap.values());

  const commissionsDues = M
    .filter((m) => m.facturation !== "payee")
    .reduce((s, m) => s + Number(m.commission_montant), 0);

  // CA généré via DealBus (toutes missions hors annulées)
  const chiffreAffaires = M
    .filter((m) => m.statut !== "annulee")
    .reduce((s, m) => s + Number(m.prix_final), 0);

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">Espace transporteur</p>
        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <h1 className="h-display text-4xl mb-2">{transporteur.raison_sociale}</h1>
            <p className="font-mono text-xs text-blanc-faint">
              ★ {transporteur.note_moyenne ?? "—"}/5 · {transporteur.nb_avis} avis · {transporteur.nb_missions} missions réalisées
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-3xl font-semibold text-vert">{eur(chiffreAffaires)}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">
              CA généré via DealBus
            </p>
          </div>
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="card"><p className="font-mono text-xl font-semibold">{L.length}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Leads disponibles</p></div>
          <div className="card"><p className="font-mono text-xl font-semibold">{O.filter((o) => o.statut === "envoyee" || o.statut === "consultee").length + encheres.filter((e) => e.demande?.statut === "ouverte").length}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Offres en cours</p></div>
          <div className="card"><p className="font-mono text-xl font-semibold text-vert">{M.filter((m) => m.statut === "a_venir").length}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Missions à venir</p></div>
          <div className="card"><p className="font-mono text-xl font-semibold text-ambre">{eur(commissionsDues)}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Commissions dues</p></div>
        </div>

        <Tabs labels={[
          `Nouveaux leads (${L.length})`,
          `Mes offres (${O.length + encheres.length})`,
          `Mes missions (${M.length})`,
          `Mes retours à vide (${R.length})`,
          "Mon profil",
        ]}>
          {[
            /* ---------- LEADS ---------- */
            <div key="l" className="space-y-3">
              {L.map((d) => (
                <Link key={d.id} href={`/pro/leads/${d.id}`} className="card block hover:border-ligne-strong transition">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                    <span className="flex items-center gap-3 font-condensed font-semibold text-xl uppercase">
                      <span className={d.mode === "enchere" ? "tag-enchere" : "tag-devis"}>
                        {d.mode === "enchere" ? "Enchère" : "Devis"}
                      </span>
                      {d.depart_adresse} <span className="text-blanc-faint font-sans normal-case font-normal">→</span> {d.arrivee_adresse}
                    </span>
                    <span className="font-mono text-[11.5px] uppercase tracking-wider text-blanc-faint">Client anonyme</span>
                  </div>
                  <p className="font-mono text-xs text-blanc-faint">
                    {new Date(d.date_aller).toLocaleDateString("fr-FR")} · {d.passagers} passagers · Demande #{d.numero}
                  </p>
                </Link>
              ))}
              {L.length === 0 && <p className="text-blanc-dim text-sm">Aucune demande ouverte dans vos zones pour l&apos;instant.</p>}
            </div>,

            /* ---------- MES OFFRES ---------- */
            <div key="o">
              <h2 className="h-display text-xl mb-4">Devis envoyés (tir unique)</h2>
              <div className="space-y-3 mb-10">
                {O.map((o) => (
                  <div key={o.id} className="card flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold">
                        #{o.demande?.numero} — {o.demande?.depart_adresse} → {o.demande?.arrivee_adresse}
                      </p>
                      <p className="font-mono text-xs text-blanc-faint mt-1.5">
                        Votre offre : <strong className="text-blanc">{eur(o.prix_ttc)}</strong> ·
                        {" "}{o.vehicule_type} {o.vehicule_places} pl. ·
                        envoyée le {new Date(o.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className={`tag ${OFFRE_STATUT[o.statut].cls}`}>{OFFRE_STATUT[o.statut].label}</span>
                  </div>
                ))}
                {O.length === 0 && <p className="text-blanc-dim text-sm">Aucun devis envoyé.</p>}
              </div>

              <h2 className="h-display text-xl mb-4">Enchères en cours ou passées</h2>
              <div className="space-y-3">
                {encheres.map((e, i) => {
                  const live = e.demande?.statut === "ouverte" && e.demande?.enchere_fin && new Date(e.demande.enchere_fin) > new Date();
                  return (
                    <Link key={i} href={`/pro/leads/${e.demande?.id}`} className="card flex items-center justify-between gap-4 flex-wrap hover:border-ligne-strong transition">
                      <div>
                        <p className="font-semibold">
                          #{e.demande?.numero} — {e.demande?.depart_adresse} → {e.demande?.arrivee_adresse}
                        </p>
                        <p className="font-mono text-xs text-blanc-faint mt-1.5">
                          Votre meilleure relance : <strong className="text-blanc">{eur(e.mienne)}</strong> ({e.nb} relance{e.nb > 1 ? "s" : ""})
                        </p>
                      </div>
                      <span className={`tag ${live ? "bg-vert-dim text-vert" : "bg-asphalte-3 text-blanc-faint"}`}>
                        {live ? "En direct — relancer" : "Clôturée"}
                      </span>
                    </Link>
                  );
                })}
                {encheres.length === 0 && <p className="text-blanc-dim text-sm">Aucune participation à une enchère.</p>}
              </div>
            </div>,

            /* ---------- MES MISSIONS ---------- */
            <div key="m" className="space-y-3">
              {M.map((m) => (
                <div key={m.id} className="card">
                  <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
                    <div>
                      <p className="font-semibold">
                        {m.demande
                          ? `#${m.demande.numero} — ${m.demande.depart_adresse} → ${m.demande.arrivee_adresse}`
                          : `${m.retour?.depart_adresse} → ${m.retour?.arrivee_adresse}`}
                      </p>
                      <p className="mt-2 flex gap-2 flex-wrap">
                        {m.source === "retour_vide" && <span className="tag bg-ambre-dim text-ambre whitespace-nowrap">Retour à vide</span>}
                        <span className={`tag whitespace-nowrap ${
                          m.statut === "a_venir" ? "bg-vert-dim text-vert"
                          : m.statut === "annulee" ? "bg-[#3a2020] text-[#E8735D]"
                          : "bg-asphalte-3 text-blanc-dim"}`}>
                          {m.statut === "a_venir" ? "À venir"
                            : m.statut === "terminee_declaree" ? "Terminée"
                            : m.statut === "annulee" ? "Annulée"
                            : m.statut}
                        </span>
                      </p>
                      <p className="font-mono text-xs text-blanc-faint mt-1.5">
                        {(m.demande?.date_aller || m.retour?.date_dispo) &&
                          new Date(m.demande?.date_aller ?? m.retour?.date_dispo).toLocaleDateString("fr-FR")} ·
                        {" "}{m.demande?.passagers ?? m.retour?.places} pax · prix {eur(m.prix_final)} ·
                        commission <strong className="text-ambre">{eur(m.commission_montant)}</strong> ({m.commission_taux} %)
                      </p>
                      <p className="font-mono text-xs text-blanc mt-2">
                        Contact client : {m.client?.nom ?? "—"} · {m.client?.telephone ?? "tél. non renseigné"}
                        {m.client?.email ? ` · ${m.client.email}` : ""}
                      </p>
                    </div>
                    {m.statut === "a_venir" && (
                      <div className="flex gap-2 shrink-0 whitespace-nowrap sm:justify-end">
                        <DeclarerTerminee missionId={m.id} />
                        <AnnulerMission missionId={m.id} />
                      </div>
                    )}
                    {m.statut === "terminee_declaree" && (
                      <span className="font-mono text-[11.5px] text-blanc-faint sm:justify-self-end">En attente d&apos;avis client</span>
                    )}
                  </div>
                </div>
              ))}
              {M.length === 0 && <p className="text-blanc-dim text-sm">Aucune mission remportée pour l&apos;instant — répondez aux leads !</p>}
            </div>,

            /* ---------- MES RETOURS À VIDE ---------- */
            <div key="r">
              <PublierRetour transporteurId={user!.id} />
              <div className="space-y-3">
                {R.map((r) => (
                  <div key={r.id} className="card">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-1">
                      <p className="font-semibold">
                        {r.depart_adresse} → {r.arrivee_adresse}
                        <span className="ml-2.5 tag bg-ambre-dim text-ambre">{eur(r.prix_fixe)}</span>
                      </p>
                      <span className={`tag ${["publie", "demande_recue"].includes(r.statut) ? "bg-vert-dim text-vert" : "bg-asphalte-3 text-blanc-faint"}`}>
                        {r.statut === "publie" ? "En ligne" : r.statut === "demande_recue" ? "Demande reçue" : r.statut}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-blanc-faint mb-3">
                      {new Date(r.date_dispo).toLocaleDateString("fr-FR")}
                      {r.heure_apres ? `, départ après ${String(r.heure_apres).slice(0, 5)}` : ""} · {r.places} places
                    </p>
                    {(r.reservations ?? []).map((resa: any) => (
                      <div key={resa.id} className="border-t border-ligne pt-3 mt-2 flex items-center justify-between gap-4 flex-wrap">
                        <p className="font-mono text-xs text-blanc-dim">
                          {resa.statut === "en_attente" && <>Demande de réservation du trajet — client anonyme jusqu&apos;à votre validation</>}
                          {resa.statut === "validee" && <>Réservation validée ✓ — {resa.client?.nom ?? "client"} · {resa.client?.telephone ?? "tél. non renseigné"}{resa.client?.email ? ` · ${resa.client.email}` : ""}</>}
                          {resa.statut === "refusee" && <>Demande refusée</>}
                        </p>
                        {resa.statut === "en_attente" && (
                          <ReservationActions reservationId={resa.id} retourId={r.id} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                {R.length === 0 && <p className="text-blanc-dim text-sm">Aucun trajet retour publié — c&apos;est le moment de rentabiliser vos kilomètres à vide.</p>}
              </div>
            </div>,
            /* ---------- MON PROFIL ---------- */
            <div key="p">
              <GererZones transporteurId={user!.id} zones={(zones ?? []) as any[]} />
              <GererVehicules transporteurId={user!.id} vehicules={(vehicules ?? []) as any[]} />
              <CgvForm transporteurId={user!.id} initial={transporteur.cgv ?? null} />
            </div>,
          ]}
        </Tabs>
      </main>
    </>
  );
}
