import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SECTEURS, TAG_ALERTE } from "../helpers";
import { TransporteurActions, EnvoyerEmailTransporteur } from "../actions";

export const metadata = { title: "Transporteurs — Administration" };

export default async function AdminTransporteursPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("transporteurs")
    .select("*, profile:profiles(nom, telephone), zones:transporteur_zones(departement)")
    .order("created_at", { ascending: false });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const T = (data ?? []) as any[];
  const enAttente = T.filter((t) => t.statut === "en_attente");
  const autres = T.filter((t) => t.statut !== "en_attente");

  return (
    <main>
      <p className="eyebrow mb-4">Administration</p>
      <h1 className="h-display text-4xl mb-10">Transporteurs.</h1>

      {enAttente.length > 0 && (
        <>
          <h2 className="h-display text-xl mb-4">En attente de validation</h2>
          <div className="space-y-3 mb-12">
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
        </>
      )}

      <h2 className="h-display text-xl mb-4">Tous les transporteurs</h2>
      <div className="space-y-3">
        {autres.map((t) => (
          <div key={t.id} className="card flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold">
                <Link href={`/admin/transporteurs/${t.id}`} className="hover:underline">{t.raison_sociale}</Link>
                <span className={`ml-2.5 tag ${t.statut === "valide" ? "bg-vert-dim text-vert" : TAG_ALERTE}`}>
                  {t.statut === "valide" ? "Actif" : "Suspendu"}
                </span>
                {t.suppression_demandee_at && (
                  <span className={`ml-2.5 tag ${TAG_ALERTE}`}>Suppression demandée</span>
                )}
              </p>
              <p className="font-mono text-xs text-blanc-faint mt-1.5">
                {SECTEURS[t.secteur] ?? t.secteur} · dépt. {t.departement_siege} ·
                ★ {t.note_moyenne ?? "—"}/5 ({t.nb_avis} avis · {t.nb_missions} missions)
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link href={`/admin/transporteurs/${t.id}`} className="btn-ghost text-xs px-4 py-2">Fiche →</Link>
              <EnvoyerEmailTransporteur id={t.id} raisonSociale={t.raison_sociale} />
              <TransporteurActions id={t.id} statut={t.statut} />
            </div>
          </div>
        ))}
        {autres.length === 0 && <p className="text-blanc-dim text-sm">Aucun transporteur.</p>}
      </div>
    </main>
  );
}
