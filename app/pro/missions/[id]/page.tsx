import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import { AnnulerMission, DeclarerTerminee } from "../../pro-actions";

const eur = (n: number) => Number(n).toLocaleString("fr-FR") + " €";

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: mission } = await supabase
    .from("missions")
    .select("*, demande:demandes(numero, depart_adresse, arrivee_adresse, date_aller, heure_aller, date_retour, heure_retour, passagers, type_trajet, precisions), retour:retours_vide(depart_adresse, arrivee_adresse, date_dispo, heure_apres, places), client:profiles!missions_client_id_fkey(nom, telephone, email)")
    .eq("id", id)
    .eq("transporteur_id", user.id)
    .maybeSingle();

  if (!mission) notFound();

  const dateMission = mission.demande?.date_aller ?? mission.retour?.date_dispo;
  const heureMission = mission.demande?.heure_aller ?? mission.retour?.heure_apres;
  const depart = mission.demande?.depart_adresse ?? mission.retour?.depart_adresse ?? "—";
  const arrivee = mission.demande?.arrivee_adresse ?? mission.retour?.arrivee_adresse ?? "—";

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-7 py-14">
        <div className="mb-8">
          <BackButton href="/pro" />
        </div>

        <p className="eyebrow mb-4">Mission {mission.demande?.numero ? `#${mission.demande.numero}` : "DealBus"}</p>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="h-display text-4xl mb-2">{depart} → {arrivee}</h1>
            <p className="font-mono text-xs text-blanc-faint">
              {dateMission ? new Date(dateMission).toLocaleDateString("fr-FR") + (heureMission ? ` à ${String(heureMission).slice(0, 5).replace(":", "h")}` : "") : "Date non renseignée"}
              {mission.demande?.passagers ? ` · ${mission.demande.passagers} passagers` : mission.retour?.places ? ` · ${mission.retour.places} places` : ""}
            </p>
          </div>
          <span className={`tag ${mission.statut === "a_venir" ? "bg-vert-dim text-vert" : mission.statut === "annulee" ? "bg-[#3a2020] text-[#E8735D]" : "bg-asphalte-3 text-blanc-dim"}`}>
            {mission.statut === "a_venir" ? "À venir" : mission.statut === "terminee_declaree" ? "Terminée" : mission.statut === "annulee" ? "Annulée" : mission.statut}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="card">
            <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mb-2">Montant mission</p>
            <p className="font-mono text-2xl font-semibold">{eur(mission.prix_final)}</p>
          </div>
          <div className="card">
            <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mb-2">Commission DealBus</p>
            <p className="font-mono text-2xl font-semibold text-ambre">{eur(mission.commission_montant)}</p>
            <p className="font-mono text-[11px] text-blanc-faint mt-1">{mission.commission_taux} %</p>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="h-display text-xl mb-4">Contact client</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-blanc-faint">Nom :</span> {mission.client?.nom ?? "—"}</p>
            <p><span className="text-blanc-faint">Téléphone :</span> {mission.client?.telephone ?? "Non renseigné"}</p>
            <p><span className="text-blanc-faint">Email :</span> {mission.client?.email ?? "Non renseigné"}</p>
          </div>
        </div>

        {mission.demande?.precisions && (
          <div className="card mb-6">
            <h2 className="h-display text-xl mb-3">Précisions</h2>
            <p className="text-sm text-blanc-dim whitespace-pre-line">{mission.demande.precisions}</p>
          </div>
        )}

        {mission.statut === "a_venir" && (
          <div className="flex gap-3 flex-wrap">
            <DeclarerTerminee missionId={mission.id} />
            <AnnulerMission missionId={mission.id} />
          </div>
        )}
      </main>
    </>
  );
}