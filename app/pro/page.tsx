import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Tabs } from "@/components/Tabs";
import { createClient } from "@/lib/supabase/server";
import type { Demande } from "@/lib/types";
import { InscriptionTransporteur } from "./InscriptionTransporteur";
import { DeclarerTerminee, ReservationActions, PublierRetour, AnnulerMission, GererVehicules, CgvForm, GererZones } from "./pro-actions";

const eur = (n: number) => Number(n).toLocaleString("fr-FR") + " €";
const dateHeure = (date: string | null, heure?: string | null) =>
  date ? new Date(date).toLocaleDateString("fr-FR") + (heure ? ` à ${String(heure).slice(0, 5).replace(":", "h")}` : "") : "";
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
  const [{ data: leads }, { data: offres }, { data: mesBids }, { data: missions }, { data: retours }, { data: avis }] =
    await Promise.all([
      supabase.from("demandes").select("*").eq("statut", "ouverte").order("created_at", { ascending: false }),
      supabase.from("offres")
        .select("*, demande:demandes(numero, depart_adresse, arrivee_adresse, date_aller, heure_aller, passagers, statut, enchere_fin)")
        .eq("transporteur_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("bids")
        .select("*, demande:demandes(id, numero, depart_adresse, arrivee_adresse, enchere_fin, statut)")
        .eq("transporteur_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("missions")
        .select("*, demande:demandes(numero, depart_adresse, arrivee_adresse, date_aller, heure_aller, passagers), retour:retours_vide(depart_adresse, arrivee_adresse, date_dispo, heure_apres, places), client:profiles!missions_client_id_fkey(nom, telephone, email)")
        .eq("transporteur_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("retours_vide")
        .select("*, reservations:reservations_retour(*, client:profiles(nom, telephone, email))")
        .eq("transporteur_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("avis")
        .select("*, client:profiles(nom), mission:missions(demande:demandes(numero, depart_adresse, arrivee_adresse, date_aller))")
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
  const A = (avis ?? []) as any[];
  const noteMoyenneAvis = A.length
    ? (A.reduce((s, a) => s + Number(a.note), 0) / A.length).toFixed(1)
    : null;

  // Archivage automatique : on garde la partie active légère et on range
  // automatiquement les éléments terminés / dépassés dans une section repliable.
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const enchereEstTerminee = (d: any) =>
    d?.mode === "enchere" &&
    !!d?.enchere_fin &&
    new Date(d.enchere_fin).getTime() <= now.getTime();

  const leadsActifs = L.filter((d: any) => !enchereEstTerminee(d));
  const encheresTermineesSansOffre = L.filter((d: any) => enchereEstTerminee(d));

  const offreEstActive = (o: any) =>
    ["envoyee", "consultee"].includes(o.statut) &&
    ["ouverte", "selection"].includes(o.demande?.statut ?? "ouverte") &&
    (!o.demande?.date_aller || new Date(`${o.demande.date_aller}T23:59:59`) >= today);

  const offresActives = O.filter(offreEstActive);
  const offresArchivees = O.filter((o) => !offreEstActive(o));

  const missionEstActive = (m: any) => {
    const date = m.demande?.date_aller ?? m.retour?.date_dispo;
    return m.statut === "a_venir" && (!date || new Date(`${date}T23:59:59`) >= today);
  };

  const missionsActives = M.filter(missionEstActive);
  const missionsArchivees = M.filter((m) => !missionEstActive(m));

  const retourEstActif = (r: any) =>
    !["expire", "annule"].includes(r.statut) &&
    (!r.date_dispo || new Date(`${r.date_dispo}T23:59:59`) >= today);

  const retoursActifs = R.filter(retourEstActif);
  const retoursArchives = R.filter((r) => !retourEstActif(r));

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
              ★ {noteMoyenneAvis ?? "—"}/5 · {A.length} avis · {transporteur.nb_missions} missions réalisées
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
          <div className="card"><p className="font-mono text-xl font-semibold">{leadsActifs.length}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Leads disponibles</p></div>
          <div className="card"><p className="font-mono text-xl font-semibold">{offresActives.length + encheres.filter((e) => e.demande?.statut === "ouverte" && (!e.demande?.enchere_fin || new Date(e.demande.enchere_fin) > now)).length}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Offres en cours</p></div>
          <div className="card"><p className="font-mono text-xl font-semibold text-vert">{missionsActives.length}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Missions à venir</p></div>
          <div className="card"><p className="font-mono text-xl font-semibold text-ambre">{eur(commissionsDues)}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Commissions dues</p></div>
        </div>

        <Tabs labels={[
          `Nouveaux leads (${leadsActifs.length})`,
          `Mes offres (${offresActives.length + encheres.filter((e) => e.demande?.statut === "ouverte" && (!e.demande?.enchere_fin || new Date(e.demande.enchere_fin) > now)).length})`,
          `Mes missions (${missionsActives.length})`,
          `Mes retours à vide (${retoursActifs.length})`,
          `Avis (${A.length})`,
          "Mon profil",
        ]}>
          {[
            /* ---------- LEADS ---------- */
            <div key="l" className="space-y-8">
              <div className="space-y-3">
                {leadsActifs.map((d) => (
                  <Link key={d.id} href={`/pro/leads/${d.id}`} className="card block hover:border-ligne-strong transition">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                      <span className="flex items-center gap-3 font-condensed font-semibold text-xl uppercase">
                        <span className={d.mode === "enchere" ? "tag-enchere" : "tag-devis"}>
                          {d.mode === "enchere" ? "Enchère" : "Devis"}
                        </span>
                        {d.depart_adresse} <span className="text-blanc-faint font-sans normal-case font-normal">→</span> {d.arrivee_adresse}
                      </span>
                      {d.mode === "enchere" ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-vert/30 bg-vert-dim px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-vert">
                          <span className="h-1.5 w-1.5 rounded-full bg-vert animate-pulse" />
                          En direct
                        </span>
                      ) : (
                        <span className="font-mono text-[11.5px] uppercase tracking-wider text-blanc-faint">Client anonyme</span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-blanc-faint">
                      {dateHeure(d.date_aller, d.heure_aller)} · {d.passagers} passagers · Demande #{d.numero}
                    </p>
                  </Link>
                ))}
                {leadsActifs.length === 0 && <p className="text-blanc-dim text-sm">Aucune demande active dans vos zones pour l&apos;instant.</p>}
              </div>

              {encheresTermineesSansOffre.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="h-display text-xl">Enchères terminées</h3>
                    <span className="tag bg-[#3a2020] text-[#E8735D]">{encheresTermineesSansOffre.length}</span>
                  </div>
                  <div className="space-y-3">
                    {encheresTermineesSansOffre.map((d) => (
                      <Link
                        key={d.id}
                        href={`/pro/leads/${d.id}`}
                        className="card block border-[#6b3434]/60 bg-[#24191a]/40 hover:border-[#8a4545] transition"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                          <span className="flex items-center gap-3 font-condensed font-semibold text-xl uppercase">
                            <span className="tag-enchere">Enchère</span>
                            {d.depart_adresse} <span className="text-blanc-faint font-sans normal-case font-normal">→</span> {d.arrivee_adresse}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-[#E8735D]/30 bg-[#3a2020] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#E8735D]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#E8735D]" />
                            Enchère terminée
                          </span>
                        </div>
                        <p className="font-mono text-xs text-blanc-faint">
                          {dateHeure(d.date_aller, d.heure_aller)} · {d.passagers} passagers · Demande #{d.numero}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>,

            /* ---------- MES OFFRES ---------- */
            <div key="o">
              <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                <div>
                  <h2 className="h-display text-2xl mb-1">Mes offres</h2>
                  <p className="text-sm text-blanc-dim">Les offres encore actives restent ici. Les offres terminées sont archivées automatiquement.</p>
                </div>
                <span className="tag bg-vert-dim text-vert">{offresActives.length + encheres.filter((e) => e.demande?.statut === "ouverte" && (!e.demande?.enchere_fin || new Date(e.demande.enchere_fin) > now)).length} en cours</span>
              </div>

              <h3 className="h-display text-xl mb-4">Devis en cours</h3>
              <div className="space-y-3 mb-8">
                {offresActives.map((o) => {
                  const statut = OFFRE_STATUT[o.statut] ?? { label: o.statut, cls: "bg-asphalte-3 text-blanc-dim" };
                  return (
                    <div key={o.id} className="card flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold">#{o.demande?.numero} — {o.demande?.depart_adresse} → {o.demande?.arrivee_adresse}</p>
                        <p className="font-mono text-xs text-blanc-faint mt-1.5">
                          Votre offre : <strong className="text-blanc">{eur(o.prix_ttc)}</strong> · {o.vehicule_type} {o.vehicule_places} pl. · envoyée le {new Date(o.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <span className={`tag ${statut.cls}`}>{statut.label}</span>
                    </div>
                  );
                })}
                {offresActives.length === 0 && <p className="text-blanc-dim text-sm">Aucun devis en cours.</p>}
              </div>

              <h3 className="h-display text-xl mb-4">Enchères en cours</h3>
              <div className="space-y-3 mb-8">
                {encheres.filter((e) => e.demande?.statut === "ouverte" && (!e.demande?.enchere_fin || new Date(e.demande.enchere_fin) > now)).map((e, i) => (
                  <Link key={i} href={`/pro/leads/${e.demande?.id}`} className="card flex items-center justify-between gap-4 flex-wrap hover:border-ligne-strong transition">
                    <div>
                      <p className="font-semibold">#{e.demande?.numero} — {e.demande?.depart_adresse} → {e.demande?.arrivee_adresse}</p>
                      <p className="font-mono text-xs text-blanc-faint mt-1.5">Votre meilleure relance : <strong className="text-blanc">{eur(e.mienne)}</strong> ({e.nb} relance{e.nb > 1 ? "s" : ""})</p>
                    </div>
                    <span className="tag bg-vert-dim text-vert">En direct — relancer</span>
                  </Link>
                ))}
                {encheres.filter((e) => e.demande?.statut === "ouverte" && (!e.demande?.enchere_fin || new Date(e.demande.enchere_fin) > now)).length === 0 && <p className="text-blanc-dim text-sm">Aucune enchère en cours.</p>}
              </div>

              <details className="card p-0 overflow-hidden group">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 hover:bg-asphalte-2 transition">
                  <span className="font-semibold">Archives</span>
                  <span className="font-mono text-xs text-blanc-faint">{offresArchivees.length + encheres.filter((e) => !(e.demande?.statut === "ouverte" && (!e.demande?.enchere_fin || new Date(e.demande.enchere_fin) > now))).length} offre(s) passée(s) ▾</span>
                </summary>
                <div className="border-t border-ligne p-5 space-y-3">
                  {offresArchivees.map((o) => {
                    const statut = OFFRE_STATUT[o.statut] ?? { label: o.statut, cls: "bg-asphalte-3 text-blanc-dim" };
                    return (
                      <div key={o.id} className="border border-ligne rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap opacity-80">
                        <div>
                          <p className="font-semibold">#{o.demande?.numero} — {o.demande?.depart_adresse} → {o.demande?.arrivee_adresse}</p>
                          <p className="font-mono text-xs text-blanc-faint mt-1.5">{eur(o.prix_ttc)} · {new Date(o.created_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <span className={`tag ${statut.cls}`}>{statut.label}</span>
                      </div>
                    );
                  })}
                  {encheres.filter((e) => !(e.demande?.statut === "ouverte" && (!e.demande?.enchere_fin || new Date(e.demande.enchere_fin) > now))).map((e, i) => (
                    <div key={`archive-enchere-${i}`} className="border border-ligne rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap opacity-80">
                      <div>
                        <p className="font-semibold">#{e.demande?.numero} — {e.demande?.depart_adresse} → {e.demande?.arrivee_adresse}</p>
                        <p className="font-mono text-xs text-blanc-faint mt-1.5">Meilleure relance : <strong className="text-blanc">{eur(e.mienne)}</strong> · {e.nb} relance{e.nb > 1 ? "s" : ""}</p>
                      </div>
                      <span className="tag bg-asphalte-3 text-blanc-faint">Enchère terminée</span>
                    </div>
                  ))}
                  {offresArchivees.length === 0 && encheres.filter((e) => !(e.demande?.statut === "ouverte" && (!e.demande?.enchere_fin || new Date(e.demande.enchere_fin) > now))).length === 0 && <p className="text-blanc-dim text-sm">Aucune offre archivée.</p>}
                </div>
              </details>
            </div>,

            /* ---------- MES MISSIONS ---------- */
            <div key="m">
              <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                <div>
                  <h2 className="h-display text-2xl mb-1">Mes missions</h2>
                  <p className="text-sm text-blanc-dim">Les missions terminées, annulées ou dont la date est passée sont archivées automatiquement.</p>
                </div>
                <span className="tag bg-vert-dim text-vert">{missionsActives.length} à venir</span>
              </div>

              <div className="space-y-3">
                {missionsActives.map((m) => (
                  <div key={m.id} className="card">
                    <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
                      <div>
                        <Link href={`/pro/missions/${m.id}`} className="font-semibold hover:text-ambre transition inline-block">
                          {m.demande ? `#${m.demande.numero} — ${m.demande.depart_adresse} → ${m.demande.arrivee_adresse}` : `${m.retour?.depart_adresse} → ${m.retour?.arrivee_adresse}`}
                        </Link>
                        <p className="mt-2 flex gap-2 flex-wrap">
                          {m.source === "retour_vide" && <span className="tag bg-ambre-dim text-ambre whitespace-nowrap">Retour à vide</span>}
                          <span className="tag whitespace-nowrap bg-vert-dim text-vert">À venir</span>
                        </p>
                        <p className="font-mono text-xs text-blanc-faint mt-1.5">
                          {(m.demande?.date_aller || m.retour?.date_dispo) && new Date(m.demande?.date_aller ?? m.retour?.date_dispo).toLocaleDateString("fr-FR")} · {m.demande?.passagers ?? m.retour?.places} pax · prix {eur(m.prix_final)} · commission <strong className="text-ambre">{eur(m.commission_montant)}</strong> ({m.commission_taux} %)
                        </p>
                        <p className="font-mono text-xs text-blanc mt-2">Contact client : {m.client?.nom ?? "—"} · {m.client?.telephone ?? "tél. non renseigné"}{m.client?.email ? ` · ${m.client.email}` : ""}</p>
                        <Link href={`/pro/missions/${m.id}`} className="inline-block mt-3 font-mono text-[11px] uppercase tracking-wider text-blanc-dim hover:text-blanc transition">Voir la mission →</Link>
                      </div>
                      {m.statut === "a_venir" && (
                        <div className="flex gap-2 shrink-0 whitespace-nowrap sm:justify-end">
                          <DeclarerTerminee missionId={m.id} />
                          <AnnulerMission missionId={m.id} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {missionsActives.length === 0 && <p className="text-blanc-dim text-sm">Aucune mission à venir.</p>}
              </div>

              <details className="card p-0 overflow-hidden mt-6">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 hover:bg-asphalte-2 transition">
                  <span className="font-semibold">Archives</span>
                  <span className="font-mono text-xs text-blanc-faint">{missionsArchivees.length} mission(s) passée(s) ▾</span>
                </summary>
                <div className="border-t border-ligne p-5 space-y-3">
                  {missionsArchivees.map((m) => (
                    <div key={m.id} className="border border-ligne rounded-lg p-4 opacity-80">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <Link href={`/pro/missions/${m.id}`} className="font-semibold hover:text-ambre transition inline-block">
                            {m.demande ? `#${m.demande.numero} — ${m.demande.depart_adresse} → ${m.demande.arrivee_adresse}` : `${m.retour?.depart_adresse} → ${m.retour?.arrivee_adresse}`}
                          </Link>
                          <p className="font-mono text-xs text-blanc-faint mt-1.5">
                            {(m.demande?.date_aller || m.retour?.date_dispo) && new Date(m.demande?.date_aller ?? m.retour?.date_dispo).toLocaleDateString("fr-FR")} · prix {eur(m.prix_final)}
                          </p>
                        </div>
                        <span className={`tag ${m.statut === "annulee" ? "bg-[#3a2020] text-[#E8735D]" : "bg-asphalte-3 text-blanc-dim"}`}>
                          {m.statut === "terminee_declaree" ? "Terminée" : m.statut === "annulee" ? "Annulée" : m.statut === "a_venir" ? "Date passée" : m.statut}
                        </span>
                      </div>
                      {m.statut === "a_venir" && (
                        <div className="mt-3 flex gap-2"><DeclarerTerminee missionId={m.id} /><AnnulerMission missionId={m.id} /></div>
                      )}
                      {m.statut === "terminee_declaree" && <p className="font-mono text-[11px] text-blanc-faint mt-3">En attente d&apos;avis client</p>}
                    </div>
                  ))}
                  {missionsArchivees.length === 0 && <p className="text-blanc-dim text-sm">Aucune mission archivée.</p>}
                </div>
              </details>
            </div>,

            /* ---------- MES RETOURS À VIDE ---------- */
            <div key="r">
              <PublierRetour transporteurId={user!.id} />
              <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
                <div>
                  <h2 className="h-display text-2xl mb-1">Mes retours à vide</h2>
                  <p className="text-sm text-blanc-dim">Les retours arrivés à échéance ou annulés sont archivés automatiquement.</p>
                </div>
                <span className="tag bg-vert-dim text-vert">{retoursActifs.length} actif(s)</span>
              </div>

              <div className="space-y-3">
                {retoursActifs.map((r) => (
                  <div key={r.id} className="card">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-1">
                      <p className="font-semibold">{r.depart_adresse} → {r.arrivee_adresse}<span className="ml-2.5 tag bg-ambre-dim text-ambre">{eur(r.prix_fixe)}</span></p>
                      <span className={`tag ${["publie", "demande_recue"].includes(r.statut) ? "bg-vert-dim text-vert" : "bg-asphalte-3 text-blanc-faint"}`}>
                        {r.statut === "publie" ? "En ligne" : r.statut === "demande_recue" ? "Demande reçue" : r.statut === "confirme" ? "Confirmé" : r.statut}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-blanc-faint mb-3">{new Date(r.date_dispo).toLocaleDateString("fr-FR")}{r.heure_apres ? `, départ après ${String(r.heure_apres).slice(0, 5)}` : ""} · {r.places} places</p>
                    {(r.reservations ?? []).map((resa: any) => (
                      <div key={resa.id} className="border-t border-ligne pt-3 mt-2 flex items-center justify-between gap-4 flex-wrap">
                        <p className="font-mono text-xs text-blanc-dim">
                          {resa.statut === "en_attente" && <>Demande de réservation du trajet — client anonyme jusqu&apos;à votre validation</>}
                          {resa.statut === "validee" && <>Réservation validée ✓ — {resa.client?.nom ?? "client"} · {resa.client?.telephone ?? "tél. non renseigné"}{resa.client?.email ? ` · ${resa.client.email}` : ""}</>}
                          {resa.statut === "refusee" && <>Demande refusée</>}
                        </p>
                        {resa.statut === "en_attente" && <ReservationActions reservationId={resa.id} retourId={r.id} />}
                      </div>
                    ))}
                  </div>
                ))}
                {retoursActifs.length === 0 && <p className="text-blanc-dim text-sm">Aucun retour à vide actif.</p>}
              </div>

              <details className="card p-0 overflow-hidden mt-6">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 hover:bg-asphalte-2 transition">
                  <span className="font-semibold">Archives</span>
                  <span className="font-mono text-xs text-blanc-faint">{retoursArchives.length} retour(s) passé(s) ▾</span>
                </summary>
                <div className="border-t border-ligne p-5 space-y-3">
                  {retoursArchives.map((r) => (
                    <div key={r.id} className="border border-ligne rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap opacity-80">
                      <div>
                        <p className="font-semibold">{r.depart_adresse} → {r.arrivee_adresse}</p>
                        <p className="font-mono text-xs text-blanc-faint mt-1.5">{new Date(r.date_dispo).toLocaleDateString("fr-FR")} · {r.places} places · {eur(r.prix_fixe)}</p>
                      </div>
                      <span className="tag bg-asphalte-3 text-blanc-faint">{r.statut === "annule" ? "Annulé" : r.statut === "expire" ? "Expiré" : "Date passée"}</span>
                    </div>
                  ))}
                  {retoursArchives.length === 0 && <p className="text-blanc-dim text-sm">Aucun retour archivé.</p>}
                </div>
              </details>
            </div>,
            /* ---------- AVIS CLIENTS ---------- */
            <div key="a">
              <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                <div>
                  <h2 className="h-display text-2xl mb-1">Avis clients</h2>
                  <p className="text-sm text-blanc-dim">
                    Les avis laissés après une mission réalisée apparaissent ici.
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-semibold text-ambre">
                    ★ {noteMoyenneAvis ?? "—"}/5
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">
                    {A.length} avis reçu{A.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {A.map((a) => {
                  const trajet = a.mission?.demande;
                  return (
                    <div key={a.id} className="card">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <p className="font-mono text-lg tracking-wide text-ambre" aria-label={`${a.note} étoiles sur 5`}>
                            {"★".repeat(Number(a.note))}
                            <span className="text-blanc-faint">{"★".repeat(5 - Number(a.note))}</span>
                          </p>
                          <p className="font-semibold mt-2">{a.client?.nom ?? "Client DealBus"}</p>
                        </div>
                        <p className="font-mono text-[11px] text-blanc-faint">
                          {new Date(a.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>

                      {a.commentaire ? (
                        <p className="mt-4 text-sm leading-6 text-blanc-dim whitespace-pre-line">
                          “{a.commentaire}”
                        </p>
                      ) : (
                        <p className="mt-4 text-sm text-blanc-faint italic">Aucun commentaire laissé.</p>
                      )}

                      {trajet && (
                        <div className="border-t border-ligne mt-4 pt-3">
                          <p className="font-mono text-[11px] text-blanc-faint">
                            Mission #{trajet.numero} · {trajet.depart_adresse} → {trajet.arrivee_adresse}
                            {trajet.date_aller ? ` · ${new Date(trajet.date_aller).toLocaleDateString("fr-FR")}` : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {A.length === 0 && (
                  <div className="card py-10 text-center">
                    <p className="font-semibold mb-1">Aucun avis pour le moment</p>
                    <p className="text-sm text-blanc-dim">
                      Les avis apparaîtront ici dès qu’un client aura évalué une mission terminée.
                    </p>
                  </div>
                )}
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