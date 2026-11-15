import { Nav } from "@/components/Nav";
import { contexteTransporteur } from "@/lib/pro";
import { AccepterCgu } from "./AccepterCgu";
import { CGU_VERSION } from "@/lib/cgu";
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

  if (ctx.transporteur!.cgu_version !== CGU_VERSION) {
    return (
      <>
        <Nav />
        <div className="pro"><main className="max-w-[1240px] mx-auto px-5 lg:px-7 py-10"><AccepterCgu premiereFois={!ctx.transporteur!.cgu_version} raisonSociale={ctx.transporteur!.raison_sociale} /></main></div>
      </>
    );
  }

  return (
    <>
      <Nav pro={ctx.compteurs!} />
      <div className="pro">
        {/* Même largeur que la capsule du menu : marge de 12 px, 1152 px au plus */}
        <main className="px-3 py-7 lg:py-8"><div className="max-w-6xl mx-auto">{children}</div></main>
      </div>
    </>
  );
}
