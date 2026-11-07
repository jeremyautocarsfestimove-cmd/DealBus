import { notFound } from "next/navigation";
import Link from "next/link";
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
import { fmtKm, kmTransport } from "@/lib/calibration-prix";
import { ville, jourCourt, joursAvant } from "@/lib/pro";
import { estimerFourchette, repereKm } from "@/lib/calibration-serveur";

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
  // Itinéraire client : toujours recalculé (durée OSRM), en cache 24 h côté fetch
  const itin = await calcItineraire(d.depart_adresse, d.arrivee_adresse);
  const km: number | null = itin?.km ?? (d.distance_km ? Number(d.distance_km) : null);
  const routeMin: number | null = itin?.minutes ?? null;
  let hlpAller: number | null = null, hlpRetour: number | null = null;
  let hlpAllerMin: number | null = null, hlpRetourMin: number | null = null;
  if (moi?.depot_adresse && km) {
    const [a, b] = await Promise.all([
      calcItineraire(moi.depot_adresse, d.depart_adresse),
      d.type_trajet === "aller_simple" ? calcItineraire(d.arrivee_adresse, moi.depot_adresse) : null,
    ]);
    hlpAller = a?.km ?? null; hlpAllerMin = a?.minutes ?? null;
    hlpRetour = d.type_trajet === "aller_simple" ? (b?.km ?? null) : hlpAller;
    hlpRetourMin = d.type_trajet === "aller_simple" ? (b?.minutes ?? null) : hlpAllerMin;
  }

  const entree = {
    type_trajet: d.type_trajet, km, routeMin,
    date_aller: String(d.date_aller), heure_aller: d.heure_aller ? String(d.heure_aller).slice(0, 5) : "",
    date_retour: d.date_retour ? String(d.date_retour) : "", heure_retour: d.heure_retour ? String(d.heure_retour).slice(0, 5) : "",
    passagers: d.passagers, vehicule_utilise_sur_place: !!d.vehicule_utilise_sur_place,
  };
  const analyse = analyser(entree);
  const fourchette = await estimerFourchette(analyse, d.type_trajet);
  const repere = await repereKm(analyse.km, d.type_trajet);
  const kmT = analyse.km ? kmTransport(analyse.km, d.type_trajet) : null;
  const plan = planifier(entree, hlpAller, hlpRetour, hlpAllerMin, hlpRetourMin);
  const gabarit = gabaritPour(d.passagers);
  const hFr = (h: string | null | undefined) => (h ? String(h).slice(0, 5).replace(":", "h") : "");

  const typeLib = d.type_trajet === "aller_simple" ? "aller simple" : d.type_trajet === "circuit" ? "circuit" : "aller-retour";
  const surPlace = d.type_trajet !== "aller_simple" && d.sur_place_repondu ? (d.vehicule_utilise_sur_place ? "car sur place" : "dépose puis reprise") : null;
  const jours = joursAvant(String(d.date_aller));
  const Ligne = ({ t, children }: { t: string; children: React.ReactNode }) => (
    <div className="grid sm:grid-cols-[110px_1fr] gap-x-4 py-2.5 border-t border-ligne first:border-0"><dt className="text-[12px] text-[#8A8882] pt-0.5">{t}</dt><dd className="text-[13px]">{children}</dd></div>
  );

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="min-w-0">
          <p className="text-[12.5px] text-[#77756F] mb-2"><Link href="/pro" className="hover:underline">← Demandes</Link> · Demande #{d.numero} · {maMission ? "mission confirmée avec vous" : "client anonyme jusqu'à l'acceptation"}</p>
          <h1 className="h-display text-4xl truncate" title={`${d.depart_adresse} → ${d.arrivee_adresse}`}>{ville(d.depart_adresse)} → {ville(d.arrivee_adresse)}</h1>
          <p className="text-blanc-dim mt-1.5">
            {jourCourt(String(d.date_aller))}{d.heure_aller ? ` ${hFr(d.heure_aller)}` : ""}{d.date_retour && d.date_retour !== d.date_aller ? ` → ${jourCourt(String(d.date_retour))}${d.heure_retour ? ` ${hFr(d.heure_retour)}` : ""}` : ""}
            {" "}· {d.passagers} passagers · {typeLib}{surPlace ? `, ${surPlace}` : ""}{d.organisme ? ` · ${ORGANISMES.find((o) => o.id === d.organisme)?.label}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {d.mode === "enchere" && <span className="tag-enchere">Enchère</span>}
          <span className={`tag ${jours <= 7 ? "bg-[#FDE8E4] text-[#C2410C]" : "bg-[#F1F0ED] text-[#55534E]"}`}>{jours <= 0 ? "Départ aujourd'hui" : jours === 1 ? "Départ demain" : `Départ dans ${jours} jours`}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
        {/* ---------- Colonne gauche : le besoin ---------- */}
        <div className="space-y-4 min-w-0">
          <div className="card p-0 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-4">
              {[
                ["Aller", `${jourCourt(String(d.date_aller))}${d.heure_aller ? ` · ${hFr(d.heure_aller)}` : ""}`],
                ["Retour", d.type_trajet === "aller_simple" ? "aucun" : `${jourCourt(String(d.date_retour ?? d.date_aller))}${d.heure_retour ? ` · ${hFr(d.heure_retour)}` : ""}`],
                ["Distance aller", km ? `${km} km${analyse.routeMin ? ` · ${fmtDuree(analyse.routeMin)}` : ""}` : "—"],
                ["Gabarit conseillé", gabarit?.label ?? "—"],
                ["Haut-le-pied", plan.hautLePiedKm !== null ? `${plan.hautLePiedKm} km${hlpAller !== null && hlpRetour !== null ? ` (${hlpAller} + ${hlpRetour})` : " (forfait)"}` : "—"],
                ["Kilométrage total", plan.kmTotal !== null ? `${plan.kmTotal} km` : "—"],
                ["Péages estimés", plan.peages ? `≈ ${eur(plan.peages)}` : "—"],
                ["Conducteurs", plan.deuxConducteurs ? "2 probables" : "1 suffit"],
              ].map(([l, v], i) => (
                <div key={l} className="bg-[#FAFAF8] rounded-lg px-3 py-2.5"><p className="text-[11.5px] text-[#8A8882]">{l}</p><p className={`text-[13.5px] font-semibold mt-0.5 ${i === 7 && plan.deuxConducteurs ? "text-[#C2410C]" : ""}`}>{v}</p></div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-ligne">
              <h2 className="text-[14px] font-semibold mb-2">Ce que DealBus a calculé</h2>
              {analyse.horairesIncoherents && (
                <p className="mb-3 text-[12.5px] bg-[#FDE8E4] rounded-lg px-3.5 py-2.5 text-[#7A2E1C]"><strong>Horaires du client incohérents</strong> : le retour est prévu avant l&apos;arrivée. Le plan suppose 2 h sur place ; demandez confirmation au client avant de chiffrer.</p>
              )}
              <dl>
                {plan.journees.map((j) => <Ligne key={j.titre} t={j.titre}>{j.detail}<span className="block text-[12px] text-[#8A8882] mt-0.5">amplitude {fmtDuree(j.amplitudeMin)} · conduite {fmtDuree(j.conduiteMin)}</span></Ligne>)}
                {analyse.nuits > 0 && <Ligne t={`Nuit${analyse.nuits > 1 ? "s" : ""}`}>{analyse.nuits} sur place{d.vehicule_utilise_sur_place ? ", car et conducteur restent" : ", le car ne reste pas : deux trajets séparés"}.</Ligne>}
                <Ligne t="Gabarit">{d.passagers} passagers : {gabarit?.label ?? "—"}{d.equipements?.includes("soute") ? ", bagages en soute" : ""}</Ligne>
              </dl>
              {plan.deuxConducteurs && (
                <div className="mt-3 flex gap-2.5 bg-[#FFF8EA] border border-[#F7E1B5] rounded-lg px-3.5 py-2.5 text-[12.5px] text-[#7A5413]">
                  <span>⚠</span><span>Plus de {BAREME.conduiteMaxJourMin / 60} h de conduite ou {BAREME.amplitudeMaxJourMin / 60} h d&apos;amplitude sur une journée : prévoir un second conducteur ou un découcher. Vous pouvez proposer un autre horaire au client depuis la messagerie.</span>
                </div>
              )}
              {!moi?.depot_adresse && (
                <p className="mt-3 text-[12.5px] text-[#55534E] bg-[#FAFAF8] rounded-lg px-3.5 py-2.5">Renseignez l&apos;adresse de votre dépôt dans <Link href="/pro/profil" className="font-semibold underline">Mon entreprise</Link> pour un haut-le-pied calculé sur votre situation réelle (ici : forfait {BAREME.hautLePiedKm} km).</p>
              )}
            </div>
            <div className="px-5 py-4 border-t border-ligne">
              <h2 className="text-[14px] font-semibold mb-2">Ce que le client a précisé</h2>
              <dl>
                <Ligne t="Groupe">{ORGANISMES.find((o) => o.id === d.organisme)?.label ?? "Non précisé"}{d.motif ? ` · ${d.motif}` : ""}</Ligne>
                {d.heure_arrivee && <Ligne t="Arrivée souhaitée">{hFr(d.heure_arrivee)}</Ligne>}
                <Ligne t="Équipements">{d.equipements?.length ? d.equipements.map((e) => EQUIPEMENTS.find((x) => x.id === e)?.label ?? e).join(" · ") : "Aucun équipement particulier"}</Ligne>
                {d.precisions && <Ligne t="Précisions"><span className="whitespace-pre-line text-[#3A3936]">« {d.precisions} »</span></Ligne>}
                <Ligne t="Adresses"><span className="text-[#55534E]">{d.depart_adresse} → {d.arrivee_adresse}</span></Ligne>
              </dl>
            </div>
          </div>

          <div className="card p-0 overflow-hidden"><ItineraireMap depart={d.depart_adresse} arrivee={d.arrivee_adresse} allerRetour={d.type_trajet === "aller_retour"} montrerTemps /></div>

          <div className="card">
            <h2 className="text-[14px] font-semibold">Questions au client <span className="text-[12px] text-[#9A9893] font-normal">· dans la plateforme, copie par email{maMission ? "" : ", coordonnées masquées"}</span></h2>
            <p className="text-[12.5px] text-blanc-dim mt-1 mb-4">Horaires, parking, hôtel du groupe, matériel… Le prix, lui, passe par votre offre.</p>
            <Messagerie demandeId={id} transporteurId={user!.id} role="transporteur" interlocuteur={`Client de la demande #${d.numero}`} anonyme={!maMission} />
          </div>
        </div>

        {/* ---------- Colonne droite : l'offre ---------- */}
        <div className="lg:sticky lg:top-[70px] space-y-4">
          {d.mode === "devis" ? (
            monOffre ? (
              <div className="card">
                <h2 className="text-[15px] font-semibold">Votre offre est envoyée</h2>
                <p className="text-[28px] font-semibold tracking-tight mt-2">{Number(monOffre.prix_ttc).toLocaleString("fr-FR")} €</p>
                <p className="text-[12.5px] text-blanc-dim mt-1">En attente de la décision du client. Vous serez prévenu par email.</p>
                {fourchette && <p className="text-[12px] text-[#9A9893] mt-3 pt-3 border-t border-ligne">Repère observé : {eur(fourchette.min)} à {eur(fourchette.max)}</p>}
              </div>
            ) : (
              <DevisForm demandeId={id} plan={plan} tarifs={tarifs} nbVehicules={gabarit?.nbVehicules ?? 1}
                fourchette={fourchette ? { min: fourchette.min, max: fourchette.max } : null} nuitsSurPlace={plan.nuits > 0} />
            )
          ) : (
            <EnchereForm demandeId={id} enchereFin={d.enchere_fin} bestPrix={bestBid?.prix_ttc ?? null} />
          )}
          {repere && kmT && (
            <div className="card">
              <p className="text-[12px] text-[#77756F] font-medium">Prix au km observé, par car</p>
              <p className="text-[18px] font-semibold mt-1">{fmtKm(repere.p25)} à {fmtKm(repere.p75)}</p>
              <p className="text-[12px] text-[#77756F] mt-1">Médiane {fmtKm(repere.p50)} × {kmT} km ({d.type_trajet === "aller_simple" ? "aller" : "aller + retour"}){(analyse.gabarit?.nbVehicules ?? 1) > 1 ? ` × ${analyse.gabarit?.nbVehicules} cars` : ""} = {eur(Math.round(repere.p50 * kmT * (analyse.gabarit?.nbVehicules ?? 1)))} · {repere.n} devis de distance proche</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
