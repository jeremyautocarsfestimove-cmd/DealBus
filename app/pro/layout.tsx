import Link from "next/link";
import { Nav } from "@/components/Nav";
import { contexteTransporteur, initiales } from "@/lib/pro";
import { ProTabs } from "./ProTabs";
import "./pro.css";

export const metadata = { title: "Espace transporteur — DealBus" };

// Enveloppe de l'espace transporteur : barre du site, puis barre d'onglets.
// Les pages non validées (inscription, en attente) gardent la mise en page du site.
export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const ctx = await contexteTransporteur();
  const valide = ctx?.transporteur && ctx.transporteur.statut === "valide" && ctx.compteurs;

  if (!valide) {
    return (
      <>
        <Nav />
        {children}
      </>
    );
  }

  return (
    <>
      <Nav />
    <div className="pro">
      <div className="pro-bar">
        <div className="max-w-[1240px] mx-auto px-5 lg:px-7 h-[52px] flex items-center justify-between gap-4">
          <ProTabs compteurs={ctx.compteurs!} />
          <Link href="/pro/profil" className="hidden md:flex items-center gap-2.5 text-[13px] font-medium whitespace-nowrap">
            <span className="w-[30px] h-[30px] rounded-full bg-[#111] text-[#F5A524] grid place-items-center text-[11px] font-bold">{initiales(ctx.transporteur!.raison_sociale)}</span>
            {ctx.transporteur!.raison_sociale}
          </Link>
        </div>
      </div>
      <main className="max-w-[1240px] mx-auto px-5 lg:px-7 py-7 lg:py-8">{children}</main>
    </div>
    </>
  );
}
