import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { AideWidget } from "@/components/AideWidget";

export const metadata = { title: "Aide — DealBus" };

// Version pleine page de la bulle « Aide » : cible des liens dans les emails.
export default function AidePage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-7 py-14">
        <p className="eyebrow mb-3">Aide</p>
        <h1 className="h-display text-4xl mb-6">Une question ? On est là.</h1>
        <Suspense>
          <AideWidget ouvertParDefaut pleinePage />
        </Suspense>
      </main>
    </>
  );
}
