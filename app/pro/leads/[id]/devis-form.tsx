"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TYPES_VEHICULES } from "../../pro-actions";
import { INCLUS, coutDeRevient, eur, commissionTaux, type PlanMission, type Tarifs } from "@/lib/assistant-demande";
import { FEATURES } from "@/lib/features";

type Vehicule = { id: string; type: string; marque_modele: string | null; places: number; annee: number | null };

export function DevisForm({
  demandeId, plan, tarifs, nbVehicules, fourchette, nuitsSurPlace,
}: {
  demandeId: string;
  plan: PlanMission;
  tarifs: Tarifs;
  nbVehicules: number;
  fourchette: { min: number; max: number } | null;
  nuitsSurPlace: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    prix_ttc: "",
    vehicule_type: "",
    vehicule_places: "",
    vehicule_annee: "",
    conditions: "",
    validite_jours: "14",
    inclus: ["peages", ...(nuitsSurPlace ? ["hebergement", "repas"] : [])] as string[],
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleInclus = (id: string) =>
    setForm((f) => ({ ...f, inclus: f.inclus.includes(id) ? f.inclus.filter((x) => x !== id) : [...f.inclus, id] }));
  const [flotte, setFlotte] = useState<Vehicule[]>([]);

  // ---------- Calculateur : tarifs modifiables à la volée ----------
  const [t, setT] = useState<Tarifs>(tarifs);
  const setTarif = (k: keyof Tarifs, v: string) => setT((x) => ({ ...x, [k]: Number(v.replace(",", ".")) || 0 }));
  const calc = useMemo(() => coutDeRevient(plan, t, nbVehicules), [plan, t, nbVehicules]);
  const prixSaisi = Number(form.prix_ttc) || 0;
  const margeReelle = prixSaisi
    ? Math.round(((prixSaisi / (1 + 0.10)) * (1 - calc.tauxCommission / 100) - calc.coutHT) / calc.coutHT * 100)
    : null;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("vehicules").select("*").eq("transporteur_id", user.id);
      setFlotte((data ?? []) as Vehicule[]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choisirVehicule(id: string) {
    const v = flotte.find((x) => x.id === id);
    if (!v) return;
    setForm((f) => ({
      ...f,
      vehicule_type: `${TYPES_VEHICULES[v.type] ?? v.type}${v.marque_modele ? ` — ${v.marque_modele}` : ""}`,
      vehicule_places: String(v.places),
      vehicule_annee: v.annee ? String(v.annee) : "",
    }));
  }

  async function submit() {
    if (!form.prix_ttc || !form.vehicule_type || !form.vehicule_places) {
      setError("Prix, véhicule et places sont requis.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: creee, error: err } = await supabase.from("offres").insert({
      demande_id: demandeId,
      transporteur_id: user!.id,
      prix_ttc: Number(form.prix_ttc),
      vehicule_type: form.vehicule_type,
      vehicule_places: Number(form.vehicule_places),
      vehicule_annee: form.vehicule_annee ? Number(form.vehicule_annee) : null,
      conditions: form.conditions || null,
      inclus: form.inclus,
      validite_jours: Number(form.validite_jours) || null,
    }).select("id").single();

    if (err) {
      setError(err.message.includes("duplicate") ? "Vous avez déjà répondu à cette demande (tir unique)." : err.message);
      setSaving(false);
      return;
    }
    if (creee?.id) {
      fetch("/api/notify-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "offre", id: creee.id }),
      }).catch(() => {});
    }
    router.refresh();
  }

  const tarifInput = (k: keyof Tarifs, suffixe: string) => (
    <input className="w-[84px] bg-asphalte border border-ligne-strong rounded-sm px-2 py-1 font-mono text-[12px] text-right"
      inputMode="decimal" value={String(t[k])} onChange={(e) => setTarif(k, e.target.value)} aria-label={`${k} ${suffixe}`} />
  );
  const tarifPour = (poste: string): keyof Tarifs | null =>
    poste.startsWith("Kilomètres") ? "cout_km"
    : poste.startsWith("Heures") ? "cout_heure"
    : poste.startsWith("Hébergement") ? "cout_nuit"
    : poste.startsWith("Immobilisation") ? "cout_immobilisation"
    : null;

  return (
    <div className={`grid gap-5 items-start ${FEATURES.calculateur ? "lg:grid-cols-2" : "max-w-2xl"}`}>
      {/* ---------- Calculateur de coût de revient (en suspens : FEATURES.calculateur) ---------- */}
      {FEATURES.calculateur && <div className="card">
        <h3 className="h-display text-xl mb-1">Coût de revient estimé</h3>
        <p className="text-[12.5px] text-blanc-dim mb-4">Pré-rempli avec les données de la demande et vos paramètres. Modifiez les tarifs pour cette mission si besoin.</p>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="font-mono text-[10px] uppercase tracking-wider text-blanc-faint border-b border-ligne">
              <th className="text-left font-normal pb-2">Poste</th>
              <th className="text-right font-normal pb-2">Quantité × tarif</th>
              <th className="text-right font-normal pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {calc.lignes.map((l) => {
              const k = tarifPour(l.poste);
              return (
                <tr key={l.poste} className="border-b border-ligne">
                  <td className="py-2 pr-2">{l.poste}</td>
                  <td className="py-2 text-right font-mono text-[12px] text-blanc-dim whitespace-nowrap">
                    {l.quantite} {k ? <>× {tarifInput(k, "€")}</> : ""}
                  </td>
                  <td className="py-2 text-right font-mono font-semibold whitespace-nowrap">{eur(l.total)}</td>
                </tr>
              );
            })}
            {nbVehicules > 1 && (
              <tr className="border-b border-ligne"><td className="py-2" colSpan={2}>× {nbVehicules} véhicules</td><td className="py-2 text-right font-mono font-semibold">{eur(calc.coutHT)}</td></tr>
            )}
          </tbody>
        </table>
        <div className="mt-3 space-y-1.5 text-[13.5px]">
          <div className="flex justify-between"><span>Coût de revient</span><b className="font-mono">{eur(calc.coutHT)} HT</b></div>
          <div className="flex justify-between items-center"><span>Marge cible <span className="font-mono text-[11px] text-blanc-faint">{tarifInput("marge_pct", "%")} %</span></span><b className="font-mono">+ {eur(calc.margeHT)}</b></div>
          <div className="flex justify-between"><span>Commission DealBus si retenue <span className="font-mono text-[11px] text-blanc-faint">({calc.tauxCommission} % du TTC)</span></span><b className="font-mono">+ {eur(calc.commission)}</b></div>
        </div>
        <div className="sombre rounded mt-4 p-4 grid sm:grid-cols-2 gap-4 items-center">
          <div>
            <p className="h-display text-3xl text-ambre">{eur(calc.prixTTC)} TTC</p>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint mt-1">Prix conseillé · {eur(calc.prixHT)} HT, TVA 10 %</p>
          </div>
          <div>
            <button type="button" className="btn-primary w-full text-[13px] py-2.5" onClick={() => set("prix_ttc", String(Math.round(calc.prixTTC)))}>
              Reprendre ce prix →
            </button>
            {fourchette && (
              <p className="font-mono text-[10.5px] text-blanc-faint mt-2 text-center">Client : fourchette {eur(fourchette.min)} à {eur(fourchette.max)}</p>
            )}
          </div>
        </div>
      </div>}

      {/* ---------- L'offre ---------- */}
      <div className="card space-y-4">
        <h3 className="h-display text-xl">Votre offre</h3>
        {fourchette && (
          <div>
            <p className="text-[12.5px] text-blanc-dim">Repère observé sur DealBus pour des trajets de distance proche</p>
            <div className="relative h-2 rounded-full mt-7 mb-1.5 mx-1" style={{ background: "linear-gradient(90deg,#E6F6EE,#FFF4E0,#FDE8E4)" }}>
              <span className="absolute -top-6 text-[11px] font-semibold text-[#55534E] -translate-x-1/2 whitespace-nowrap" style={{ left: "12%" }}>{eur(fourchette.min)}</span>
              <span className="absolute -top-6 text-[11px] font-semibold text-[#55534E] -translate-x-1/2 whitespace-nowrap" style={{ left: "88%" }}>{eur(fourchette.max)}</span>
              <i className="absolute -top-[5px] w-[3px] h-[18px] bg-[#111] rounded-sm" style={{ left: "12%" }} />
              <i className="absolute -top-[5px] w-[3px] h-[18px] bg-[#111] rounded-sm" style={{ left: "88%" }} />
              {prixSaisi > 0 && (() => { const pos = Math.max(2, Math.min(98, 12 + ((prixSaisi - fourchette.min) / Math.max(fourchette.max - fourchette.min, 1)) * 76)); return <i className="absolute -top-[7px] w-[9px] h-[22px] rounded-full bg-[#F5A524] border-2 border-white shadow -translate-x-1/2" style={{ left: `${pos}%` }} />; })()}
            </div>
            <div className="flex justify-between text-[11px] text-blanc-faint mx-1"><span>quart le moins cher</span><span>quart le plus cher</span></div>
          </div>
        )}
        {flotte.length > 0 && (
          <div>
            <label className="label">Choisir un véhicule de ma flotte</label>
            <select className="input" defaultValue="" onChange={(e) => choisirVehicule(e.target.value)}>
              <option value="">— Saisie manuelle —</option>
              {flotte.map((v) => (
                <option key={v.id} value={v.id}>{(TYPES_VEHICULES[v.type] ?? v.type)}{v.marque_modele ? ` ${v.marque_modele}` : ""} · {v.places} pl.</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">Votre prix (TTC, tout compris)</label>
          <input className="input font-mono text-2xl font-semibold" type="number" placeholder={FEATURES.calculateur ? String(Math.round(calc.prixTTC)) : "Ex. 2590"}
            value={form.prix_ttc} onChange={(e) => set("prix_ttc", e.target.value)} />
          {prixSaisi > 0 && fourchette && !FEATURES.calculateur && (
            <p className={`text-[12px] mt-1.5 font-medium ${prixSaisi < fourchette.min ? "text-[#1A7F52]" : prixSaisi > fourchette.max ? "text-[#C2410C]" : "text-[#B26A00]"}`}>
              {prixSaisi < fourchette.min ? "Sous la fourchette observée" : prixSaisi > fourchette.max ? "Au-dessus de la fourchette montrée au client" : "Dans la fourchette observée"}
            </p>
          )}
          {FEATURES.calculateur && margeReelle !== null && (
            <p className={`font-mono text-[11px] mt-1.5 ${margeReelle < 5 ? "text-[#E8735D]" : margeReelle < 12 ? "text-ambre" : "text-vert"}`}>
              {margeReelle < 0 ? `Sous votre coût de revient (${margeReelle} %)` : `Marge nette après commission : ${margeReelle} %`}
              {fourchette && prixSaisi > fourchette.max ? " · au-dessus de la fourchette vue par le client" : ""}
            </p>
          )}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Véhicule</label>
            <input className="input" placeholder="Autocar grand tourisme"
              value={form.vehicule_type} onChange={(e) => set("vehicule_type", e.target.value)} />
          </div>
          <div>
            <label className="label">Places</label>
            <input className="input" type="number" placeholder="60"
              value={form.vehicule_places} onChange={(e) => set("vehicule_places", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Inclus dans le prix</label>
          <div className="flex flex-wrap gap-2">
            {INCLUS.map((i) => (
              <button key={i.id} type="button" onClick={() => toggleInclus(i.id)}
                className={`rounded-full border px-3 py-1.5 text-[12.5px] transition
                  ${form.inclus.includes(i.id) ? "bg-blanc text-asphalte border-blanc" : "border-ligne-strong text-blanc-dim hover:border-blanc-dim"}`}>
                {i.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Conditions (acompte, annulation, options…)</label>
          <textarea className="input min-h-[80px] resize-none"
            placeholder="Ex. Acompte 30 % à la réservation, solde 15 jours avant le départ."
            value={form.conditions} onChange={(e) => set("conditions", e.target.value)} />
        </div>
        <div>
          <label className="label">Validité de l&apos;offre</label>
          <div className="flex gap-2">
            {["7", "14", "30"].map((v) => (
              <button key={v} type="button" onClick={() => set("validite_jours", v)}
                className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition
                  ${form.validite_jours === v ? "bg-blanc text-asphalte border-blanc" : "border-ligne-strong text-blanc-dim"}`}>
                {v} jours
              </button>
            ))}
          </div>
        </div>
        <div className="text-[12.5px] text-[#55534E] bg-[#FAFAF8] rounded-lg px-3.5 py-3">
          {prixSaisi > 0
            ? <>Commission DealBus si le client vous choisit : <strong className="text-[#111]">{commissionTaux(prixSaisi)} % = {eur(Math.round(prixSaisi * commissionTaux(prixSaisi)) / 100)}</strong> TTC, facturée le lendemain du transport. Le client vous règle en direct.</>
            : <>Commission DealBus uniquement si le client vous choisit (9 %, 7 % ou 5 % selon le prix), facturée le lendemain du transport. Le client vous règle en direct.</>}
        </div>
        <p className="text-[12px] text-blanc-faint">Une seule offre par demande : une fois envoyée, elle ne pourra plus être modifiée ni retirée.</p>
        {error && <p className="font-mono text-sm text-[#E8735D]">{error}</p>}
        <button className="btn-primary w-full disabled:opacity-50" disabled={saving} onClick={submit}>
          {saving ? "Envoi…" : "Envoyer mon offre"}
        </button>
      </div>
    </div>
  );
}
