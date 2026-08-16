"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressInput } from "./AddressInput";

const TYPES = [
  { id: "aller_retour", label: "Aller-retour" },
  { id: "aller_simple", label: "Aller simple" },
  { id: "circuit", label: "Circuit" },
] as const;

export function QuickDemandeForm() {
  const router = useRouter();
  const [type, setType] = useState<string>("aller_retour");
  const [form, setForm] = useState({
    de: "",
    vers: "",
    date_aller: "",
    heure_aller: "",
    date_retour: "",
    heure_retour: "",
    passagers: "",
    message: "",
    dept: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    const params = new URLSearchParams({ type });
    Object.entries(form).forEach(([k, v]) => v && params.set(k, v));
    router.push(`/demande?${params.toString()}`);
  }

  return (
    <div className="card">
      {/* Tabs type de trajet */}
      <div className="flex gap-6 border-b border-ligne-strong mb-6">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition
              ${type === t.id ? "text-ambre border-ambre" : "text-blanc-faint border-transparent hover:text-blanc-dim"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">De</label>
          <AddressInput
            value={form.de}
            onChange={(v) => set("de", v)}
            onSelect={(s) => { set("de", s.label); set("dept", s.dept); }}
          />
        </div>
        <div>
          <label className="label">Vers</label>
          <AddressInput
            value={form.vers}
            onChange={(v) => set("vers", v)}
            placeholder="Destination (France ou étranger)"
            mode="international"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="grid grid-cols-[1fr_110px] gap-2.5">
          <div>
            <label className="label">Aller</label>
            <input className="input" type="date"
              value={form.date_aller} onChange={(e) => set("date_aller", e.target.value)} />
          </div>
          <div>
            <label className="label">Départ à</label>
            <input className="input" type="time"
              value={form.heure_aller} onChange={(e) => set("heure_aller", e.target.value)} />
          </div>
        </div>
        {type === "aller_retour" ? (
          <div className="grid grid-cols-[1fr_110px] gap-2.5">
            <div>
              <label className="label">Retour</label>
              <input className="input" type="date"
                value={form.date_retour} onChange={(e) => set("date_retour", e.target.value)} />
            </div>
            <div>
              <label className="label">Départ à</label>
              <input className="input" type="time"
                value={form.heure_retour} onChange={(e) => set("heure_retour", e.target.value)} />
            </div>
          </div>
        ) : (
          <div>
            <label className="label">Passagers</label>
            <input className="input" type="number" min={1} placeholder="Ex. 50"
              value={form.passagers} onChange={(e) => set("passagers", e.target.value)} />
          </div>
        )}
      </div>

      {type === "aller_retour" && (
        <div className="mb-4">
          <label className="label">Passagers</label>
          <input className="input" type="number" min={1} placeholder="Ex. 50"
            value={form.passagers} onChange={(e) => set("passagers", e.target.value)} />
        </div>
      )}

      <div className="mb-4">
        <label className="label">Message / précisions (optionnel)</label>
        <textarea
          className="input min-h-[84px] resize-none"
          placeholder="Étapes, pauses, bagages volumineux, horaires souples…"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
        />
        <p className="mt-1.5 font-mono text-[10.5px] text-blanc-faint">
          Sans coordonnées personnelles (nom, email, téléphone) — votre demande est diffusée anonymement.
        </p>
      </div>

      <button className="btn-primary w-full" onClick={submit}>
        Étape suivante →
      </button>
      <p className="mt-3.5 font-mono text-[11px] text-blanc-faint">
        Gratuit, sans engagement — votre identité reste masquée aux transporteurs.
      </p>
    </div>
  );
}
