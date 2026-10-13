"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Bouton « Relancer les transporteurs » : demande ouverte sans offre.
export function RelancerTransporteurs({ demandeId, departement, relanceeLe, nbRelances }: { demandeId: string; departement: string; relanceeLe: string | null; nbRelances: number }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [message, setMessage] = useState("");
  const [elargir, setElargir] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function envoyer() {
    setBusy(true); setError(null);
    const res = await fetch("/api/admin/relance-transporteurs", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demande_id: demandeId, message: message.trim() || undefined, elargir }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(j.error ?? "Erreur"); return; }
    setOk(`Relance envoyée à ${j.envoyes} transporteur${j.envoyes > 1 ? "s" : ""}${j.elargi ? " (tous les validés)" : ""}.`);
    setOuvert(false); setMessage("");
    router.refresh();
  }

  const recent = relanceeLe && Date.now() - new Date(relanceeLe).getTime() < 48 * 3600 * 1000;

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        <button className="btn-primary py-2 px-4 text-[12.5px]" onClick={() => setOuvert((o) => !o)}>🔔 Relancer les transporteurs</button>
        {relanceeLe && (
          <span className={`font-mono text-[11px] ${recent ? "text-ambre-fort" : "text-blanc-faint"}`}>
            Relancés le {new Date(relanceeLe).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}{nbRelances > 1 ? ` (${nbRelances} fois)` : ""}
          </span>
        )}
      </div>
      {ouvert && (
        <div className="card mt-3 max-w-xl">
          <p className="text-sm text-blanc-dim mb-3">
            Email aux transporteurs validés qui couvrent le département {departement} et n&apos;ont pas encore répondu : récapitulatif anonyme de la demande et lien direct vers la fiche.
          </p>
          <label className="flex items-start gap-2.5 text-sm mb-3 cursor-pointer">
            <input type="checkbox" className="mt-1" checked={elargir} onChange={(e) => setElargir(e.target.checked)} />
            <span>Élargir à <strong>tous</strong> les transporteurs validés, quelle que soit leur zone<span className="block text-xs text-blanc-faint">Utile si aucun transporteur ne couvre ce département.</span></span>
          </label>
          <label className="label">Texte personnalisé (facultatif, remplace l&apos;introduction standard)</label>
          <textarea className="input min-h-[90px] resize-none mb-3" value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex. Groupe scolaire sérieux, dates souples d'un jour, le client attend votre proposition…" />
          {recent && <p className="font-mono text-xs text-ambre-fort mb-2">Déjà relancés il y a moins de 48 h.</p>}
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
