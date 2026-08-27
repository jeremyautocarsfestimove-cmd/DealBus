import Link from "next/link";
import { Nav } from "@/components/Nav";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import { TransporteurActions, PilotageAction } from "../../actions";

const SECTEURS: Record<string, string> = {
  autocariste: "Autocariste", vtc: "VTC", taxi: "Taxi", loti: "LOTI",
};
const eur = (n: number) => Number(n).toLocaleString("fr-FR") + " €";
const dt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const dtHeure = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

export default async function FicheTransporteurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  if (me?.role !== "admin") {
    return (
      <>
        <Nav />
        <main className="max-w-2xl mx-auto px-7 py-24 text-center">
          <h1 className="h-display text-4xl mb-4">Accès réservé.</h1>
          <p className="text-blanc-dim">Cette page est réservée à l&apos;administration DealBus.</p>
        </main>
      </>
    );
  }

  const { data: t } = await supabase
    .from("transporteurs")
    .select("*, profile:profiles(nom, telephone, email), zones:transporteur_zones(departement)")
    .eq("id", id)
    .maybeSingle();

  if (!t) {
    return (
      <>
        <Nav />
        <main className="max-w-2xl mx-auto px-7 py-24 text-center">
          <h1 className="h-display text-4xl mb-4">Transporteur introuvable.</h1>
          <Link href="/admin" className="btn-ghost mt-6 inline-block">← Retour à l&apos;administration</Link>
        </main>
      </>
    );
  }

  const [{ data: vehicules }, { data: missions }, { data: avis }, { data: retours }] = await Promise.all([
    supabase.from("vehicules").select("*").eq("transporteur_id", id).order("created_at", { ascending: true }),
    supabase.from("missions")
      .select("*, demande:demandes(numero, depart_adresse, arrivee_adresse)")
      .eq("transporteur_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("avis")
      .select("*, client:profiles(nom)")
      .eq("transporteur_id", id).order("created_at", { ascending: false }),
    supabase.from("retours_vide")
      .select("*").eq("transporteur_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const V = (vehicules ?? []) as any[];
  const M = (missions ?? []) as any[];
  const A = (avis ?? []) as any[];
  const R = (retours ?? []) as any[];
  const profile = (t as any).profile;
  const zones = (t as any).zones as { departement: string }[];

  const commissionTotale = M.filter((m) => m.statut !== "annulee")
    .reduce((s, m) => s + Number(m.commission_montant), 0);

  const aHistorique = M.length > 0 || A.length > 0 || R.length > 0;

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-7 py-14">
        <BackButton href="/admin" className="mb-8" />

        {t.suppression_demandee_at && (
          <div className="card border-[#E8735D]/50 bg-[#3a2020]/40 mb-8">
            <p className="font-semibold text-[#E8735D] mb-1">⚠ Suppression de compte demandée</p>
            <p className="text-sm text-blanc-dim mb-4">
              Ce transporteur a demandé la suppression de son compte le {dtHeure(t.suppression_demandee_at)}.
              {aHistorique
                ? " Un historique (missions, avis ou retours) existe : la suppression anonymisera la fiche et bloquera l'accès au compte, sans effacer la comptabilité."
                : " Aucun historique : la suppression sera définitive et complète."}
            </p>
            <PilotageAction
              entity="transporteur"
              id={t.id}
              action="supprimer"
              label="Traiter la demande — supprimer le compte"
              primary
              confirm={aHistorique
                ? "Confirmer la suppression ? La fiche sera anonymisée et l'accès au compte définitivement bloqué. L'historique des missions et commissions sera conservé."
                : "Confirmer la suppression définitive et complète de ce compte ?"}
            />
          </div>
        )}

        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <p className="eyebrow mb-3">Fiche transporteur</p>
            <h1 className="h-display text-4xl mb-2">{t.raison_sociale}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="tag bg-bleunuit text-[#9DB3DE]">{SECTEURS[t.secteur] ?? t.secteur}</span>
              <span className={`tag ${t.statut === "valide" ? "bg-vert-dim text-vert" : t.statut === "en_attente" ? "bg-ambre-dim text-ambre" : "bg-[#3a2020] text-[#E8735D]"}`}>
                {t.statut === "valide" ? "Actif" : t.statut === "en_attente" ? "En attente" : "Suspendu"}
              </span>
              <span className="font-mono text-xs text-blanc-faint">Transporteur #{t.numero_anonyme}</span>
            </div>
          </div>
          <TransporteurActions id={t.id} statut={t.statut} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="card"><p className="font-mono text-xl font-semibold">★ {t.note_moyenne ?? "—"}/5</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">{t.nb_avis} avis</p></div>
          <div className="card"><p className="font-mono text-xl font-semibold">{t.nb_missions}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Missions réalisées</p></div>
          <div className="card"><p className="font-mono text-xl font-semibold text-ambre">{eur(commissionTotale)}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Commissions générées</p></div>
          <div className="card"><p className="font-mono text-xl font-semibold">{V.length}</p><p className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint mt-1">Véhicules déclarés</p></div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="card">
            <p className="font-semibold text-sm mb-3">Contact</p>
            <p className="font-mono text-xs text-blanc-dim leading-relaxed">
              {profile?.nom ?? "—"}<br />
              {profile?.telephone ?? "—"}<br />
              {profile?.email ?? "—"}
            </p>
          </div>
          <div className="card">
            <p className="font-semibold text-sm mb-3">Informations légales</p>
            <p className="font-mono text-xs text-blanc-dim leading-relaxed">
              SIREN {t.siren}<br />
              Titre d&apos;exercice {t.licence_transport}<br />
              Siège dépt. {t.departement_siege}<br />
              RC Pro {t.rc_pro_url ? <a href={t.rc_pro_url} target="_blank" className="text-ambre hover:underline">Voir le justificatif →</a> : "non fourni"}
            </p>
          </div>
        </div>

        <div className="card mb-10">
          <p className="font-semibold text-sm mb-3">Zones de chalandise</p>
          <div className="flex gap-2 flex-wrap">
            {zones.map((z) => (
              <span key={z.departement} className="tag bg-asphalte-3 text-blanc-dim font-mono">{z.departement}</span>
            ))}
            {zones.length === 0 && <span className="text-sm text-blanc-faint">Aucune zone déclarée.</span>}
          </div>
        </div>

        {t.cgv && (
          <div className="card mb-10">
            <p className="font-semibold text-sm mb-3">Conditions (CGV réduites)</p>
            <p className="text-sm text-blanc-dim whitespace-pre-line">{t.cgv}</p>
          </div>
        )}

        <div className="card mb-10">
          <p className="font-semibold text-sm mb-3">Véhicules</p>
          <div className="space-y-2">
            {V.map((v) => (
              <p key={v.id} className="font-mono text-xs text-blanc-dim">
                {v.type} · {v.marque_modele ?? "—"} · {v.places} places {v.annee ? `· ${v.annee}` : ""}
              </p>
            ))}
            {V.length === 0 && <p className="text-sm text-blanc-faint">Aucun véhicule déclaré.</p>}
          </div>
        </div>

        <div className="card mb-10">
          <p className="font-semibold text-sm mb-4">
            Dates clés
          </p>
          <p className="font-mono text-xs text-blanc-dim leading-relaxed">
            Inscrit le {dt(t.created_at)}<br />
            {t.valide_at && <>Validé le {dt(t.valide_at)}<br /></>}
          </p>
        </div>

        <div className="mb-10">
          <h2 className="h-display text-xl mb-4">Missions ({M.length})</h2>
          <div className="space-y-3">
            {M.map((m) => (
              <div key={m.id} className="card flex items-center justify-between gap-4 flex-wrap">
                <p className="font-semibold text-sm">
                  {m.demande ? `#${m.demande.numero} — ${m.demande.depart_adresse} → ${m.demande.arrivee_adresse}` : "Retour à vide"}
                </p>
                <p className="font-mono text-xs text-blanc-faint">
                  {eur(m.prix_final)} · commission {eur(m.commission_montant)} · {m.statut}
                </p>
              </div>
            ))}
            {M.length === 0 && <p className="text-sm text-blanc-faint">Aucune mission.</p>}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="h-display text-xl mb-4">Avis ({A.length})</h2>
          <div className="space-y-3">
            {A.map((a) => (
              <div key={a.id} className="card">
                <p className="font-semibold text-sm">
                  <span className="text-ambre">{"★".repeat(a.note)}{"☆".repeat(5 - a.note)}</span>
                  <span className="ml-2.5 font-mono text-xs text-blanc-faint">{a.client?.nom ?? "Client"} · {dt(a.created_at)}</span>
                </p>
                {a.commentaire && <p className="text-sm text-blanc-dim mt-1.5">« {a.commentaire} »</p>}
              </div>
            ))}
            {A.length === 0 && <p className="text-sm text-blanc-faint">Aucun avis.</p>}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="h-display text-xl mb-4">Retours à vide ({R.length})</h2>
          <div className="space-y-3">
            {R.map((r) => (
              <div key={r.id} className="card flex items-center justify-between gap-4 flex-wrap">
                <p className="font-semibold text-sm">{r.depart_adresse} → {r.arrivee_adresse}</p>
                <p className="font-mono text-xs text-blanc-faint">{eur(r.prix_fixe)} · {dt(r.date_dispo)} · {r.statut}</p>
              </div>
            ))}
            {R.length === 0 && <p className="text-sm text-blanc-faint">Aucun retour à vide.</p>}
          </div>
        </div>

        {!t.suppression_demandee_at && (
          <div className="card border-[#E8735D]/30">
            <p className="font-semibold text-sm mb-1.5">Zone de danger</p>
            <p className="text-[12.5px] text-blanc-dim mb-4">
              Suppression manuelle du compte, en dehors de toute demande du transporteur.
            </p>
            <PilotageAction
              entity="transporteur"
              id={t.id}
              action="supprimer"
              label="Supprimer ce compte"
              confirm={aHistorique
                ? "Confirmer la suppression ? La fiche sera anonymisée et l'accès au compte définitivement bloqué. L'historique des missions et commissions sera conservé."
                : "Confirmer la suppression définitive et complète de ce compte ?"}
            />
          </div>
        )}
      </main>
    </>
  );
}
