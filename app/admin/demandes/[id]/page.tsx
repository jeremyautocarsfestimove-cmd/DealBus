import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import { eur, MODE_TAG, TAG_ALERTE, jour } from "../../helpers";

export const metadata = { title: "Détail d'une demande — Administration" };

const STATUT_OFFRE: Record<string, { label: string; classe: string }> = {
  retenue: { label: "Retenue", classe: "bg-vert-dim text-vert" },
  non_retenue: { label: "Non retenue", classe: "bg-asphalte-3 text-blanc-faint" },
  consultee: { label: "Consultée", classe: "bg-bleunuit text-bleunuit-fort" },
  envoyee: { label: "Envoyée", classe: "bg-asphalte-3 text-blanc-dim" },
};

const mediane = (v: number[]) => {
  if (!v.length) return null;
  const t = [...v].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
};

export default async function DetailDemandePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: demande } = await supabase.from("demandes")
    .select("*, client:profiles(nom, telephone)")
    .eq("id", id).maybeSingle();

  if (!demande) notFound();

  // Jointure en deux temps : la vue anonymisée n'a pas d'intérêt côté admin,
  // on lit directement la table transporteurs pour avoir les vraies identités.
  const { data: offresBrutes } = await supabase.from("offres")
    .select("*").eq("demande_id", id).order("prix_ttc", { ascending: true });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const offres = (offresBrutes ?? []) as any[];
  const ids = offres.map((o) => o.transporteur_id);
  const { data: transporteurs } = ids.length
    ? await supabase.from("transporteurs").select("id, raison_sociale, departement_siege, note_moyenne, nb_missions").in("id", ids)
    : { data: [] };
  const parId = new Map((transporteurs ?? []).map((t: any) => [t.id, t]));

  const { data: mission } = await supabase.from("missions")
    .select("id, prix_final, commission_montant, statut, facturation, transporteur:transporteurs(raison_sociale)")
    .eq("demande_id", id).maybeSingle();

  const prix = offres.map((o) => Number(o.prix_ttc));
  const min = prix.length ? Math.min(...prix) : null;
  const max = prix.length ? Math.max(...prix) : null;
  const med = mediane(prix);
  const moy = prix.length ? prix.reduce((s, p) => s + p, 0) / prix.length : null;
  const km = demande.distance_km ? Number(demande.distance_km) : null;
  const ecart = min && max ? Math.round(((max - min) / min) * 100) : null;

  const parKm = (p: number | null) =>
    p && km ? `${(p / km).toFixed(2).replace(".", ",")} €/km` : "—";

  return (
    <main>
      <BackButton href="/admin/demandes" className="mb-8" />

      <p className="eyebrow mb-4">Demande #{demande.numero}</p>
      <h1 className="h-display text-4xl mb-3">
        {demande.depart_adresse} → {demande.arrivee_adresse}
      </h1>
      <div className="flex flex-wrap items-center gap-2.5 mb-10">
        <span className={`tag ${MODE_TAG[demande.mode]}`}>{demande.mode === "enchere" ? "Enchère" : "Devis"}</span>
        <span className={`tag ${demande.statut === "annulee" ? TAG_ALERTE : "bg-asphalte-3 text-blanc-dim"}`}>{demande.statut}</span>
        <span className="font-mono text-xs text-blanc-faint">
          {demande.client?.nom ?? "Client sans nom"}
          {demande.client?.telephone ? ` · ${demande.client.telephone}` : ""}
        </span>
      </div>

      {/* ---------- Le trajet ---------- */}
      <div className="card mb-8">
        <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mb-4">Le trajet</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6 text-sm">
          <div><p className="text-blanc-faint text-[12px] mb-1">Type</p><p className="font-semibold">{String(demande.type_trajet).replace("_", " ")}</p></div>
          <div><p className="text-blanc-faint text-[12px] mb-1">Aller</p><p className="font-semibold">{jour(demande.date_aller)}{demande.heure_aller ? ` · ${String(demande.heure_aller).slice(0, 5).replace(":", "h")}` : ""}</p></div>
          <div><p className="text-blanc-faint text-[12px] mb-1">Retour</p><p className="font-semibold">{demande.date_retour ? jour(demande.date_retour) : "—"}</p></div>
          <div><p className="text-blanc-faint text-[12px] mb-1">Passagers</p><p className="font-semibold">{demande.passagers}</p></div>
          <div><p className="text-blanc-faint text-[12px] mb-1">Distance</p><p className="font-semibold font-mono">{km ? `${km} km` : "non calculée"}</p></div>
          <div><p className="text-blanc-faint text-[12px] mb-1">Estimation affichée</p><p className="font-semibold font-mono">{demande.prix_estime ? eur(demande.prix_estime) : "—"}</p></div>
          <div><p className="text-blanc-faint text-[12px] mb-1">Déposée le</p><p className="font-semibold">{jour(demande.created_at)}</p></div>
          <div><p className="text-blanc-faint text-[12px] mb-1">Offres reçues</p><p className="font-semibold font-mono">{offres.length}</p></div>
        </div>
      </div>

      {/* ---------- Repères tarifaires ---------- */}
      {prix.length > 0 && (
        <>
          <h2 className="h-display text-2xl mb-1">Repères tarifaires</h2>
          <p className="text-sm text-blanc-dim mb-5">
            Le prix au kilomètre n&apos;apparaît que si la distance a été calculée à la création de la demande.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="card">
              <p className="font-mono text-xl font-semibold text-vert">{eur(min!)}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Plus basse · {parKm(min)}</p>
            </div>
            <div className="card">
              <p className="font-mono text-xl font-semibold">{eur(Math.round(med!))}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Médiane · {parKm(med)}</p>
            </div>
            <div className="card">
              <p className="font-mono text-xl font-semibold">{eur(Math.round(moy!))}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Moyenne · {parKm(moy)}</p>
            </div>
            <div className="card">
              <p className="font-mono text-xl font-semibold">{eur(max!)}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Plus haute · {parKm(max)}</p>
            </div>
          </div>
          {ecart !== null && (
            <div className="card border-ambre/40 mb-10">
              <p className="text-sm">
                <strong className="text-ambre-fort font-mono">{ecart} %</strong> d&apos;écart entre la moins-disante
                et la plus-disante
                {demande.prix_estime && med && (
                  <> · l&apos;estimation affichée au client était {Math.abs(Math.round(((Number(demande.prix_estime) - med) / med) * 100))} %{" "}
                  {Number(demande.prix_estime) > med ? "au-dessus" : "en dessous"} de la médiane reçue</>
                )}
              </p>
            </div>
          )}
        </>
      )}

      {/* ---------- Les offres ---------- */}
      <h2 className="h-display text-2xl mb-5">
        {offres.length} offre{offres.length > 1 ? "s" : ""} reçue{offres.length > 1 ? "s" : ""}
      </h2>

      {offres.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-blanc-dim">Aucun transporteur n&apos;a encore répondu à cette demande.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-ligne font-mono text-[10px] uppercase tracking-wider text-blanc-faint">
                <th className="text-left px-5 py-3">Transporteur</th>
                <th className="text-right px-5 py-3">Prix TTC</th>
                <th className="text-right px-5 py-3">€/km</th>
                <th className="text-right px-5 py-3">Écart</th>
                <th className="text-left px-5 py-3">Véhicule</th>
                <th className="text-left px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {offres.map((o) => {
                const t = parId.get(o.transporteur_id);
                const s = STATUT_OFFRE[o.statut] ?? { label: o.statut, classe: "bg-asphalte-3 text-blanc-dim" };
                const delta = min ? Math.round(((Number(o.prix_ttc) - min) / min) * 100) : 0;
                return (
                  <tr key={o.id} className="border-b border-ligne/50 last:border-0 align-top">
                    <td className="px-5 py-3">
                      {t ? (
                        <Link href={`/admin/transporteurs/${t.id}`} className="font-semibold hover:underline">
                          {t.raison_sociale}
                        </Link>
                      ) : (
                        <span className="text-blanc-faint">Transporteur supprimé</span>
                      )}
                      {t && (
                        <p className="font-mono text-[11px] text-blanc-faint mt-0.5">
                          dépt. {t.departement_siege} · ★ {t.note_moyenne ?? "—"}/5 · {t.nb_missions} missions
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold whitespace-nowrap">{eur(o.prix_ttc)}</td>
                    <td className="px-5 py-3 text-right font-mono text-blanc-dim whitespace-nowrap">{parKm(Number(o.prix_ttc))}</td>
                    <td className="px-5 py-3 text-right font-mono whitespace-nowrap">
                      {delta === 0 ? <span className="text-vert">référence</span> : <span className="text-blanc-faint">+{delta} %</span>}
                    </td>
                    <td className="px-5 py-3 text-blanc-dim">
                      {o.vehicule_type} · {o.vehicule_places} pl.
                      {o.vehicule_annee ? ` · ${o.vehicule_annee}` : ""}
                      {o.conditions && <p className="text-[12px] text-blanc-faint mt-1 max-w-xs">{o.conditions}</p>}
                    </td>
                    <td className="px-5 py-3"><span className={`tag ${s.classe}`}>{s.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- Issue ---------- */}
      {mission && (
        <div className="card mt-8 border-vert/30">
          <p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mb-3">Issue de la demande</p>
          <p className="text-sm">
            Mission confirmée avec <strong>{(mission as any).transporteur?.raison_sociale ?? "—"}</strong> à{" "}
            <strong className="font-mono">{eur(mission.prix_final)}</strong>, commission{" "}
            <strong className="font-mono text-ambre-fort">{eur(mission.commission_montant)}</strong> ·
            statut {mission.statut} · facturation {String(mission.facturation).replace("_", " ")}
          </p>
          <Link href="/admin/missions" className="btn-ghost text-xs px-4 py-2 mt-4 inline-block">
            Voir dans les missions →
          </Link>
        </div>
      )}
    </main>
  );
}
