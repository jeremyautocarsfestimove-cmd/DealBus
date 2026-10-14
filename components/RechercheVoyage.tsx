"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressInput } from "./AddressInput";

type TypeTrajet = "aller_retour" | "aller_simple" | "circuit";
const TYPES: { id: TypeTrajet; label: string }[] = [
  { id: "aller_retour", label: "Aller-retour" },
  { id: "aller_simple", label: "Aller simple" },
  { id: "circuit", label: "Circuit" },
];

// Barre de recherche du hero : le type de trajet et la destination, rien d'autre.
// Le reste (départ, dates, passagers) se renseigne dans le parcours guidé /demande.
// Pas d'overflow-hidden ici ni sur le hero : la liste des villes doit déborder.
export function RechercheVoyage() {
  const router = useRouter();
  const [type, setType] = useState<TypeTrajet>("aller_retour");
  const [vers, setVers] = useState("");

  function go() {
    const p = new URLSearchParams();
    p.set("type", type);
    if (vers.trim()) p.set("vers", vers.trim());
    router.push(`/demande?${p.toString()}`);
  }

  return (
    <div className="relative z-20 max-w-3xl">
      <div className="inline-flex bg-asphalte/90 backdrop-blur-sm rounded-t-lg p-1 gap-1" role="tablist" aria-label="Type de trajet">
        {TYPES.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={type === t.id} onClick={() => setType(t.id)}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition ${type === t.id ? "bg-ambre text-encre" : "text-blanc-dim hover:text-blanc"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-asphalte text-blanc rounded-lg rounded-tl-none shadow-[0_20px_50px_rgba(0,0,0,.35)] flex flex-col sm:flex-row sm:items-stretch">
        <div className="flex-1 px-5 py-3.5">
          <span className="block font-mono text-[10px] uppercase tracking-[.12em] text-blanc-faint mb-1">
            {type === "circuit" ? "Destination principale" : "Destination"}
          </span>
          <AddressInput
            value={vers}
            onChange={setVers}
            onSelect={(s) => setVers(s.label)}
            placeholder="Ville, site ou adresse (ex. Compiègne, Disneyland, Londres)"
            mode="international"
            inputClassName="w-full bg-transparent text-[17px] text-blanc placeholder:text-blanc-faint focus:outline-none"
          />
        </div>
        <button onClick={go} className="bg-ambre text-encre font-bold text-[15px] px-7 py-4 rounded-b-lg sm:rounded-bl-none sm:rounded-r-lg hover:brightness-105 transition whitespace-nowrap">
          Recevoir des offres →
        </button>
      </div>
    </div>
  );
}
