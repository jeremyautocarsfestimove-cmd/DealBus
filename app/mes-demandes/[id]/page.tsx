import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import type { Demande, Offre, TransporteurAnonyme } from "@/lib/types";

export default async function DemandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: demande } = await supabase.from("demandes").select("*").eq("id", id).single();
  if (!demande) notFound();
  const d = demande as Demande;

  // Offres (devis) avec profil transporteur ANONYME uniquement
  const { data: offres } = await supabase
    .from("offres")
    .select("*, transporteur:transporteurs_anonymes(*)")
    .eq("demande_id", id)
    .order("prix_ttc", { ascending: true });

  // Meilleure enchère en cours — realtime à brancher côté client
  const { data: bestBid } = await supabase
    .from("bids")
    .select("prix_ttc")
    .eq("demande_id", id)
    .order("prix_ttc", { ascending: true })
    .limit(1)
    .maybeSingle();

  const list = (offres ?? []) as (Offre & { transporteur: TransporteurAnonyme })[];
  const minPrix = list[0]?.prix_ttc;
  const maxNote = Math.max(...list.map((o) => o.transporteur?.note_moyenne ?? 0), 0);

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">
          Demande #{d.numero} · {d.depart_adresse} → {d.arrivee_adresse}
        </p>

        {d.mode === "devis" ? (
          <>
            <h1 className="h-display text-4xl mb-3">Comparez vos offres.</h1>
            <p className="text-blanc-dim mb-10 max-w-xl">
              Profils anonymisés, un seul prix chacun — les transporteurs répondent en tir unique.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {list.map((o) => (
                <div key={o.id} className="card relative">
                  {o.prix_ttc === minPrix && (
                    <span className="absolute -top-px right-5 bg-ambre text-asphalte font-mono text-[10.5px] uppercase font-semibold px-2.5 py-1 rounded-b-sm">Prix le plus bas</span>
                  )}
                  {(o.transporteur?.note_moyenne ?? 0) === maxNote && maxNote > 0 && o.prix_ttc !== minPrix && (
                    <span className="absolute -top-px right-5 bg-vert text-asphalte font-mono text-[10.5px] uppercase font-semibold px-2.5 py-1 rounded-b-sm">Mieux noté</span>
                  )}
                  <p className="font-semibold text-sm mb-1">
                    Transporteur #{o.transporteur?.numero_anonyme}
                    <span className="ml-2 tag bg-vert-dim text-vert">Vérifié</span>
                  </p>
                  <p className="font-mono text-xs text-blanc-faint mb-4">
                    Dépt. {o.transporteur?.departement_siege} · ★ {o.transporteur?.note_moyenne ?? "—"}/5
                    ({o.transporteur?.nb_avis} avis · {o.transporteur?.nb_missions} missions)
                  </p>
                  <p className="font-mono text-3xl font-semibold border-t border-ligne pt-4 mb-2">
                    {Number(o.prix_ttc).toLocaleString("fr-FR")} €
                    <span className="text-xs text-blanc-faint font-normal ml-1.5">TTC</span>
                  </p>
                  <p className="text-[13px] text-blanc-dim mb-5">
                    {o.vehicule_type} · {o.vehicule_places} places{o.vehicule_annee ? ` · ${o.vehicule_annee}` : ""}
                  </p>
                  {/* TODO: server action de sélection → crée mission, révèle identités */}
                  <button className="btn-primary w-full">Retenir cette offre →</button>
                </div>
              ))}
              {!list.length && (
                <p className="text-blanc-dim col-span-3">Aucune offre reçue pour l&apos;instant — les transporteurs de votre zone ont été notifiés.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="h-display text-4xl mb-3">Enchère en direct.</h1>
            <div className="card max-w-lg">
              <p className="font-mono text-xs uppercase tracking-wider text-blanc-faint mb-2">Meilleure offre actuelle (anonyme)</p>
              <p className="font-mono text-5xl font-semibold text-vert mb-4">
                {bestBid ? `${Number(bestBid.prix_ttc).toLocaleString("fr-FR")} €` : "—"}
              </p>
              <p className="font-mono text-sm text-blanc-dim">
                Clôture : {d.enchere_fin ? new Date(d.enchere_fin).toLocaleString("fr-FR") : "—"}
              </p>
              <p className="mt-5 text-[13px] text-blanc-dim border-t border-ligne pt-4">
                L&apos;enchère va jusqu&apos;au bout du compte à rebours. À la clôture, vous validez
                (ou non) la meilleure offre — identités révélées uniquement à ce moment.
              </p>
              {/* TODO: composant client avec supabase.channel() pour le realtime + compte à rebours */}
            </div>
          </>
        )}
      </main>
    </>
  );
}
