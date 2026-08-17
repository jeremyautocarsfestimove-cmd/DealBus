import { Nav } from "@/components/Nav";
import { BackButton } from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import type { Demande, Offre, TransporteurAnonyme } from "@/lib/types";
import { RetenirOffre, EnchereCliente, AvisForm } from "./client-actions";
import { ItineraireMap } from "@/components/ItineraireMap";

const eur = (n: number) => Number(n).toLocaleString("fr-FR") + " €";

export default async function DemandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: demande, error: demandeError } = await supabase
    .from("demandes").select("*").eq("id", id).maybeSingle();
  if (!demande) {
    return (
      <>
        <Nav />
        <main className="max-w-2xl mx-auto px-7 py-24 text-center">
          <h1 className="h-display text-3xl mb-4">Demande introuvable.</h1>
          <p className="text-blanc-dim">
            {!user
              ? "Connectez-vous avec le compte qui a créé cette demande pour la consulter."
              : "Cette demande n'existe pas ou n'est pas rattachée à votre compte."}
          </p>
          {demandeError && (
            <p className="font-mono text-xs text-blanc-faint mt-4">({demandeError.message})</p>
          )}
        </main>
      </>
    );
  }
  const d = demande as Demande & { statut: string; client_id: string };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data: mission } = await supabase
    .from("missions")
    .select("*, transporteur:transporteurs(raison_sociale), contact:transporteur_id")
    .eq("demande_id", id)
    .maybeSingle() as { data: any };

  let transporteurProfile: { nom: string | null; telephone: string | null; email: string | null } | null = null;
  if (mission) {
    const { data } = await supabase
      .from("profiles")
      .select("nom, telephone, email")
      .eq("id", mission.transporteur_id)
      .maybeSingle();
    transporteurProfile = data;
  }

  const { data: monAvis } = mission
    ? await supabase.from("avis").select("note").eq("mission_id", mission.id).maybeSingle()
    : { data: null };

  const annulationSignalee =
    !!mission &&
    !!mission.annulation_motif &&
    (mission.statut === "annulee" || mission.statut === "litige");

  const annulationConfirmee = mission?.statut === "annulee";

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-7 py-14">
        <div className="mb-8">
          <BackButton href="/mes-demandes" />
        </div>

        <p className="eyebrow mb-4">
          Demande #{d.numero} · {d.depart_adresse} → {d.arrivee_adresse}
        </p>
        <ItineraireMap
          depart={d.depart_adresse}
          arrivee={d.arrivee_adresse}
          allerRetour={d.type_trajet === "aller_retour"}
        />

        {mission ? (
          <>
            {annulationSignalee ? (
              <div className="mb-6 max-w-2xl rounded-lg border border-[#E8735D]/45 bg-[#E8735D]/10 px-5 py-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8735D]/15 text-lg font-bold text-[#E8735D]">
                    !
                  </span>
                  <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E8735D]">
                      {annulationConfirmee
                        ? "Mission annulée"
                        : "Annulation signalée par le transporteur"}
                    </p>

                    <h1 className="h-display mt-1 text-3xl">
                      {annulationConfirmee
                        ? "Votre réservation a été annulée."
                        : "Le transporteur a demandé l’annulation de votre réservation."}
                    </h1>

                    <p className="mt-2 text-sm text-blanc-dim">
                      {annulationConfirmee
                        ? "Cette annulation a été enregistrée sur votre demande."
                        : "DealBus a été informé et l’annulation est actuellement en cours de traitement par l’administration."}
                    </p>

                    <div className="mt-4 rounded-md border border-[#E8735D]/25 bg-asphalte/40 px-4 py-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-blanc-faint">
                        Motif communiqué par le transporteur
                      </p>
                      <p className="mt-1 text-sm text-blanc">{mission.annulation_motif}</p>
                    </div>

                    {!annulationConfirmee && (
                      <p className="mt-3 font-mono text-[11px] text-[#E8735D]">
                        Statut : en attente de traitement DealBus
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <h1 className="h-display text-4xl mb-3">Transporteur sélectionné.</h1>
            )}

            <div className={`card max-w-xl ${annulationSignalee ? "border-[#E8735D]/35" : "border-vert/30"}`}>
              <p className="font-semibold text-lg mb-1">{mission.transporteur?.raison_sociale}</p>

              <p className="font-mono text-sm text-blanc-dim mb-4">
                Contact : {transporteurProfile?.nom ?? "—"}
                {transporteurProfile?.telephone ? ` · ${transporteurProfile.telephone}` : ""}
                {transporteurProfile?.email ? ` · ${transporteurProfile.email}` : ""}
              </p>

              <p className="font-mono text-3xl font-semibold border-t border-ligne pt-4 mb-1">
                {eur(mission.prix_final)}
                <span className="text-xs text-blanc-faint font-normal ml-1.5">TTC</span>
              </p>

              <p className="font-mono text-xs text-blanc-faint">
                Sélectionné via {mission.source === "enchere" ? "enchère" : "devis"} ·{" "}
                {annulationSignalee
                  ? annulationConfirmee
                    ? "annulée"
                    : "annulation en cours de traitement"
                  : mission.statut === "a_venir"
                    ? "trajet à venir"
                    : mission.statut === "terminee_declaree"
                      ? "trajet effectué"
                      : mission.statut}
              </p>

              {!annulationSignalee && (
                <p className="text-[13px] text-blanc-dim mt-4 bg-vert-dim border border-vert/30 rounded-sm px-4 py-3">
                  Vous payez le transporteur directement — DealBus ne prélève rien côté client.
                </p>
              )}

              {mission.statut === "terminee_declaree" && !monAvis && user && (
                <AvisForm
                  missionId={mission.id}
                  clientId={user.id}
                  transporteurId={mission.transporteur_id}
                />
              )}

              {monAvis && (
                <p className="border-t border-ligne pt-4 mt-5 font-mono text-sm text-blanc-dim">
                  Merci pour votre avis !{" "}
                  <span className="text-ambre">{"★".repeat(monAvis.note)}</span>
                </p>
              )}
            </div>
          </>
        ) : d.statut !== "ouverte" ? (
          <>
            <h1 className="h-display text-4xl mb-3">Demande close.</h1>
            <p className="text-blanc-dim">
              Cette demande a été {d.statut === "annulee" ? "annulée" : "close sans sélection"}.
            </p>
          </>
        ) : d.mode === "devis" ? (
          <DevisView demandeId={id} />
        ) : (
          <>
            <h1 className="h-display text-4xl mb-3">Enchère en direct.</h1>
            <EnchereClienteWrapper demandeId={id} enchereFin={d.enchere_fin} />
          </>
        )}
      </main>
    </>
  );
}

async function DevisView({ demandeId }: { demandeId: string }) {
  const supabase = await createClient();
  // Deux requêtes séparées : la jointure sur une VUE (transporteurs_anonymes)
  // peut échouer silencieusement après recréation de la vue — plus jamais ça.
  const { data: offres } = await supabase
    .from("offres")
    .select("*")
    .eq("demande_id", demandeId)
    .order("prix_ttc", { ascending: true });

  const ids = (offres ?? []).map((o) => o.transporteur_id);
  const { data: transporteurs } = ids.length
    ? await supabase.from("transporteurs_anonymes").select("*").in("id", ids)
    : { data: [] };
  const parId = new Map((transporteurs ?? []).map((t) => [t.id, t]));

  const list = (offres ?? []).map((o) => ({
    ...o,
    transporteur: parId.get(o.transporteur_id) ?? null,
  })) as (Offre & { transporteur: TransporteurAnonyme | null })[];
  const minPrix = list[0]?.prix_ttc;
  const maxNote = Math.max(...list.map((o) => o.transporteur?.note_moyenne ?? 0), 0);

  return (
    <>
      <h1 className="h-display text-4xl mb-3">Comparez vos offres.</h1>
      <p className="text-blanc-dim mb-10 max-w-xl">
        Profils anonymisés, un seul prix chacun — les transporteurs répondent en tir unique.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        {list.map((o) => (
          <div key={o.id} className="card relative">
            {o.prix_ttc === minPrix && (
              <span className="absolute -top-px right-5 bg-ambre text-asphalte font-mono text-[10.5px] uppercase font-semibold px-2.5 py-1 rounded-b-sm">
                Prix le plus bas
              </span>
            )}

            {(o.transporteur?.note_moyenne ?? 0) === maxNote &&
              maxNote > 0 &&
              o.prix_ttc !== minPrix && (
                <span className="absolute -top-px right-5 bg-vert text-asphalte font-mono text-[10.5px] uppercase font-semibold px-2.5 py-1 rounded-b-sm">
                  Mieux noté
                </span>
              )}

            <p className="font-semibold text-sm mb-1">
              Transporteur #{o.transporteur?.numero_anonyme}
              <span className="ml-2 tag bg-vert-dim text-vert">Vérifié</span>
            </p>

            <p className="font-mono text-xs text-blanc-faint mb-4">
              Dépt. {o.transporteur?.departement_siege} · ★{" "}
              {o.transporteur?.note_moyenne ?? "—"}/5
              ({o.transporteur?.nb_avis} avis · {o.transporteur?.nb_missions} missions)
            </p>

            <p className="font-mono text-3xl font-semibold border-t border-ligne pt-4 mb-2">
              {Number(o.prix_ttc).toLocaleString("fr-FR")} €
              <span className="text-xs text-blanc-faint font-normal ml-1.5">TTC</span>
            </p>

            <p className="text-[13px] text-blanc-dim mb-4">
              {o.vehicule_type} · {o.vehicule_places} places
              {o.vehicule_annee ? ` · ${o.vehicule_annee}` : ""}
            </p>

            {(o.conditions || o.transporteur?.cgv) && (
              <details className="mb-5 group">
                <summary className="font-mono text-[11.5px] uppercase tracking-wider text-blanc-faint cursor-pointer hover:text-blanc-dim">
                  Conditions du transporteur ▾
                </summary>
                <div className="mt-2.5 text-[12.5px] text-blanc-dim border border-ligne rounded-sm px-3.5 py-3 whitespace-pre-line">
                  {[o.conditions, o.transporteur?.cgv].filter(Boolean).join("\n\n")}
                </div>
              </details>
            )}

            <RetenirOffre offreId={o.id} />
          </div>
        ))}

        {!list.length && (
          <p className="text-blanc-dim col-span-3">
            Aucune offre reçue pour l&apos;instant — les transporteurs de votre zone ont été notifiés.
          </p>
        )}
      </div>
    </>
  );
}

async function EnchereClienteWrapper({
  demandeId,
  enchereFin,
}: {
  demandeId: string;
  enchereFin: string | null;
}) {
  const supabase = await createClient();
  const { data: bestBid } = await supabase
    .from("bids")
    .select("prix_ttc")
    .eq("demande_id", demandeId)
    .order("prix_ttc", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <EnchereCliente
      demandeId={demandeId}
      enchereFin={enchereFin}
      initialBest={bestBid ? Number(bestBid.prix_ttc) : null}
    />
  );
}