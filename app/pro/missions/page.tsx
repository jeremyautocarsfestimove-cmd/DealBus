import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contexteTransporteur, eur, jourCourt, ville, dateFuture } from "@/lib/pro";
import { DeclarerTerminee, AnnulerMission } from "../pro-actions";

export const metadata = { title: "Missions — DealBus" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function MissionsPage() {
  const ctx = await contexteTransporteur();
  if (!ctx?.transporteur || ctx.transporteur.statut !== "valide") redirect("/pro");
  const supabase = await createClient();
  const [{ data: missions }, { data: avis }] = await Promise.all([
    supabase.from("missions")
      .select("*, demande:demandes(numero, depart_adresse, arrivee_adresse, date_aller, date_retour, heure_aller, passagers), retour:retours_vide(depart_adresse, arrivee_adresse, date_dispo, places), client:profiles!missions_client_id_fkey(nom, telephone, email), facture:factures(statut)")
      .eq("transporteur_id", ctx.user.id).order("created_at", { ascending: false }),
    supabase.from("avis").select("mission_id, note").eq("transporteur_id", ctx.user.id),
  ]);
  const M = (missions ?? []) as any[];
  const avisPar = new Map(((avis ?? []) as any[]).map((a) => [a.mission_id, a.note]));
  const active = (m: any) => m.statut === "a_venir" && dateFuture(m.demande?.date_aller ?? m.retour?.date_dispo);
  const actives = M.filter(active);
  const archives = M.filter((m) => !active(m));

  // Avancement : acceptée → coordonnées → transport réalisé → facture réglée → avis
  const etapes = (m: any) => {
    const date = m.demande?.date_retour ?? m.demande?.date_aller ?? m.retour?.date_dispo;
    const passee = !dateFuture(date);
    const facture = Array.isArray(m.facture) ? m.facture[0] : m.facture;
    const liste = [
      { l: "Offre acceptée", ok: true },
      { l: "Coordonnées échangées", ok: true },
      { l: "Transport réalisé", ok: passee || m.statut === "terminee_declaree" },
      { l: "Commission réglée", ok: facture?.statut === "payee" },
      { l: "Avis reçu", ok: avisPar.has(m.id) },
    ];
    const cur = liste.findIndex((e) => !e.ok);
    return { liste, cur, libelle: cur === -1 ? "Terminée" : cur === 2 ? `Départ le ${jourCourt(m.demande?.date_aller ?? m.retour?.date_dispo)}` : liste[cur].l };
  };

  const Ligne = ({ m, estompe }: { m: any; estompe?: boolean }) => {
    const e = etapes(m);
    const enAttenteAnnul = m.annulation_demandee_at && !m.annulation_decision;
    return (
      <div className={`pro-lead ${estompe ? "opacity-75" : ""}`} style={{ gridTemplateColumns: "minmax(0,1fr) 180px 200px 170px" }}>
        <div className="min-w-0">
          <p className="pro-route">
            <Link href={`/pro/missions/${m.id}`} className="hover:underline">{m.demande ? <>{ville(m.demande.depart_adresse)}<i>→</i>{ville(m.demande.arrivee_adresse)}</> : <>{ville(m.retour?.depart_adresse ?? "")}<i>→</i>{ville(m.retour?.arrivee_adresse ?? "")}</>}</Link>
            {m.source === "retour_vide" && <span className="tag bg-[#FFF4E0] text-[#B26A00] ml-2 align-middle">Retour à vide</span>}
            {m.statut === "annulee" && <span className="tag bg-[#FDE8E4] text-[#C2410C] ml-2 align-middle">Annulée</span>}
            {m.statut === "litige" && <span className="tag bg-[#FDE8E4] text-[#C2410C] ml-2 align-middle">Litige</span>}
          </p>
          <div className="pro-meta">
            {m.demande && <span>#{m.demande.numero}</span>}
            <span><b>{jourCourt(m.demande?.date_aller ?? m.retour?.date_dispo)}</b>{m.demande?.date_retour && m.demande.date_retour !== m.demande.date_aller ? ` → ${jourCourt(m.demande.date_retour)}` : ""}</span>
            <span><b>{m.demande?.passagers ?? m.retour?.places}</b> passagers</span>
          </div>
        </div>
        <div className="text-[12.5px] min-w-0">
          <p className="font-semibold truncate">{m.client?.nom ?? "Client"}</p>
          <p className="text-[#77756F] truncate">{m.client?.telephone ?? "tél. non renseigné"}</p>
        </div>
        <div className="text-[12px] text-[#77756F]">
          <b className="block text-[15px] text-[#111] font-semibold">{eur(m.prix_final)}</b>
          commission {eur(m.commission_montant)} ({m.commission_taux} %)
          {m.statut !== "annulee" && (
            <>
              <p className="text-[11.5px] text-[#55534E] mt-1.5 truncate">{enAttenteAnnul ? "Annulation en attente de DealBus" : e.libelle}</p>
              <div className="pro-steps">{e.liste.map((x, i) => <span key={i} className={x.ok ? "on" : i === e.cur ? "cur" : ""} />)}</div>
            </>
          )}
        </div>
        <div className="flex gap-2 md:justify-end flex-wrap">
          <Link href={`/pro/missions/${m.id}`} className="btn btn-ghost py-1.5 px-3 text-[12px]">Ouvrir</Link>
          {m.statut === "a_venir" && !enAttenteAnnul && <><DeclarerTerminee missionId={m.id} /><AnnulerMission missionId={m.id} /></>}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="h-display text-4xl">Missions</h1>
          <p className="text-blanc-dim mt-1.5">Offres acceptées : coordonnées du client révélées, suivi du voyage, puis facture de commission et avis.</p>
        </div>
      </div>
      <div className="card p-0 overflow-hidden mb-6">
        {actives.map((m) => <Ligne key={m.id} m={m} />)}
        {actives.length === 0 && <p className="px-5 py-10 text-center text-blanc-dim">Aucune mission à venir.</p>}
      </div>
      {archives.length > 0 && (
        <details className="card p-0 overflow-hidden">
          <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#FAFAF8]">
            <span className="font-semibold">Missions passées</span>
            <span className="text-[12px] text-[#9A9893]">{archives.length} ▾</span>
          </summary>
          <div className="border-t border-ligne">{archives.map((m) => <Ligne key={m.id} m={m} estompe />)}</div>
        </details>
      )}
    </>
  );
}
