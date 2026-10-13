"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AddressInput } from "@/components/AddressInput";
import { TARIFS_DEFAUT } from "@/lib/assistant-demande";

// Dépôt et coûts de revient du transporteur : alimentent le calcul du
// haut-le-pied sur chaque lead et le calculateur du formulaire de devis.
export function ParametresDevis({
  transporteurId,
  initial,
}: {
  transporteurId: string;
  initial: {
    depot_adresse: string | null;
    cout_km: number | null;
    cout_heure: number | null;
    cout_nuit: number | null;
    cout_immobilisation: number | null;
    marge_pct: number | null;
  };
}) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    depot_adresse: initial.depot_adresse ?? "",
    cout_km: initial.cout_km != null ? String(initial.cout_km) : "",
    cout_heure: initial.cout_heure != null ? String(initial.cout_heure) : "",
    cout_nuit: initial.cout_nuit != null ? String(initial.cout_nuit) : "",
    cout_immobilisation: initial.cout_immobilisation != null ? String(initial.cout_immobilisation) : "",
    marge_pct: initial.marge_pct != null ? String(initial.marge_pct) : "",
  });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

  async function enregistrer() {
    setError(null); setOk(null);
    const valeurs = {
      cout_km: num(form.cout_km), cout_heure: num(form.cout_heure), cout_nuit: num(form.cout_nuit),
      cout_immobilisation: num(form.cout_immobilisation), marge_pct: num(form.marge_pct),
    };
    for (const [k, v] of Object.entries(valeurs)) {
      if (v !== null && (Number.isNaN(v) || v < 0)) { setError(`Valeur invalide : ${k.replace("_", " ")}.`); return; }
    }
    setBusy(true);
    const { error: e } = await supabase.from("transporteurs").update({
      depot_adresse: form.depot_adresse.trim() || null,
      ...valeurs,
    }).eq("id", transporteurId);
    setBusy(false);
    if (e) { setError(e.message); return; }
    setOk("Paramètres enregistrés.");
    router.refresh();
  }

  const champ = (k: keyof typeof form, label: string, defaut: number, unite: string) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input className="input font-mono pr-12" inputMode="decimal" placeholder={String(defaut)}
          value={form[k]} onChange={(e) => set(k, e.target.value)} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-blanc-faint">{unite}</span>
      </div>
    </div>
  );

  return (
    <div className="card mt-5">
      <h3 className="h-display text-xl mb-1">Paramètres de devis</h3>
      <p className="text-sm text-blanc-dim mb-5">
        Votre dépôt sert à calculer le haut-le-pied sur chaque demande. Vos coûts pré-remplissent le
        calculateur du formulaire de devis : vous restez libre du prix final. Laissez vide pour utiliser le barème DealBus.
      </p>
      <div className="mb-4">
        <label className="label">Adresse du dépôt (jamais diffusée)</label>
        <AddressInput value={form.depot_adresse} onChange={(v) => set("depot_adresse", v)}
          onSelect={(s) => set("depot_adresse", s.label)} placeholder="Adresse de départ de vos véhicules" />
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        {champ("cout_km", "Coût kilométrique", TARIFS_DEFAUT.cout_km, "€ HT/km")}
        {champ("cout_heure", "Coût horaire conducteur", TARIFS_DEFAUT.cout_heure, "€ HT/h")}
        {champ("marge_pct", "Marge cible", TARIFS_DEFAUT.marge_pct, "%")}
        {champ("cout_nuit", "Nuit conducteur (hôtel + repas)", TARIFS_DEFAUT.cout_nuit, "€ HT")}
        {champ("cout_immobilisation", "Immobilisation sur place", TARIFS_DEFAUT.cout_immobilisation, "€ HT/jour")}
      </div>
      {error && <p className="font-mono text-sm text-[#E8735D] mb-3">{error}</p>}
      {ok && <p className="font-mono text-sm text-vert mb-3">{ok}</p>}
      <button className="btn-primary disabled:opacity-50" disabled={busy} onClick={enregistrer}>
        {busy ? "Enregistrement…" : "Enregistrer mes paramètres"}
      </button>
    </div>
  );
}
