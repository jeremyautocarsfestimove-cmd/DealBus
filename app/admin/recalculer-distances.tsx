"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Resultat = { numero: string; avant: number | null; apres: number | null; etat: "modifiee" | "identique" | "introuvable" };

// Bouton admin : recalcule les km des demandes ouvertes sans offre.
export function RecalculerDistances() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ total: number; modifiees: number; ignorees: number; resultats: Resultat[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lancer() {
    setBusy(true); setError(null); setRes(null);
    const r = await fetch("/api/admin/recalcul-distances", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setError(j.error ?? "Erreur"); return; }
    setRes(j);
    router.refresh();
  }

  return (
    <div className="mb-6">
      <button className="btn-ghost text-sm disabled:opacity-50" disabled={busy} onClick={lancer}>
        {busy ? "Recalcul en cours…" : "Recalculer les distances (demandes sans offre)"}
      </button>
      {error && <p className="font-mono text-sm text-[#E8735D] mt-2">{error}</p>}
      {res && (
        <div className="card mt-3 text-sm">
          <p className="mb-2"><b>{res.modifiees}</b> distance{res.modifiees > 1 ? "s" : ""} corrigée{res.modifiees > 1 ? "s" : ""} sur {res.total} demande{res.total > 1 ? "s" : ""} sans offre
            {res.ignorees > 0 && <span className="text-blanc-faint"> · {res.ignorees} avec offres non touchée{res.ignorees > 1 ? "s" : ""}</span>}.</p>
          {res.resultats.filter((x) => x.etat !== "identique").length > 0 && (
            <ul className="font-mono text-[12px] space-y-0.5">
              {res.resultats.filter((x) => x.etat !== "identique").map((x) => (
                <li key={x.numero}>
                  {x.numero} : {x.etat === "introuvable" ? "itinéraire introuvable" : `${x.avant ?? "—"} km → ${x.apres} km`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
