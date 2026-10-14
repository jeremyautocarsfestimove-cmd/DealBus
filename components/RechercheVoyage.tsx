"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressInput } from "./AddressInput";
import { ORGANISMES } from "@/lib/assistant-demande";

type TypeTrajet = "aller_retour" | "aller_simple" | "circuit";
const TYPES: { id: TypeTrajet; label: string }[] = [
  { id: "aller_retour", label: "Aller-retour" },
  { id: "aller_simple", label: "Aller simple" },
  { id: "circuit", label: "Circuit" },
];

// Barre de recherche du hero, façon site de voyage : pré-remplit le parcours
// guidé /demande. Aucune donnée n'est enregistrée ici.
// Pas d'overflow-hidden sur la barre : les listes de suggestions des villes
// doivent pouvoir déborder.
export function RechercheVoyage() {
  const router = useRouter();
  const [type, setType] = useState<TypeTrajet>("aller_retour");
  const [f, setF] = useState({ de: "", dept: "", vers: "", date_aller: "", date_retour: "", passagers: "", organisme: "" });
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  function go() {
    const p = new URLSearchParams();
    p.set("type", type);
    if (f.de) p.set("de", f.de);
    if (f.dept) p.set("dept", f.dept);
    if (f.vers) p.set("vers", f.vers);
    if (f.date_aller) p.set("date_aller", f.date_aller);
    if (type !== "aller_simple" && f.date_retour) p.set("date_retour", f.date_retour);
    if (f.passagers) p.set("passagers", f.passagers);
    if (f.organisme) p.set("organisme", f.organisme);
    router.push(`/demande?${p.toString()}`);
  }

  const cellule = "px-4 py-3 border-b sm:border-b-0 sm:border-r border-ligne";
  const label = "block font-mono text-[10px] uppercase tracking-[.12em] text-blanc-faint mb-1";
  const champ = "w-full bg-transparent text-[15px] text-blanc placeholder:text-blanc-faint focus:outline-none";
  const colonnes = type === "aller_simple"
    ? "lg:grid-cols-[1.3fr_1.3fr_.9fr_.7fr_.9fr_auto]"
    : "lg:grid-cols-[1.3fr_1.3fr_.9fr_.9fr_.7fr_.9fr_auto]";

  return (
    <div className="relative z-20">
      {/* Type de trajet */}
      <div className="inline-flex bg-asphalte/90 backdrop-blur-sm rounded-t-lg p-1 gap-1" role="tablist" aria-label="Type de trajet">
        {TYPES.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={type === t.id}
            onClick={() => { setType(t.id); if (t.id === "aller_simple") set("date_retour", ""); }}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition ${type === t.id ? "bg-ambre text-encre" : "text-blanc-dim hover:text-blanc"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={`bg-asphalte text-blanc rounded-lg rounded-tl-none shadow-[0_20px_50px_rgba(0,0,0,.35)] grid sm:grid-cols-2 ${colonnes}`}>
        <div className={cellule}>
          <span className={label}>Départ</span>
          <AddressInput value={f.de} onChange={(v) => { set("de", v); set("dept", ""); }} onSelect={(s) => { set("de", s.label); set("dept", s.dept); }} placeholder="Ville ou adresse de départ" inputClassName={champ} />
        </div>
        <div className={cellule}>
          <span className={label}>{type === "circuit" ? "Destination principale" : "Destination"}</span>
          <AddressInput value={f.vers} onChange={(v) => set("vers", v)} onSelect={(s) => set("vers", s.label)} placeholder="Ville, site ou adresse" mode="international" inputClassName={champ} />
        </div>
        <div className={cellule}>
          <span className={label}>{type === "circuit" ? "Départ le" : "Aller"}</span>
          <input className={champ} type="date" value={f.date_aller} onChange={(e) => set("date_aller", e.target.value)} />
        </div>
        {type !== "aller_simple" && (
          <div className={cellule}>
            <span className={label}>{type === "circuit" ? "Fin du circuit" : "Retour"}</span>
            <input className={champ} type="date" min={f.date_aller || undefined} value={f.date_retour} onChange={(e) => set("date_retour", e.target.value)} />
          </div>
        )}
        <div className={cellule}>
          <span className={label}>Passagers</span>
          <input className={champ} type="number" min={1} placeholder="53" value={f.passagers} onChange={(e) => set("passagers", e.target.value)} />
        </div>
        <div className={cellule}>
          <span className={label}>Vous êtes</span>
          <select className={`${champ} ${f.organisme ? "" : "text-blanc-faint"}`} value={f.organisme} onChange={(e) => set("organisme", e.target.value)}>
            <option value="">École, association…</option>
            {ORGANISMES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        <button onClick={go} className="bg-ambre text-encre font-bold text-[15px] px-7 py-4 sm:col-span-2 lg:col-span-1 rounded-b-lg lg:rounded-bl-none lg:rounded-r-lg hover:brightness-105 transition whitespace-nowrap">
          Recevoir des offres →
        </button>
      </div>
    </div>
  );
}
