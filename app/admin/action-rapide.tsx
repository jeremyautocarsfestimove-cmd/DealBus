"use client";

import { useState } from "react";

// Relance en un geste depuis l'écran « Aujourd'hui », avec le message standard.
export function ActionRapide({ type, demandeId }: { type: "transporteurs" | "client"; demandeId: string }) {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function envoyer() {
    setBusy(true); setError(null);
    const res = await fetch(type === "transporteurs" ? "/api/admin/relance-transporteurs" : "/api/admin/relance-client", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ demande_id: demandeId }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(j.error ?? "Erreur"); return; }
    setOk(type === "transporteurs"
      ? `Relance envoyée à ${j.envoyes ?? 0} transporteur${(j.envoyes ?? 0) > 1 ? "s" : ""}.`
      : "Relance envoyée au client.");
  }

  if (ok) return <p className="text-[12.5px] font-semibold text-[#1A7F52]">{ok}</p>;
  return (
    <div>
      <button type="button" className="btn btn-primary py-2 px-3.5 disabled:opacity-50" disabled={busy} onClick={envoyer}>
        {busy ? "Envoi…" : type === "transporteurs" ? "Relancer les transporteurs" : "Relancer le client"}
      </button>
      {error && <p className="text-[12px] text-[#C2410C] mt-1">{error}</p>}
    </div>
  );
}
