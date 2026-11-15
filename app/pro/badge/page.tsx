import { redirect } from "next/navigation";
import { contexteTransporteur } from "@/lib/pro";
import { Copier } from "./copier";

export const metadata = { title: "Badge partenaire — DealBus" };

const CODE_BADGE = `<a href="https://dealbus.fr" title="DealBus, devis d'autocar avec chauffeur"><img src="https://dealbus.fr/badge-partenaire.svg" alt="Partenaire DealBus, devis d'autocar avec chauffeur" width="200" height="60"></a>`;
const CODE_TEXTE = `Partenaire <a href="https://dealbus.fr">DealBus</a>, la plateforme de devis d'autocar avec chauffeur.`;

export default async function BadgeProPage() {
  const ctx = await contexteTransporteur();
  if (!ctx?.transporteur || ctx.transporteur.statut !== "valide") redirect("/pro");

  return (
    <>
      <div className="mb-6">
        <h1 className="h-display text-4xl">Badge partenaire</h1>
        <p className="text-blanc-dim mt-1.5 max-w-2xl">
          Affichez sur votre site que vous recevez des demandes via DealBus. Vos visiteurs voient que votre entreprise a été vérifiée, et chaque site qui affiche le badge aide la plateforme à vous apporter plus de demandes.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <p className="font-semibold mb-1">Le badge</p>
          <p className="text-sm text-blanc-dim mb-4">À coller dans le pied de page de votre site, ou sur votre page « Partenaires ».</p>
          <div className="rounded-2xl bg-[#F4F3F0] p-6 grid place-items-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/badge-partenaire.svg" alt="Partenaire DealBus" width={200} height={60} />
          </div>
          <Copier code={CODE_BADGE} />
        </div>

        <div className="card">
          <p className="font-semibold mb-1">La version texte</p>
          <p className="text-sm text-blanc-dim mb-4">Si vous préférez une simple ligne, sans image.</p>
          <div className="rounded-2xl bg-[#F4F3F0] p-6 text-sm mb-4">
            Partenaire <span className="underline">DealBus</span>, la plateforme de devis d&apos;autocar avec chauffeur.
          </div>
          <Copier code={CODE_TEXTE} />
        </div>
      </div>

      <p className="text-[12.5px] text-[#9A9893] mt-4">
        Vous ne gérez pas votre site vous-même ? Transmettez le code à la personne qui s&apos;en occupe : il suffit de le coller tel quel.
      </p>
    </>
  );
}
