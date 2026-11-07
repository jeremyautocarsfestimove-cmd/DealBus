import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MODE_TAG, eur } from "../helpers";
import { PilotageAction } from "../actions";
import { demandeActive, libelleStatut } from "@/lib/demandes";
import { RecalculerDistances } from "../recalculer-distances";
import { depuis, ville } from "@/lib/admin-crm";

export const metadata = { title: "Demandes — Administration" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminDemandesPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue = "actives" } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("demandes")
    .select("*, client:profiles(nom, email)")
    .order("created_at", { ascending: false }).limit(300);

  const D = (data ?? []) as any[];

  // Une seule requête pour toutes les offres des demandes affichées
  const { data: offres } = D.length
    ? await supabase.from("offres").select("demande_id, prix_ttc").in("demande_id", D.map((d) => d.id))
    : { data: [] };

  const parDemande = new Map<string, number[]>();
  for (const o of (offres ?? []) as any[]) {
    const l = parDemande.get(o.demande_id) ?? [];
    l.push(Number(o.prix_ttc));
    parDemande.set(o.demande_id, l);
  }

  const actives = D.filter(demandeActive);
  const archives = D.filter((d) => !demandeActive(d));
  const sansOffre = actives.filter((d) => d.statut === "ouverte" && !(parDemande.get(d.id)?.length));
  const liste = vue === "archives" ? archives : vue === "sans-offre" ? sansOffre : actives;

  const onglets = [
    { id: "actives", label: "Actives", n: actives.length },
    { id: "sans-offre", label: "Sans offre", n: sansOffre.length },
    { id: "archives", label: "Archives", n: archives.length },
  ];

  return (
    <main>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="crm-titre">Demandes</h1>
          <p className="crm-sous">Actives : ouvertes ou confirmées, date non passée. Le reste est en archives.</p>
        </div>
        <RecalculerDistances />
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {onglets.map((o) => (
          <Link key={o.id} href={`/admin/demandes?vue=${o.id}`} className={`crm-onglet ${vue === o.id ? "crm-onglet-on" : ""}`}>
            {o.label} · {o.n}
          </Link>
        ))}
      </div>

      <div className="crm-panel overflow-x-auto">
        <table className="crm-table">
          <thead>
            <tr>
              <th>#</th><th>Trajet</th><th>Client</th><th>Départ</th><th className="text-right">Pax</th>
              <th>Statut</th><th className="text-right">Nb</th><th className="text-right">Offres reçues</th><th>Créée</th><th></th>
            </tr>
          </thead>
          <tbody>
            {liste.map((d) => {
              const p = parDemande.get(d.id) ?? [];
              const active = demandeActive(d);
              return (
                <tr key={d.id}>
                  <td className="font-mono text-blanc-faint whitespace-nowrap">
                    #{d.numero}
                    {d.mode === "enchere" && <span className={`pill ml-1.5 ${MODE_TAG.enchere}`}>Ench.</span>}
                  </td>
                  <td>
                    <Link href={`/admin/demandes/${d.id}`} title={`${d.depart_adresse} → ${d.arrivee_adresse}`} className="font-semibold hover:text-ambre-fort">{ville(d.depart_adresse)} → {ville(d.arrivee_adresse)}</Link>
                    <p className="font-mono text-[11px] text-blanc-faint">
                      {d.type_trajet === "aller_simple" ? "aller simple" : d.type_trajet === "circuit" ? "circuit" : "aller-retour"}
                      {d.distance_km ? ` · ${Number(d.distance_km)} km` : ""}
                    </p>
                  </td>
                  <td className="max-w-[220px]">
                    <Link href={`/admin/clients/${d.client_id}`} className="hover:text-ambre-fort block truncate">{d.client?.nom ?? "Sans nom"}</Link>
                    <p className="font-mono text-[11px] text-blanc-faint truncate max-w-[200px]" title={d.client?.email ?? ""}>{d.client?.email ?? ""}</p>
                  </td>
                  <td className="font-mono text-[12px] whitespace-nowrap">
                    {new Date(d.date_aller).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })}{d.heure_aller ? ` · ${String(d.heure_aller).slice(0, 5).replace(":", "h")}` : ""}
                  </td>
                  <td className="text-right font-mono">{d.passagers}</td>
                  <td>
                    <span className={`pill ${d.statut === "annulee" ? "bg-[#FCEBE4] text-[#C2410C]" : d.statut === "confirmee" ? "bg-vert-dim text-vert" : active ? "bg-ambre-dim text-ambre-fort" : "bg-asphalte-3 text-blanc-faint"}`}>
                      {libelleStatut(d)}
                    </span>
                  </td>
                  <td className="text-right font-mono">{p.length || <span className="text-blanc-faint">0</span>}</td>
                  <td className="text-right font-mono whitespace-nowrap">
                    {p.length ? <><span className="text-vert">{eur(Math.min(...p))}</span>{p.length > 1 && <span className="text-blanc-faint"> à {eur(Math.max(...p))}</span>}</> : "—"}
                  </td>
                  <td className="text-blanc-dim whitespace-nowrap text-[12px]">{depuis(d.created_at)}</td>
                  <td className="text-right whitespace-nowrap">
                    {d.statut === "ouverte" && active && (
                      <PilotageAction entity="demande" id={d.id} action="annuler" label="Annuler"
                        confirm="Annuler cette demande ? Les transporteurs ne la verront plus." />
                    )}
                  </td>
                </tr>
              );
            })}
            {liste.length === 0 && (
              <tr><td colSpan={10} className="text-center text-blanc-dim py-10">Aucune demande dans cette vue.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
