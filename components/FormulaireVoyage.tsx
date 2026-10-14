"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AddressInput } from "./AddressInput";
import { ORGANISMES, type Organisme } from "@/lib/assistant-demande";
import type { Voyage } from "@/lib/voyages";

type TypeTrajet = "aller_retour" | "aller_simple" | "circuit";
const TYPES: { id: TypeTrajet; label: string }[] = [
  { id: "aller_simple", label: "Aller simple" },
  { id: "aller_retour", label: "Aller-retour" },
  { id: "circuit", label: "Circuit" },
];

// Formulaire compact de la page thème : l'essentiel pour lancer la demande.
// Horaires, précisions et message se renseignent dans le parcours guidé /demande,
// qui arrive pré-rempli.
export function FormulaireVoyage({ voyage }: { voyage: Voyage }) {
  const router = useRouter();
  const versInitial = useSearchParams().get("vers") ?? undefined;
  const destinations = [...voyage.exemples.map((e) => e.nom), ...voyage.autres];
  const AUTRE = "__autre__";

  const [vers, setVers] = useState(destinations[0]);
  const [versLibre, setVersLibre] = useState("");
  const [de, setDe] = useState("");
  const [dept, setDept] = useState("");
  const [type, setType] = useState<TypeTrajet>(voyage.formules.some((f) => f.id === "sejour") ? "circuit" : "aller_retour");
  const [date, setDate] = useState("");
  const [dateRetour, setDateRetour] = useState("");
  const [passagers, setPassagers] = useState("");
  const [organisme, setOrganisme] = useState<Organisme>(voyage.organismeDefaut);
  const [erreur, setErreur] = useState<string | null>(null);

  // Clic sur une destination de la page (?vers=...) : on suit le lien.
  useEffect(() => {
    if (!versInitial) return;
    if (destinations.includes(versInitial)) setVers(versInitial);
    else { setVers(AUTRE); setVersLibre(versInitial); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versInitial]);

  const destination = vers === AUTRE ? versLibre.trim() : vers;

  function go() {
    if (!destination) { setErreur("Indiquez la destination."); return; }
    const p = new URLSearchParams();
    p.set("vers", destination);
    if (de) p.set("de", de);
    if (dept) p.set("dept", dept);
    p.set("type", type);
    if (date) p.set("date_aller", date);
    if (type !== "aller_simple" && (dateRetour || date)) p.set("date_retour", dateRetour || date);
    if (passagers) p.set("passagers", passagers);
    p.set("organisme", organisme);
    p.set("message", voyage.titreCourt);
    router.push(`/demande?${p.toString()}`);
  }

  const lab = "block font-mono text-[10px] uppercase tracking-[.12em] text-blanc-faint mb-1";
  const champ = "w-full bg-white/[.06] border border-white/15 rounded text-blanc text-sm px-3 py-2 focus:outline-none focus:border-ambre";
  const chip = (on: boolean) => `rounded-full px-3 py-1 text-[12.5px] border transition ${on ? "bg-ambre text-encre border-ambre font-semibold" : "border-white/20 text-blanc-dim hover:border-white/40"}`;

  return (
    <div className="sombre bg-asphalte text-blanc rounded-xl p-5 shadow-[0_20px_50px_rgba(0,0,0,.25)]">
      <span className="eyebrow">Demande de devis</span>
      <h2 className="h-display text-2xl mt-2 mb-3">{voyage.titreCourt}</h2>

      <div className="mb-2.5">
        <label className={lab}>Destination</label>
        <select className={champ} value={vers} onChange={(e) => setVers(e.target.value)}>
          {destinations.map((d) => <option key={d} value={d}>{d}</option>)}
          <option value={AUTRE}>Autre destination…</option>
        </select>
        {vers === AUTRE && (
          <input className={`${champ} mt-2`} placeholder="Ville, site ou adresse" value={versLibre} onChange={(e) => setVersLibre(e.target.value)} autoFocus />
        )}
      </div>

      <div className="mb-2.5">
        <label className={lab}>Départ</label>
        <AddressInput value={de} onChange={(v) => { setDe(v); setDept(""); }} onSelect={(s) => { setDe(s.label); setDept(s.dept); }}
          placeholder="Ville ou adresse" inputClassName={champ} />
      </div>

      <div className="mb-2.5">
        <label className={lab}>Trajet</label>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button key={t.id} type="button" className={chip(t.id === type)} onClick={() => { setType(t.id); if (t.id === "aller_simple") setDateRetour(""); }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className={`grid gap-2.5 mb-2.5 ${type === "aller_simple" ? "grid-cols-1" : "grid-cols-2"}`}>
        <div><label className={lab}>{type === "circuit" ? "Départ le" : type === "aller_simple" ? "Date" : "Aller"}</label><input type="date" className={champ} value={date} onChange={(e) => setDate(e.target.value)} /></div>
        {type !== "aller_simple" && (
          <div><label className={lab}>{type === "circuit" ? "Fin du circuit" : "Retour"}</label><input type="date" className={champ} min={date || undefined} value={dateRetour} onChange={(e) => setDateRetour(e.target.value)} /></div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div><label className={lab}>Passagers</label><input type="number" min={1} className={champ} placeholder="52" value={passagers} onChange={(e) => setPassagers(e.target.value)} /></div>
        <div>
          <label className={lab}>Vous êtes</label>
          <select className={champ} value={organisme} onChange={(e) => setOrganisme(e.target.value as Organisme)}>
            {ORGANISMES.map((o) => <option key={o.id} value={o.id}>{o.label.replace(/^Un(e)? /, "")}</option>)}
          </select>
        </div>
      </div>

      {erreur && <p className="font-mono text-sm text-[#E8735D] mb-2">{erreur}</p>}
      <button type="button" onClick={go} className="btn-primary w-full justify-center">Recevoir des offres →</button>
      <p className="text-[11.5px] text-blanc-faint text-center mt-2.5">Horaires et précisions à l&apos;étape suivante. Gratuit, sans engagement.</p>
    </div>
  );
}
