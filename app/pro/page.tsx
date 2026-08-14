import Link from "next/link";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import type { Demande } from "@/lib/types";

export default async function ProPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: transporteur } = await supabase
    .from("transporteurs")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  // Pas encore transporteur → onboarding (validation manuelle par l'admin)
  if (!transporteur) {
    return (
      <>
        <Nav />
        <main className="max-w-2xl mx-auto px-7 py-14">
          <p className="eyebrow mb-4" style={{ color: "#34B37A" }}>Espace transporteur</p>
          <h1 className="h-display text-4xl mb-4">Devenir partenaire.</h1>
          <p className="text-blanc-dim mb-8">
            Inscription gratuite. Votre licence de transport et votre RC Pro sont
            vérifiées manuellement avant l&apos;accès aux demandes.
          </p>
          {/* TODO: formulaire d'inscription transporteur (raison sociale, SIREN,
              licence, upload RC Pro vers bucket) → statut 'en_attente' */}
          <div className="card">
            <p className="font-mono text-sm text-blanc-dim">Formulaire d&apos;inscription — à brancher.</p>
          </div>
        </main>
      </>
    );
  }

  if (transporteur.statut !== "valide") {
    return (
      <>
        <Nav />
        <main className="max-w-2xl mx-auto px-7 py-14">
          <h1 className="h-display text-4xl mb-4">Compte en cours de validation.</h1>
          <p className="text-blanc-dim">
            Nos équipes vérifient votre licence et votre RC Pro. Vous recevrez un
            email dès l&apos;activation de votre accès aux demandes.
          </p>
        </main>
      </>
    );
  }

  // Leads : demandes ouvertes dans les zones du transporteur (RLS filtre déjà)
  const { data: leads } = await supabase
    .from("demandes")
    .select("*")
    .eq("statut", "ouverte")
    .order("created_at", { ascending: false });

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4" style={{ color: "#34B37A" }}>Espace transporteur</p>
        <h1 className="h-display text-4xl mb-2">Vos leads.</h1>
        <p className="font-mono text-xs text-blanc-faint mb-10">
          {transporteur.raison_sociale} · ★ {transporteur.note_moyenne ?? "—"}/5 ·
          {" "}{transporteur.nb_avis} avis · {transporteur.nb_missions} missions
        </p>

        <div className="space-y-3.5">
          {(leads as Demande[] | null)?.map((d) => (
            <Link key={d.id} href={`/pro/leads/${d.id}`} className="card block hover:border-ligne-strong transition">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                <span className="flex items-center gap-3 font-condensed font-semibold text-xl uppercase">
                  <span className={d.mode === "enchere" ? "tag-enchere" : "tag-devis"}>
                    {d.mode === "enchere" ? "Enchère" : "Devis"}
                  </span>
                  {d.depart_adresse} <span className="text-blanc-faint font-sans normal-case font-normal">→</span> {d.arrivee_adresse}
                </span>
                <span className="font-mono text-[11.5px] uppercase tracking-wider text-blanc-faint">
                  Client anonyme
                </span>
              </div>
              <p className="font-mono text-xs text-blanc-faint">
                {new Date(d.date_aller).toLocaleDateString("fr-FR")} · {d.passagers} passagers · Demande #{d.numero}
              </p>
            </Link>
          ))}
          {!leads?.length && <p className="text-blanc-dim">Aucune demande ouverte dans vos zones pour l&apos;instant.</p>}
        </div>
      </main>
    </>
  );
}
