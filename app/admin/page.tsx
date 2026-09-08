import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { eur, aTraiter, TAG_ALERTE, SECTEURS } from "./helpers";
import { TransporteurActions, EnvoyerEmailTransporteur } from "./actions";

export const metadata = { title: "Pilotage — Administration" };

// Page d'entrée : les indicateurs, puis uniquement ce qui demande une action
// aujourd'hui. Les listes complètes vivent sur leurs propres routes.
export default async function PilotagePage() {
  const supabase = await createClient();

  const [{ data: transporteurs }, { data: demandes }, { data: missions }] = await Promise.all([
    supabase.from("transporteurs")
      .select("*, profile:profiles(nom, telephone), zones:transporteur_zones(departement)")
      .order("created_at", { ascending: false }),
    supabase.from("demandes").select("statut"),
    supabase.from("missions").select("statut, facturation, commission_montant"),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const T = (transporteurs ?? []) as any[];
  const D = (demandes ?? []) as any[];
  const M = (missions ?? []) as any[];

  const enAttente = T.filter((t) => t.statut === "en_attente");
  const suppressions = T.filter((t) => !!t.suppression_demandee_at);
  const dossiers = M.filter((m) => m.statut === "annulee" || m.statut === "litige");
  const dossiersATraiter = dossiers.filter(aTraiter);

  const facturables = M.filter((m) => m.statut !== "annulee");
  const somme = (f: (m: any) => boolean) =>
    facturables.filter(f).reduce((s, m) => s + Number(m.commission_montant), 0);
  const caPaye = somme((m) => m.facturation === "payee");
  const caEnCours = somme((m) => m.facturation === "a_facturer" || m.facturation === "facturee");

  const kpis = [
    { num: eur(caPaye), label: "Commissions encaissées", accent: true },
    { num: eur(caEnCours), label: "À facturer + en attente" },
    { num: `${D.filter((d) => d.statut === "ouverte").length} / ${D.length}`, label: "Demandes ouvertes / total" },
    { num: `${M.length}`, label: "Missions confirmées" },
    { num: `${enAttente.length}`, label: "Transporteurs à valider", accent: enAttente.length > 0 },
    { num: `${T.filter((t) => t.statut === "valide").length}`, label: "Transporteurs actifs" },
    { num: `${suppressions.length}`, label: "Suppressions demandées", accent: suppressions.length > 0 },
    { num: `${dossiersATraiter.length}`, label: "Dossiers à traiter", accent: dossiersATraiter.length > 0 },
    { num: D.length ? `${Math.round((M.length / D.length) * 100)} %` : "—", label: "Taux de conversion" },
  ];

  return (
    <main>
      <p className="eyebrow mb-4">Administration</p>
      <h1 className="h-display text-4xl mb-10">Pilotage DealBus.</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-14">
        {kpis.map((k) => (
          <div key={k.label} className={`card ${k.accent ? "border-ambre/40" : ""}`}>
            <p className={`font-mono text-xl font-semibold ${k.accent ? "text-ambre-fort" : "text-blanc"}`}>{k.num}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h2 className="h-display text-2xl">À traiter aujourd&apos;hui</h2>
          <p className="text-sm text-blanc-dim mt-1">
            Les demandes de validation en attente. Le reste se trouve dans les onglets de la barre.
          </p>
        </div>
        {dossiersATraiter.length > 0 && (
          <Link href="/admin/litiges" className="btn-ghost text-xs px-4 py-2">
            {dossiersATraiter.length} dossier{dossiersATraiter.length > 1 ? "s" : ""} d&apos;annulation →
          </Link>
        )}
      </div>

      {enAttente.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-blanc-dim">Aucun transporteur en attente de validation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enAttente.map((t) => (
            <div key={t.id} className="card border-ambre/30">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold">
                    <Link href={`/admin/transporteurs/${t.id}`} className="hover:underline">{t.raison_sociale}</Link>
                    <span className="ml-2.5 tag bg-bleunuit text-bleunuit-fort">{SECTEURS[t.secteur] ?? t.secteur}</span>
                  </p>
                  <p className="font-mono text-xs text-blanc-faint mt-1.5">
                    SIREN {t.siren} · Titre {t.licence_transport} · Siège {t.departement_siege} ·
                    Zones {t.zones.map((z: { departement: string }) => z.departement).join(", ") || "—"}
                  </p>
                  <p className="font-mono text-xs text-blanc-faint mt-1">
                    {t.profile?.nom ?? "—"} · {t.profile?.telephone ?? "—"} ·
                    inscrit le {new Date(t.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link href={`/admin/transporteurs/${t.id}`} className="btn-ghost text-xs px-4 py-2">Fiche →</Link>
                  <EnvoyerEmailTransporteur id={t.id} raisonSociale={t.raison_sociale} />
                  <TransporteurActions id={t.id} statut={t.statut} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {suppressions.length > 0 && (
        <div className={`card mt-8 border-[#C2410C]/35`}>
          <p className="font-semibold mb-2">
            <span className={`tag ${TAG_ALERTE} mr-2.5`}>Suppression demandée</span>
            {suppressions.length} compte{suppressions.length > 1 ? "s" : ""} en attente de traitement
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
            {suppressions.map((t) => (
              <Link key={t.id} href={`/admin/transporteurs/${t.id}`} className="text-ambre-fort hover:underline">
                {t.raison_sociale}
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
