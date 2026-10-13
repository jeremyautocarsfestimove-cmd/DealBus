"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Bouton « Relancer le client » : email récapitulatif des offres + message Aide.
export function RelancerClient({ demandeId, nbOffres, relanceeLe, nbRelances }: { demandeId: string; nbOffres: number; relanceeLe: string | null; nbRelances: number }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function envoyer() {
    setBusy(true); setError(null);
    const res = await fetch("/api/admin/relance-client", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demande_id: demandeId, message: message.trim() || undefined }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(j.error ?? "Erreur"); return; }
    setOk(`Relance envoyée (${j.offres} offre${j.offres > 1 ? "s" : ""} récapitulée${j.offres > 1 ? "s" : ""}).`);
    setOuvert(false); setMessage("");
    router.refresh();
  }

  if (nbOffres === 0) return null;
  const recent = relanceeLe && Date.now() - new Date(relanceeLe).getTime() < 48 * 3600 * 1000;

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        <button className="btn-primary py-2 px-4 text-[12.5px]" onClick={() => setOuvert((o) => !o)}>⏳ Relancer le client</button>
        {relanceeLe && (
          <span className={`font-mono text-[11px] ${recent ? "text-ambre-fort" : "text-blanc-faint"}`}>
            Relancé le {new Date(relanceeLe).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}{nbRelances > 1 ? ` (${nbRelances} fois)` : ""}
          </span>
        )}
      </div>
      {ouvert && (
        <div className="card mt-3 max-w-xl">
          <p className="text-sm text-blanc-dim mb-3">
            Le client reçoit un email avec le récapitulatif des {nbOffres} offre{nbOffres > 1 ? "s" : ""} en attente (prix, transporteur anonyme, véhicule, inclus) et un lien pour choisir. Le même message apparaît dans sa bulle Aide.
          </p>
          <label className="label">Texte personnalisé (facultatif, remplace l&apos;introduction standard)</label>
          <textarea className="input min-h-[90px] resize-none mb-3" value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex. Bonjour, la date de votre trajet approche et deux offres correspondent bien à votre besoin…" />
          {recent && <p className="font-mono text-xs text-ambre-fort mb-2">Déjà relancé il y a moins de 48 h.</p>}
          {error && <p className="font-mono text-xs text-[#E8735D] mb-2">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-primary py-2 px-4 text-[13px] disabled:opacity-50" disabled={busy} onClick={envoyer}>{busy ? "Envoi…" : "Envoyer la relance"}</button>
            <button className="btn-ghost py-2 px-4 text-[13px]" onClick={() => setOuvert(false)}>Annuler</button>
          </div>
        </div>
      )}
      {ok && <p className="font-mono text-xs text-vert mt-2">{ok}</p>}
    </div>
  );
}
