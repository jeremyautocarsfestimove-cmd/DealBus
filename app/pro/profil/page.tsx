import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contexteTransporteur, initiales } from "@/lib/pro";
import { FEATURES } from "@/lib/features";
import { ParametresDevis } from "../parametres-devis";
import { PublierRetour, ReservationActions, GererVehicules, CgvForm, GererZones, DemanderSuppression, ModifierProfilTransporteur } from "../pro-actions";

export const metadata = { title: "Mon entreprise — DealBus" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function ProfilProPage() {
  const ctx = await contexteTransporteur();
  if (!ctx?.transporteur || ctx.transporteur.statut !== "valide") redirect("/pro");
  const { user, transporteur } = ctx;
  const supabase = await createClient();
  const [{ data: profil }, { data: vehicules }, { data: zones }, { data: retours }] = await Promise.all([
    supabase.from("profiles").select("nom, telephone, email").eq("id", user.id).maybeSingle(),
    supabase.from("vehicules").select("*").eq("transporteur_id", user.id).order("created_at", { ascending: true }),
    supabase.from("transporteur_zones").select("departement").eq("transporteur_id", user.id).order("departement", { ascending: true }),
    FEATURES.retours ? supabase.from("retours_vide").select("*, reservations:reservations_retour(*, client:profiles(nom, telephone, email))").eq("transporteur_id", user.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
  ]);
  const eur = (n: number) => Number(n).toLocaleString("fr-FR") + " €";

  const SECTIONS = [
    { id: "coordonnees", label: "Coordonnées" },
    { id: "zones", label: "Mes zones" },
    { id: "depot", label: "Mon dépôt" },
    { id: "vehicules", label: "Véhicules" },
    { id: "conditions", label: "Conditions de vente" },
    { id: "compte", label: "Mon compte" },
  ];
  const nbZones = (zones ?? []).length;
  const nbVehicules = (vehicules ?? []).length;

  return (
    <div className="pf">
      {/* En-tête : l'entreprise en un coup d'œil */}
      <header className="pf-tete">
        <span className="pf-avatar">{initiales(transporteur.raison_sociale)}</span>
        <div className="min-w-0">
          <h1>{transporteur.raison_sociale}</h1>
          <p>
            <span className="pf-ok">Compte vérifié</span>
            <a href="#zones"><b>{nbZones}</b> zone{nbZones > 1 ? "s" : ""}</a>
            <a href="#vehicules"><b>{nbVehicules}</b> véhicule{nbVehicules > 1 ? "s" : ""}</a>
            <span><b>{transporteur.nb_missions ?? 0}</b> mission{(transporteur.nb_missions ?? 0) > 1 ? "s" : ""} réalisée{(transporteur.nb_missions ?? 0) > 1 ? "s" : ""}</span>
          </p>
        </div>
      </header>

      <div className="pf-grille">
        {/* Sommaire : reste visible pendant le défilement sur ordinateur, défile à l'horizontale sur téléphone */}
        <nav className="pf-sommaire" aria-label="Sections de la page">
          {SECTIONS.map((x, i) => <a key={x.id} href={`#${x.id}`}><i>{i + 1}</i>{x.label}</a>)}
        </nav>

        <div className="pf-contenu">
          <section id="coordonnees">
            <ModifierProfilTransporteur transporteurId={user.id} initial={{
              raison_sociale: transporteur.raison_sociale, siren: transporteur.siren, licence_transport: transporteur.licence_transport,
              departement_siege: transporteur.departement_siege, secteur: transporteur.secteur,
              nom: profil?.nom ?? null, telephone: profil?.telephone ?? null, email: profil?.email ?? null,
            }} />
          </section>
          <section id="zones"><GererZones transporteurId={user.id} zones={(zones ?? []) as any[]} /></section>
          <section id="depot">
            <ParametresDevis transporteurId={user.id} initial={{
              depot_adresse: transporteur.depot_adresse ?? null, cout_km: transporteur.cout_km ?? null, cout_heure: transporteur.cout_heure ?? null,
              cout_nuit: transporteur.cout_nuit ?? null, cout_immobilisation: transporteur.cout_immobilisation ?? null, marge_pct: transporteur.marge_pct ?? null,
            }} />
          </section>
          <section id="vehicules"><GererVehicules transporteurId={user.id} vehicules={(vehicules ?? []) as any[]} /></section>
          <section id="conditions"><CgvForm transporteurId={user.id} initial={transporteur.cgv ?? null} /></section>

          {FEATURES.retours && (
          <div className="card">
            <h2 className="h-display text-2xl mb-4">Mes retours à vide</h2>
            <PublierRetour transporteurId={user.id} />
            <div className="space-y-3 mt-4">
              {((retours ?? []) as any[]).map((r) => (
                <div key={r.id} className="border border-ligne rounded-lg p-4">
                  <p className="font-semibold">{r.depart_adresse} → {r.arrivee_adresse} <span className="tag bg-[#FFF4E0] text-[#B26A00] ml-2">{eur(r.prix_fixe)}</span></p>
                  <p className="text-[12px] text-[#77756F] mt-1">{new Date(r.date_dispo).toLocaleDateString("fr-FR")} · {r.places} places · {r.statut}</p>
                  {(r.reservations ?? []).filter((x: any) => x.statut === "en_attente").map((resa: any) => (
                    <div key={resa.id} className="mt-2 flex items-center justify-between gap-3"><span className="text-[12.5px]">Demande de réservation reçue</span><ReservationActions reservationId={resa.id} retourId={r.id} /></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

          <section id="compte"><DemanderSuppression transporteurId={user.id} dejaDemandee={transporteur.suppression_demandee_at ?? null} /></section>
        </div>
      </div>
    </div>
  );
}
