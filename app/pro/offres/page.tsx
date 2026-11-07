import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contexteTransporteur, eur, jourCourt, ville, dateFuture } from "@/lib/pro";
import { FEATURES } from "@/lib/features";

export const metadata = { title: "Mes offres — DealBus" };

const STATUT: Record<string, { label: string; cls: string }> = {
  envoyee: { label: "En attente", cls: "bg-[#F1F0ED] text-[#55534E]" },
  consultee: { label: "Consultée par le client", cls: "bg-[#E8EEFF] text-[#3451B2]" },
  retenue: { label: "Retenue", cls: "bg-[#E6F6EE] text-[#1A7F52]" },
  non_retenue: { label: "Non retenue", cls: "bg-[#FDE8E4] text-[#C2410C]" },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function OffresPage() {
  const ctx = await contexteTransporteur();
  if (!ctx?.transporteur || ctx.transporteur.statut !== "valide") redirect("/pro");
  const supabase = await createClient();
  const [{ data: offres }, { data: bids }, { data: nonLus }] = await Promise.all([
    supabase.from("offres").select("*, demande:demandes(id, numero, depart_adresse, arrivee_adresse, date_aller, date_retour, passagers, statut)").eq("transporteur_id", ctx.user.id).order("created_at", { ascending: false }),
    FEATURES.enchere ? supabase.from("bids").select("*, demande:demandes(id, numero, depart_adresse, arrivee_adresse, enchere_fin, statut)").eq("transporteur_id", ctx.user.id) : Promise.resolve({ data: [] as any[] }),
    supabase.from("messages").select("demande_id").eq("transporteur_id", ctx.user.id).neq("auteur_id", ctx.user.id).is("lu_le", null),
  ]);
  const nonLusPar = new Map<string, number>();
  for (const m of (nonLus ?? []) as any[]) nonLusPar.set(m.demande_id, (nonLusPar.get(m.demande_id) ?? 0) + 1);

  const O = (offres ?? []) as any[];
  const active = (o: any) => ["envoyee", "consultee"].includes(o.statut) && ["ouverte", "selection"].includes(o.demande?.statut ?? "ouverte") && dateFuture(o.demande?.date_aller);
  const actives = O.filter(active);
  const archives = O.filter((o) => !active(o));

  const encheres = new Map<string, { demande: any; mienne: number; nb: number }>();
  for (const b of (bids ?? []) as any[]) {
    const k = b.demande?.id ?? b.demande_id;
    const c = encheres.get(k);
    if (!c) encheres.set(k, { demande: b.demande, mienne: Number(b.prix_ttc), nb: 1 });
    else { c.mienne = Math.min(c.mienne, Number(b.prix_ttc)); c.nb++; }
  }
  const encheresActives = [...encheres.values()].filter((e) => e.demande?.statut === "ouverte" && (!e.demande?.enchere_fin || new Date(e.demande.enchere_fin) > new Date()));

  const Ligne = ({ o, estompe }: { o: any; estompe?: boolean }) => {
    const s = STATUT[o.statut] ?? { label: o.statut, cls: "bg-[#F1F0ED] text-[#55534E]" };
    const msgs = nonLusPar.get(o.demande_id) ?? 0;
    return (
      <Link href={`/pro/leads/${o.demande_id}`} className={`pro-lead ${estompe ? "opacity-70" : ""}`}>
        <div className="min-w-0">
          <p className="pro-route">{ville(o.demande?.depart_adresse ?? "")}<i>→</i>{ville(o.demande?.arrivee_adresse ?? "")}
            {msgs > 0 && <span className="tag bg-[#F5A524] text-[#111] ml-2 align-middle">{msgs} message{msgs > 1 ? "s" : ""}</span>}
          </p>
          <div className="pro-meta"><span>#{o.demande?.numero}</span><span><b>{jourCourt(o.demande?.date_aller)}</b></span><span><b>{o.demande?.passagers}</b> passagers</span><span>envoyée le {jourCourt(o.created_at)}</span></div>
        </div>
        <div className="text-[12px] text-[#77756F]">Votre offre<b className="block text-[16px] text-[#111] font-semibold">{eur(o.prix_ttc)}</b>{o.vehicule_type} · {o.vehicule_places} pl.</div>
        <div className="md:text-right"><span className={`tag ${s.cls}`}>{s.label}</span></div>
      </Link>
    );
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="h-display text-4xl">Mes offres</h1>
          <p className="text-blanc-dim mt-1.5">Les offres encore actives sont en haut. Les offres terminées sont archivées en bas de page.</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden mb-6">
        {actives.map((o) => <Ligne key={o.id} o={o} />)}
        {encheresActives.map((e, i) => (
          <Link key={`e${i}`} href={`/pro/leads/${e.demande?.id}`} className="pro-lead">
            <div><p className="pro-route">{ville(e.demande?.depart_adresse ?? "")}<i>→</i>{ville(e.demande?.arrivee_adresse ?? "")}<span className="tag-enchere ml-2 align-middle">Enchère</span></p><div className="pro-meta"><span>#{e.demande?.numero}</span><span>{e.nb} relance{e.nb > 1 ? "s" : ""}</span></div></div>
            <div className="text-[12px] text-[#77756F]">Votre meilleure relance<b className="block text-[16px] text-[#111] font-semibold">{eur(e.mienne)}</b></div>
            <div className="md:text-right"><span className="tag bg-[#E6F6EE] text-[#1A7F52]">En direct</span></div>
          </Link>
        ))}
        {actives.length + encheresActives.length === 0 && <p className="px-5 py-10 text-center text-blanc-dim">Aucune offre en cours. <Link href="/pro" className="font-semibold underline">Voir les demandes</Link></p>}
      </div>

      {archives.length > 0 && (
        <details className="card p-0 overflow-hidden">
          <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#FAFAF8]">
            <span className="font-semibold">Archives</span>
            <span className="text-[12px] text-[#9A9893]">{archives.length} offre{archives.length > 1 ? "s" : ""} passée{archives.length > 1 ? "s" : ""} ▾</span>
          </summary>
          <div className="border-t border-ligne">{archives.map((o) => <Ligne key={o.id} o={o} estompe />)}</div>
        </details>
      )}
    </>
  );
}
