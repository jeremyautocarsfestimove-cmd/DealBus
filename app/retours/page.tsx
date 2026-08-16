import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import type { RetourVide } from "@/lib/types";
import { ReserverRetourButton } from "./reserver-button";

export default async function RetoursPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: retours } = await supabase
    .from("retours_vide")
    .select("*, transporteur:transporteurs_anonymes(numero_anonyme)")
    .in("statut", ["publie", "demande_recue"])
    .order("date_dispo", { ascending: true });

  // Réservations du client connecté sur ces trajets (RLS : il ne voit que les siennes)
  const { data: mesResas } = user
    ? await supabase.from("reservations_retour").select("retour_id, statut").eq("client_id", user.id)
    : { data: [] };
  const resaMap = new Map((mesResas ?? []).map((r) => [r.retour_id, r.statut]));

  const list = (retours ?? []) as (RetourVide & { transporteur: { numero_anonyme: number } })[];

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">Uniquement sur DealBus</p>
        <h1 className="h-display text-4xl mb-3">Un trajet déjà en route, à prix cassé.</h1>
        <p className="text-blanc-dim mb-10 max-w-xl">
          Après avoir déposé un groupe, un transporteur publie son trajet retour :
          l&apos;autocar complet, à prix fixe, pour votre groupe. Premier arrivé —
          validé manuellement avant confirmation.
        </p>

        <div className="space-y-3.5">
          {list.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                <span className="flex items-center gap-3 font-condensed font-semibold text-xl uppercase">
                  <span className="tag bg-ambre-dim text-ambre">Retour à vide</span>
                  {r.depart_adresse} <span className="text-blanc-faint font-sans normal-case font-normal">→</span> {r.arrivee_adresse}
                </span>
                <span className="font-mono text-xl font-semibold text-ambre">
                  {Number(r.prix_fixe).toLocaleString("fr-FR")} €
                  <span className="text-[11px] text-blanc-faint uppercase ml-1.5">prix fixe</span>
                </span>
              </div>
              <p className="font-mono text-xs text-blanc-faint mb-4">
                {new Date(r.date_dispo).toLocaleDateString("fr-FR")}
                {r.heure_apres ? `, départ après ${r.heure_apres.slice(0, 5)}` : ""} ·
                autocar jusqu&apos;à {r.places} passagers · Transporteur #{r.transporteur?.numero_anonyme}
              </p>
              <div className="border-t border-ligne pt-4">
                <ReserverRetourButton
                  retourId={r.id}
                  initialStatut={(resaMap.get(r.id) as "en_attente" | "validee" | "refusee" | undefined) ?? "idle"}
                />
              </div>
            </div>
          ))}
          {!list.length && <p className="text-blanc-dim">Aucun retour à vide disponible actuellement.</p>}
        </div>

        <p className="mt-6 text-[13px] text-blanc-dim bg-vert-dim border border-vert/30 rounded-sm px-4 py-3">
          Un trajet demandé n&apos;est proposé à personne d&apos;autre le temps que le
          transporteur valide votre réservation — commission réduite sur ces trajets.
        </p>
      </main>
    </>
  );
}
