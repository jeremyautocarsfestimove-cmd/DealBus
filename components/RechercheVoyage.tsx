"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressInput } from "./AddressInput";
import { ORGANISMES } from "@/lib/assistant-demande";

// Barre de recherche du hero, façon site de voyage : pré-remplit le parcours
// guidé /demande. Aucune donnée n'est enregistrée ici.
export function RechercheVoyage() {
  const router = useRouter();
  const [f, setF] = useState({ de: "", dept: "", vers: "", date_aller: "", date_retour: "", passagers: "", organisme: "" });
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  function go() {
    const p = new URLSearchParams();
    if (f.de) p.set("de", f.de);
    if (f.dept) p.set("dept", f.dept);
    if (f.vers) p.set("vers", f.vers);
    if (f.date_aller) p.set("date_aller", f.date_aller);
    if (f.date_retour) p.set("date_retour", f.date_retour);
    if (f.passagers) p.set("passagers", f.passagers);
    if (f.organisme) p.set("organisme", f.organisme);
    p.set("type", f.date_retour && f.date_retour !== f.date_aller ? "circuit" : "aller_retour");
    router.push(`/demande?${p.toString()}`);
  }

  const cellule = "px-4 py-3 border-b sm:border-b-0 sm:border-r border-ligne last:border-0";
  const label = "block font-mono text-[10px] uppercase tracking-[.12em] text-blanc-faint mb-1";
  const champ = "w-full bg-transparent text-[15px] text-blanc placeholder:text-blanc-faint focus:outline-none";

  return (
    <div className="bg-asphalte text-blanc rounded-lg shadow-[0_20px_50px_rgba(0,0,0,.35)] overflow-hidden grid sm:grid-cols-2 lg:grid-cols-[1.3fr_1.3fr_.9fr_.9fr_.7fr_.9fr_auto]">
      <div className={cellule}>
        <span className={label}>Départ</span>
        <AddressInput value={f.de} onChange={(v) => set("de", v)} onSelect={(s) => { set("de", s.label); set("dept", s.dept); }} placeholder="Ville ou adresse de départ" />
      </div>
      <div className={cellule}>
        <span className={label}>Destination</span>
        <AddressInput value={f.vers} onChange={(v) => set("vers", v)} placeholder="Où avez-vous envie d'aller ?" mode="international" />
      </div>
      <div className={cellule}>
        <span className={label}>Aller</span>
        <input className={champ} type="date" value={f.date_aller} onChange={(e) => set("date_aller", e.target.value)} />
      </div>
      <div className={cellule}>
        <span className={label}>Retour</span>
        <input className={champ} type="date" min={f.date_aller || undefined} value={f.date_retour} onChange={(e) => set("date_retour", e.target.value)} />
      </div>
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
      <button onClick={go} className="bg-ambre text-encre font-bold text-[15px] px-7 py-4 sm:col-span-2 lg:col-span-1 hover:brightness-105 transition whitespace-nowrap">
        Recevoir des offres →
      </button>
    </div>
  );
}
