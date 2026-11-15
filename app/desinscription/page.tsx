import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { verifierLien } from "@/lib/desinscription";
import { Confirmer } from "./confirmer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Désinscription — DealBus",
  robots: { index: false, follow: false },
};

export default async function DesinscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ l?: string; i?: string; k?: string }>;
}) {
  const { l, i, k } = await searchParams;
  const valide = verifierLien(l ?? null, i ?? null, k ?? null) !== null;

  return (
    <main className="sombre min-h-screen bg-asphalte text-blanc flex flex-col">
      <header className="px-7 py-5">
        <Link href="/" className="text-ambre"><Logo /></Link>
      </header>
      <section className="flex-1 flex items-center">
        <div className="max-w-xl mx-auto px-7 py-16 w-full">
          {valide ? (
            <Confirmer requete={`l=${l}&i=${i}&k=${k}`} />
          ) : (
            <>
              <h1 className="h-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] mb-5">Ce lien n&apos;est plus valable.</h1>
              <p className="text-blanc-dim leading-relaxed">
                Pour ne plus recevoir nos messages, écrivez « STOP » à{" "}
                <a href="mailto:contact@dealbus.fr?subject=STOP" className="text-ambre underline">contact@dealbus.fr</a>.
                Votre adresse sera retirée.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
