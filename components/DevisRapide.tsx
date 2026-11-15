"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressInput } from "./AddressInput";

type TypeTrajet = "aller_retour" | "aller_simple" | "circuit";
const TYPES: { id: TypeTrajet; label: string }[] = [
  { id: "aller_simple", label: "Aller simple" },
  { id: "aller_retour", label: "Aller-retour" },
  { id: "circuit", label: "Circuit" },
];

// Carte de devis du haut de page : l'essentiel du trajet, puis le parcours guidé /demande
// prend le relais avec les mêmes paramètres que l'ancienne barre de recherche.
export function DevisRapide() {
  const router = useRouter();
  const [type, setType] = useState<TypeTrajet>("aller_retour");
  const [f, setF] = useState({ de: "", dept: "", vers: "", date_aller: "", passagers: "" });
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  function go(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    p.set("type", type);
    if (f.de.trim()) p.set("de", f.de.trim());
    if (f.dept) p.set("dept", f.dept);
    if (f.vers.trim()) p.set("vers", f.vers.trim());
    if (f.date_aller) p.set("date_aller", f.date_aller);
    if (f.passagers) p.set("passagers", f.passagers);
    router.push(`/demande?${p.toString()}`);
  }

  return (
    <form className="a-devis" onSubmit={go}>
      <div className="a-et" style={{ display: "grid" }}>
        <div className="a-tete"><h2>Calculer mon devis</h2><div className="a-prog">Gratuit, 2 minutes</div></div>
        <div className="a-route">Départ<i></i>Arrivée</div>
        <div className="a-ch a-ad"><span>D&apos;où partez-vous ?</span>
          <AddressInput value={f.de} onChange={(v) => { set("de", v); set("dept", ""); }} onSelect={(s) => { set("de", s.label); set("dept", s.dept); }}
            placeholder="Ville ou adresse de départ" inputClassName="a-champ" />
        </div>
        <div className="a-ch a-ad"><span>Où allez-vous ?</span>
          <AddressInput value={f.vers} onChange={(v) => set("vers", v)} onSelect={(s) => set("vers", s.label)}
            placeholder="Ville, site ou adresse" mode="international" inputClassName="a-champ" />
        </div>
        <div className="a-ch"><span>Quel trajet ?</span>
          <div className="a-seg" role="radiogroup" aria-label="Type de trajet">
            {TYPES.map((t) => (
              <label key={t.id}>
                <input className="a-x" type="radio" name="sens" checked={type === t.id} onChange={() => setType(t.id)} />
                {t.label}
              </label>
            ))}
          </div>
        </div>
        <div className="a-duo">
          <label className="a-ch"><span>Départ le</span><input type="date" value={f.date_aller} onChange={(e) => set("date_aller", e.target.value)} /></label>
          <label className="a-ch"><span>Passagers</span><input type="number" min={1} inputMode="numeric" placeholder="Ex. 45" value={f.passagers} onChange={(e) => set("passagers", e.target.value)} /></label>
        </div>
        <button type="submit" className="a-btn a-bloc">Continuer</button>
      </div>
    </form>
  );
}
