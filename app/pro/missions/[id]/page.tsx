import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import type { Demande } from "@/lib/types";
import { DevisForm } from "./devis-form";
import { EnchereForm } from "./enchere-form";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: demande } = await supabase.from("demandes").select("*").eq("id", id).single();
  if (!demande) notFound();
  const d = demande as Demande;

  // Devis déjà envoyé ? (tir unique)
  const { data: monOffre } = await supabase
    .from("offres")
    .select("prix_ttc")
    .eq("demande_id", id)
    .eq("transporteur_id", user!.id)
    .maybeSingle();

  // Meilleure enchère actuelle
  const { data: bestBid } = await supabase
    .from("bids")
    .select("prix_ttc")
    .eq("demande_id", id)
    .order("prix_ttc", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-7 py-14">
        <div className="flex justify-end mb-8">
          <Link
            href="/pro"
            className="inline-flex items-center border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-blanc-dim hover:border-white/30 hover:text-blanc transition"
          >
            Retour
          </Link>
        </div>
        <p className="eyebrow mb-4">
          Demande #{d.numero} · Client anonyme
        </p>
        <h1 className="h-display text-4xl mb-2">
          {d.depart_adresse} → {d.arrivee_adresse}
        </h1>
        <p className="font-mono text-xs text-blanc-faint mb-10">
          {new Date(d.date_aller).toLocaleDateString("fr-FR")}
          {d.date_retour ? ` → ${new Date(d.date_retour).toLocaleDateString("fr-FR")}` : ""} ·
          {" "}{d.passagers} passagers · {d.type_trajet.replace("_", "-")}
        </p>

        {d.mode === "devis" ? (
          monOffre ? (
            <div className="card">
              <p className="flex items-center gap-2.5 text-sm text-blanc-dim">
                <span className="w-1.5 h-1.5 rounded-full bg-vert" />
                Offre envoyée : <strong className="font-mono">{Number(monOffre.prix_ttc).toLocaleString("fr-FR")} €</strong>
                — en attente de la décision du client.
              </p>
            </div>
          ) : (
            <DevisForm demandeId={id} />
          )
        ) : (
          <EnchereForm
            demandeId={id}
            enchereFin={d.enchere_fin}
            bestPrix={bestBid?.prix_ttc ?? d.prix_estime ?? null}
          />
        )}
      </main>
    </>
  );
}
