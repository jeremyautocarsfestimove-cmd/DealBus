"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DevisForm({ demandeId }: { demandeId: string }) {
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
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.prix_ttc || !form.vehicule_type || !form.vehicule_places) {
      setError("Prix, véhicule et places sont requis.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();

    const { error: err } = await supabase.from("offres").insert({
      demande_id: demandeId,
      transporteur_id: user!.id,
      prix_ttc: Number(form.prix_ttc),
      vehicule_type: form.vehicule_type,
      vehicule_places: Number(form.vehicule_places),
      vehicule_annee: form.vehicule_annee ? Number(form.vehicule_annee) : null,
      conditions: form.conditions || null,
    });

    if (err) {
      setError(err.message.includes("duplicate") ? "Vous avez déjà répondu à cette demande (tir unique)." : err.message);
      setSaving(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="card space-y-4">
      <div>
        <label className="label">Votre prix (TTC, tout compris)</label>
        <input className="input font-mono" type="number" placeholder="Ex. 1480"
          value={form.prix_ttc} onChange={(e) => set("prix_ttc", e.target.value)} />
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
        <label className="label">Conditions (optionnel)</label>
        <textarea className="input min-h-[80px] resize-none"
          placeholder="Annulation, options incluses…"
          value={form.conditions} onChange={(e) => set("conditions", e.target.value)} />
      </div>
      <p className="text-[12.5px] text-blanc-dim bg-ambre-dim border border-ambre/40 rounded-sm px-3.5 py-3 flex gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-ambre shrink-0 mt-1.5" />
        <span>Cette offre est <strong>définitive</strong> : une fois envoyée, elle ne pourra plus être modifiée ni retirée.</span>
      </p>
      {error && <p className="font-mono text-sm text-[#E8735D]">{error}</p>}
      <button className="btn-primary w-full disabled:opacity-50" disabled={saving} onClick={submit}>
        {saving ? "Envoi…" : "Envoyer mon offre (tir unique) →"}
      </button>
    </div>
  );
}
