import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { eur } from "../helpers";
import { PilotageAction } from "../actions";

export const metadata = { title: "Missions & commissions — Administration" };

export default async function AdminMissionsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("missions")
    .select("*, demande:demandes(numero, depart_adresse, arrivee_adresse), retour:retours_vide(depart_adresse, arrivee_adresse), transporteur:transporteurs(raison_sociale)")
    .order("created_at", { ascending: false }).limit(100);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const M = (data ?? []) as any[];

  // Une mission annulée validée ne doit pas gonfler les commissions à facturer.
  const facturables = M.filter((m) => m.statut !== "annulee");
  const somme = (f: (m: any) => boolean) =>
    facturables.filter(f).reduce((s, m) => s + Number(m.commission_montant), 0);
  const caAFacturer = somme((m) => m.facturation === "a_facturer");
  const caFacture = somme((m) => m.facturation === "facturee");
  const caPaye = somme((m) => m.facturation === "payee");
  const caTotal = facturables.reduce((s, m) => s + Number(m.commission_montant), 0);

  return (
    <main className="max-w-6xl mx-auto px-7 py-12">
      <p className="eyebrow mb-4">Administration</p>
      <h1 className="h-display text-4xl mb-2">Missions &amp; commissions.</h1>
      <p className="text-sm text-blanc-dim mb-8">
        Les dossiers d&apos;annulation et de litige se traitent sur{" "}
        <Link href="/admin/litiges" className="text-ambre-fort hover:underline">leur page dédiée</Link>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="card">
          <p className="font-mono text-lg font-semibold">{eur(caAFacturer)}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">À facturer</p>
        </div>
        <div className="card">
          <p className="font-mono text-lg font-semibold">{eur(caFacture)}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Facturé, en attente</p>
        </div>
        <div className="card border-ambre/40">
          <p className="font-mono text-lg font-semibold text-ambre-fort">{eur(caPaye)}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Encaissé · total {eur(caTotal)}</p>
        </div>
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
                commission <strong className="text-ambre-fort">{eur(m.commission_montant)}</strong> ({m.commission_taux} %) ·
                {" "}<strong className="text-blanc-dim">{m.statut === "annulee" ? "annulée" : m.statut === "litige" ? "⚠ litige" : m.facturation.replace("_", " ")}</strong>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {["annulee", "litige"].includes(m.statut) ? (
                <Link href="/admin/litiges" className="btn-ghost text-xs px-4 py-2">Traiter le dossier →</Link>
              ) : m.facturation === "a_facturer" ? (
                <PilotageAction entity="mission" id={m.id} action="facturer" label="Marquer facturée" primary />
              ) : m.facturation === "facturee" ? (
                <PilotageAction entity="mission" id={m.id} action="payer" label="Marquer payée" primary />
              ) : null}
            </div>
          </div>
        ))}
        {M.length === 0 && <p className="text-blanc-dim text-sm">Aucune mission confirmée pour l&apos;instant.</p>}
      </div>
    </main>
  );
}
