import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import type { Demande } from "@/lib/types";
import { DevisForm } from "./devis-form";
import { EnchereForm } from "./enchere-form";
import { ItineraireMap } from "@/components/ItineraireMap";
import { Messagerie } from "@/components/Messagerie";
import { calcItineraire } from "@/lib/itineraire";
import {
  ORGANISMES, EQUIPEMENTS, TARIFS_DEFAUT, BAREME,
  analyser, planifier, fmtDuree, eur, gabaritPour,
  type Tarifs,
} from "@/lib/assistant-demande";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: demande } = await supabase.from("demandes").select("*").eq("id", id).single();
  if (!demande) notFound();
  const d = demande as Demande;

  // Profil transporteur : dépôt + tarifs (pour le haut-le-pied et le calculateur)
  const { data: moi } = await supabase
    .from("transporteurs")
    .select("depot_adresse, cout_km, cout_heure, cout_nuit, cout_immobilisation, marge_pct")
    .eq("id", user!.id).maybeSingle();
  const tarifs: Tarifs = {
    cout_km: Number(moi?.cout_km ?? TARIFS_DEFAUT.cout_km),
    cout_heure: Number(moi?.cout_heure ?? TARIFS_DEFAUT.cout_heure),
    cout_nuit: Number(moi?.cout_nuit ?? TARIFS_DEFAUT.cout_nuit),
    cout_immobilisation: Number(moi?.cout_immobilisation ?? TARIFS_DEFAUT.cout_immobilisation),
    marge_pct: Number(moi?.marge_pct ?? TARIFS_DEFAUT.marge_pct),
  };

  // Mission conclue avec moi ? (identités révélées → messagerie sans filtre)
  const { data: maMission } = await supabase
    .from("missions").select("id").eq("demande_id", id).eq("transporteur_id", user!.id).maybeSingle();

  // Devis déjà envoyé ? (tir unique)
  const { data: monOffre } = await supabase
    .from("offres").select("prix_ttc").eq("demande_id", id).eq("transporteur_id", user!.id).maybeSingle();

  // Meilleure enchère actuelle (module en suspens, conservé)
  const { data: bestBid } = await supabase
    .from("bids").select("prix_ttc").eq("demande_id", id).order("prix_ttc", { ascending: true }).limit(1).maybeSingle();

  // ---------- Calculs : km client, haut-le-pied depuis le dépôt ----------
  let km: number | null = d.distance_km ? Number(d.distance_km) : null;
  if (!km) {
    const itin = await calcItineraire(d.depart_adresse, d.arrivee_adresse);
    km = itin?.km ?? null;
  }
  let hlpAller: number | null = null, hlpRetour: number | null = null;
  if (moi?.depot_adresse && km) {
    const [a, b] = await Promise.all([
      calcItineraire(moi.depot_adresse, d.depart_adresse),
      d.type_trajet === "aller_simple" ? calcItineraire(d.arrivee_adresse, moi.depot_adresse) : null,
    ]);
    hlpAller = a?.km ?? null;
    hlpRetour = d.type_trajet === "aller_simple" ? (b?.km ?? null) : hlpAller;
  }

  const entree = {
    type_trajet: d.type_trajet, km,
    date_aller: String(d.date_aller), heure_aller: d.heure_aller ? String(d.heure_aller).slice(0, 5) : "",
    date_retour: d.date_retour ? String(d.date_retour) : "", heure_retour: d.heure_retour ? String(d.heure_retour).slice(0, 5) : "",
    passagers: d.passagers, vehicule_utilise_sur_place: !!d.vehicule_utilise_sur_place,
  };
  const analyse = analyser(entree);
  const plan = planifier(entree, hlpAller, hlpRetour);
  const gabarit = gabaritPour(d.passagers);
  const hFr = (h: string | null | undefined) => (h ? String(h).slice(0, 5).replace(":", "h") : "");

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-7 py-14">
        <div className="w-full mb-8"><BackButton href="/pro" /></div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={d.mode === "enchere" ? "tag-enchere" : "tag-devis"}>{d.mode === "enchere" ? "Enchère" : "Devis"}</span>
          {d.organisme && <span className="tag bg-ambre-dim text-ambre-fort">{ORGANISMES.find((o) => o.id === d.organisme)?.label}</span>}
          {typeof d.completude === "number" && d.completude > 0 && (
            <span className={`tag ${d.completude >= 70 ? "bg-vert-dim text-vert" : "bg-asphalte-3 text-blanc-dim"}`}>Demande complète {d.completude} %</span>
          )}
          <span className="font-mono text-[11px] text-blanc-faint ml-auto">Demande #{d.numero} · client anonyme</span>
        </div>
        <h1 className="h-display text-4xl mb-2">{d.depart_adresse} → {d.arrivee_adresse}</h1>
        <p className="font-mono text-xs text-blanc-faint mb-8">
          {new Date(d.date_aller).toLocaleDateString("fr-FR")}{d.heure_aller ? ` à ${hFr(d.heure_aller)}` : ""}
          {d.date_retour ? ` → ${new Date(d.date_retour).toLocaleDateString("fr-FR")}${d.heure_retour ? ` à ${hFr(d.heure_retour)}` : ""}` : ""}
          {" "}· {d.passagers} passagers · {d.type_trajet.replace("_", "-")}
          {d.type_trajet !== "aller_simple" && d.sur_place_repondu ? (d.vehicule_utilise_sur_place ? " · car sur place" : " · dépose puis reprise") : ""}
        </p>

        {/* ---------- Chiffres clés ---------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card py-4"><p className="h-display text-3xl">{km ? `${km} km` : "—"}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Aller, prise en charge → destination</p></div>
          <div className="card py-4"><p className="h-display text-3xl text-ambre">{plan.hautLePiedKm !== null ? `${plan.hautLePiedKm} km` : "—"}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">{moi?.depot_adresse ? "Haut-le-pied depuis votre dépôt" : "Haut-le-pied (dépôt non renseigné)"}</p></div>
          <div className="card py-4"><p className="h-display text-3xl">{plan.kmTotal !== null ? `${plan.kmTotal} km` : "—"}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Kilométrage total estimé</p></div>
          <div className="card py-4"><p className={`h-display text-3xl ${plan.deuxConducteurs ? "text-[#E8735D]" : "text-vert"}`}>{plan.deuxConducteurs ? "2 conducteurs" : "1 conducteur"}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">{plan.deuxConducteurs ? "Probables, selon vos horaires" : "Suffisant sur chaque journée"}</p></div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5 mb-8">
          <div className="card text-sm">
            <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mb-4">Ce que DealBus a calculé</p>
            <dl className="divide-y divide-ligne">
              {plan.journees.map((j) => (
                <div key={j.titre} className="grid sm:grid-cols-[130px_1fr] gap-x-4 py-2.5">
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint pt-0.5">{j.titre}</dt>
                  <dd>{j.detail}<span className="block font-mono text-[11px] text-blanc-faint mt-0.5">amplitude {fmtDuree(j.amplitudeMin)} · conduite {fmtDuree(j.conduiteMin)}</span></dd>
                </div>
              ))}
              {analyse.nuits > 0 && (
                <div className="grid sm:grid-cols-[130px_1fr] gap-x-4 py-2.5">
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint pt-0.5">Nuit{analyse.nuits > 1 ? "s" : ""}</dt>
                  <dd>{analyse.nuits} sur place{d.vehicule_utilise_sur_place ? ", car et conducteur restent" : ", le car ne reste pas : deux trajets séparés"}.</dd>
                </div>
              )}
              <div className="grid sm:grid-cols-[130px_1fr] gap-x-4 py-2.5">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint pt-0.5">Réglementation</dt>
                <dd>
                  <span className={`tag ${plan.deuxConducteurs ? "bg-ambre-dim text-ambre-fort" : "bg-vert-dim text-vert"}`}>{plan.deuxConducteurs ? "À vérifier" : "Conforme"}</span>
                  <span className="ml-2 text-blanc-dim">{plan.deuxConducteurs
                    ? `Plus de ${BAREME.conduiteMaxJourMin / 60} h de conduite ou ${BAREME.amplitudeMaxJourMin / 60} h d'amplitude sur une journée : prévoir un second conducteur ou un découcher.`
                    : "Temps de conduite et d'amplitude tenables avec un seul conducteur, pauses comprises."}</span>
                </dd>
              </div>
              <div className="grid sm:grid-cols-[130px_1fr] gap-x-4 py-2.5">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint pt-0.5">Péages estimés</dt>
                <dd>{plan.peages ? `environ ${eur(plan.peages)} sur l'ensemble` : "—"}</dd>
              </div>
              <div className="grid sm:grid-cols-[130px_1fr] gap-x-4 py-2.5">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint pt-0.5">Gabarit</dt>
                <dd>{d.passagers} passagers : {gabarit?.label ?? "—"}{d.equipements?.includes("soute") ? ", bagages en soute" : ""}</dd>
              </div>
            </dl>
            {!moi?.depot_adresse && (
              <p className="mt-4 text-[12.5px] text-blanc-dim bg-ambre-dim border border-ambre/40 rounded-sm px-3.5 py-2.5">
                Renseignez l&apos;adresse de votre dépôt dans <strong>Mon profil → Paramètres de devis</strong> pour un haut-le-pied calculé sur votre situation réelle (ici : forfait {BAREME.hautLePiedKm} km).
              </p>
            )}
          </div>

          <div className="space-y-5">
            <div className="card text-sm">
              <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mb-4">Ce que le client a précisé</p>
              <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint pt-0.5">Groupe</dt>
                <dd>{ORGANISMES.find((o) => o.id === d.organisme)?.label ?? "Non précisé"}{d.motif ? ` · ${d.motif}` : ""}</dd>
                {d.heure_arrivee && (<><dt className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint pt-0.5">Arrivée souhaitée</dt><dd>{hFr(d.heure_arrivee)}</dd></>)}
                <dt className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint pt-0.5">Équipements</dt>
                <dd>{d.equipements?.length ? d.equipements.map((e) => EQUIPEMENTS.find((x) => x.id === e)?.label ?? e).join(" · ") : "Aucun équipement particulier"}</dd>
                {d.precisions && (<><dt className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint pt-0.5">Précisions</dt><dd className="whitespace-pre-line text-blanc-dim">« {d.precisions} »</dd></>)}
              </dl>
            </div>
            <div className="sombre rounded p-5">
              <p className="font-mono text-[10.5px] uppercase tracking-[.14em] text-ambre mb-2">Repère de marché</p>
              <p className="h-display text-3xl text-ambre">{analyse.fourchette ? `${eur(analyse.fourchette.min)} à ${eur(analyse.fourchette.max)}` : "—"}</p>
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint mt-1">Fourchette indicative TTC montrée au client</p>
              <p className="text-[12.5px] text-blanc-dim mt-3 leading-snug">Le client a vu cette fourchette en déposant sa demande. Une offre claire sur ce qui est inclus fait souvent la différence.</p>
            </div>
          </div>
        </div>

        <ItineraireMap depart={d.depart_adresse} arrivee={d.arrivee_adresse} allerRetour={d.type_trajet === "aller_retour"} montrerTemps />

        <div className="mt-8 mb-8">
          <h2 className="h-display text-2xl mb-1">Une question au client ?</h2>
          <p className="text-sm text-blanc-dim mb-4">Horaires, parking, hôtel du groupe, matériel… Le client reçoit aussi votre message par email. Le prix, lui, passe par votre offre.</p>
          <Messagerie demandeId={id} transporteurId={user!.id} role="transporteur"
            interlocuteur={`Client de la demande #${d.numero}`} anonyme={!maMission} />
        </div>

        <div className="mt-8">
          {d.mode === "devis" ? (
            monOffre ? (
              <div className="card">
                <p className="flex items-center gap-2.5 text-sm text-blanc-dim">
                  <span className="w-1.5 h-1.5 rounded-full bg-vert" />
                  Offre envoyée : <strong className="font-mono">{Number(monOffre.prix_ttc).toLocaleString("fr-FR")} €</strong>
                  — en attente de la décision du client.
                </p>
              </div>
            ) : (
              <DevisForm demandeId={id} plan={plan} tarifs={tarifs} nbVehicules={gabarit?.nbVehicules ?? 1}
                fourchette={analyse.fourchette} nuitsSurPlace={plan.nuits > 0} />
            )
          ) : (
            <EnchereForm demandeId={id} enchereFin={d.enchere_fin} bestPrix={bestBid?.prix_ttc ?? null} />
          )}
        </div>
      </main>
    </>
  );
}
