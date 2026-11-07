import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contexteTransporteur, jourCourt, ville } from "@/lib/pro";

export const metadata = { title: "Avis — DealBus" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AvisProPage() {
  const ctx = await contexteTransporteur();
  if (!ctx?.transporteur || ctx.transporteur.statut !== "valide") redirect("/pro");
  const supabase = await createClient();
  const { data } = await supabase.from("avis")
    .select("*, client:profiles(nom), mission:missions(demande:demandes(numero, depart_adresse, arrivee_adresse, date_aller))")
    .eq("transporteur_id", ctx.user.id).order("created_at", { ascending: false });
  const A = (data ?? []) as any[];
  const moyenne = A.length ? (A.reduce((s, a) => s + Number(a.note), 0) / A.length).toFixed(1) : null;
  const repartition = [5, 4, 3, 2, 1].map((n) => ({ n, c: A.filter((a) => Number(a.note) === n).length }));

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="h-display text-4xl">Avis clients</h1>
          <p className="text-blanc-dim mt-1.5">Les clients notent la mission une fois réalisée. Votre note moyenne apparaît sur vos offres.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4 items-start">
        <div className="card">
          <p className="text-[12px] text-[#77756F] font-medium">Note moyenne</p>
          <p className="text-[40px] font-semibold tracking-tight leading-none mt-2">{moyenne ?? "—"}<span className="text-[18px] text-[#9A9893] font-normal">/5</span></p>
          <p className="text-[#F5A524] text-[18px] mt-1" aria-hidden="true">{"★".repeat(Math.round(Number(moyenne ?? 0)))}<span className="text-[#E7E6E2]">{"★".repeat(5 - Math.round(Number(moyenne ?? 0)))}</span></p>
          <p className="text-[12.5px] text-[#77756F] mt-1">{A.length} avis · {ctx.transporteur.nb_missions} missions réalisées</p>
          <div className="mt-4 space-y-1.5">
            {repartition.map((r) => (
              <div key={r.n} className="flex items-center gap-2 text-[12px]">
                <span className="w-3 text-[#77756F]">{r.n}</span>
                <div className="flex-1 h-1.5 rounded bg-[#F1F0ED] overflow-hidden"><div className="h-full bg-[#F5A524]" style={{ width: A.length ? `${(r.c / A.length) * 100}%` : 0 }} /></div>
                <span className="w-4 text-right text-[#9A9893]">{r.c}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {A.map((a) => {
            const t = a.mission?.demande;
            return (
              <div key={a.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[#F5A524] text-[15px]" aria-label={`${a.note} sur 5`}>{"★".repeat(Number(a.note))}<span className="text-[#E7E6E2]">{"★".repeat(5 - Number(a.note))}</span></p>
                    <p className="font-semibold mt-1">{a.client?.nom ?? "Client DealBus"}</p>
                  </div>
                  <p className="text-[12px] text-[#9A9893]">{jourCourt(a.created_at)}</p>
                </div>
                {a.commentaire ? <p className="mt-3 text-[13.5px] leading-6 text-[#3A3936] whitespace-pre-line">« {a.commentaire} »</p> : <p className="mt-3 text-[13px] text-[#9A9893] italic">Pas de commentaire.</p>}
                {t && <p className="mt-3 pt-3 border-t border-ligne text-[12px] text-[#77756F]">Mission #{t.numero} · {ville(t.depart_adresse)} → {ville(t.arrivee_adresse)} · {jourCourt(t.date_aller)}</p>}
              </div>
            );
          })}
          {A.length === 0 && <div className="card py-10 text-center"><p className="font-semibold">Aucun avis pour le moment</p><p className="text-[13px] text-blanc-dim mt-1">Les avis apparaîtront dès qu&apos;un client aura évalué une mission terminée.</p></div>}
        </div>
      </div>
    </>
  );
}
