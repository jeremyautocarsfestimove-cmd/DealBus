import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { lireMaintenance } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Site en travaux — DealBus",
  robots: { index: false, follow: false },
};

// Page servie (en 503) à tous les visiteurs non-admin quand le mode travaux
// est actif depuis /admin/parametres. Le middleware réécrit vers ici.
export default async function MaintenancePage() {
  const m = await lireMaintenance(true);
  const retour = m.retour ? new Date(m.retour) : null;
  const retourOk = retour && !Number.isNaN(retour.getTime());

  return (
    <main className="sombre min-h-screen bg-asphalte text-blanc flex flex-col">
      <header className="px-7 py-5">
        <span className="text-ambre"><Logo /></span>
      </header>
      <section className="flex-1 flex items-center">
        <div className="max-w-2xl mx-auto px-7 py-16">
          <p className="eyebrow mb-4">Nous revenons très vite</p>
          <h1 className="h-display text-[clamp(2.4rem,6vw,4.2rem)] leading-[1] mb-6">
            Le site est en travaux.
          </h1>
          <p className="text-lg text-blanc-dim leading-relaxed mb-6">
            {m.message || "Nous améliorons DealBus en ce moment même. Vos demandes et vos offres en cours sont conservées : rien n'est perdu."}
          </p>
          {retourOk && (
            <p className="font-mono text-sm text-blanc-faint mb-8">
              Retour prévu {retour.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-ligne">
            <a href="mailto:contact@dealbus.fr" className="btn-ghost">Une urgence ? contact@dealbus.fr</a>
            <Link href="/login" className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint hover:text-blanc">
              Accès équipe
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
