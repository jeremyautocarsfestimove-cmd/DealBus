import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contexteTransporteur, jourCourt, ville } from "@/lib/pro";

export const metadata = { title: "Factures — DealBus" };

const euro2 = (n: number) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const STATUT: Record<string, { label: string; cls: string }> = {
  emise: { label: "À régler", cls: "bg-[#FFF4E0] text-[#B26A00]" },
  payee: { label: "Payée", cls: "bg-[#E6F6EE] text-[#1A7F52]" },
  annulee: { label: "Annulée", cls: "bg-[#F1F0ED] text-[#55534E]" },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function FacturesProPage() {
  const ctx = await contexteTransporteur();
  if (!ctx?.transporteur || ctx.transporteur.statut !== "valide") redirect("/pro");
  const supabase = await createClient();
  const { data } = await supabase.from("factures")
    .select("*, mission:missions(id, prix_final, commission_taux, demande:demandes(numero, depart_adresse, arrivee_adresse))")
    .eq("transporteur_id", ctx.user.id).order("emise_le", { ascending: false });
  const F = (data ?? []) as any[];
  const aRegler = F.filter((f) => f.statut === "emise");
  const total = (l: any[]) => l.reduce((s, f) => s + Number(f.montant_ttc), 0);

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="h-display text-4xl">Factures de commission</h1>
          <p className="text-blanc-dim mt-1.5">Une facture par mission, émise le lendemain du transport et envoyée par email, payable à réception. La TVA de 20 % est récupérable.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="pro-kpi"><p>À régler</p><b>{euro2(total(aRegler))}</b><small>{aRegler.length} facture{aRegler.length > 1 ? "s" : ""}</small></div>
        <div className="pro-kpi"><p>Réglé</p><b>{euro2(total(F.filter((f) => f.statut === "payee")))}</b><small>{F.filter((f) => f.statut === "payee").length} facture{F.filter((f) => f.statut === "payee").length > 1 ? "s" : ""}</small></div>
        <div className="pro-kpi hidden lg:block"><p>Comment ça marche</p><small className="!mt-2 leading-relaxed">Le client vous règle le transport en direct. DealBus vous facture uniquement sa commission, une fois le transport effectué.</small></div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] text-[#8A8882] font-medium">
              <th className="px-5 py-3 border-b border-ligne">N°</th><th className="px-5 py-3 border-b border-ligne">Mission</th><th className="px-5 py-3 border-b border-ligne">Transport du</th><th className="px-5 py-3 border-b border-ligne">Commission</th>
              <th className="px-5 py-3 border-b border-ligne text-right">HT</th><th className="px-5 py-3 border-b border-ligne text-right">TTC</th><th className="px-5 py-3 border-b border-ligne">Statut</th>
            </tr>
          </thead>
          <tbody>
            {F.map((f) => {
              const d = f.mission?.demande;
              return (
                <tr key={f.id} className="border-b border-ligne last:border-0">
                  <td className="px-5 py-3.5 font-medium">{f.numero ?? "en cours"}</td>
                  <td className="px-5 py-3.5">{d ? <Link href={`/pro/missions/${f.mission.id}`} className="hover:underline">{ville(d.depart_adresse)} → {ville(d.arrivee_adresse)} <span className="text-[#9A9893]">#{d.numero}</span></Link> : "Retour à vide"}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">{jourCourt(f.date_transport)}</td>
                  <td className="px-5 py-3.5 text-[#55534E] whitespace-nowrap">{f.mission ? `${Number(f.mission.commission_taux)} % de ${Number(f.mission.prix_final).toLocaleString("fr-FR")} €` : ""}</td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">{euro2(f.montant_ht)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold whitespace-nowrap">{euro2(f.montant_ttc)}</td>
                  <td className="px-5 py-3.5"><span className={`tag ${STATUT[f.statut]?.cls}`}>{STATUT[f.statut]?.label ?? f.statut}</span></td>
                </tr>
              );
            })}
            {F.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-blanc-dim">Aucune facture pour l&apos;instant. La première sera émise le lendemain de votre première mission réalisée.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-[12.5px] text-[#9A9893] mt-3">Le PDF de chaque facture vous est envoyé par email à l&apos;adresse de votre compte. Besoin d&apos;un duplicata : écrivez à contact@dealbus.fr.</p>
    </>
  );
}
