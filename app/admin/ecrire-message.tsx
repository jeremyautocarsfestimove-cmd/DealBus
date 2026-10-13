"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Bouton « Écrire à … » sur les fiches admin : ouvre une conversation support
// vers un client ou un transporteur, avec email de notification.
export function EcrireMessage({ userId, demandeId, label, suggestion }: { userId: string; demandeId?: string | null; label: string; suggestion?: string }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState(suggestion ?? "");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function envoyer() {
    if (!texte.trim()) return;
    setBusy(true); setError(null);
    const res = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "nouvelle", user_id: userId, demande_id: demandeId ?? null, contenu: texte.trim() }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(j.error ?? "Erreur"); return; }
    setOk("Message envoyé, l'utilisateur est prévenu par email.");
    setTexte(""); setOuvert(false);
    router.refresh();
  }

  return (
    <div>
      {!ouvert ? (
        <button className="btn-ghost py-2 px-4 text-[12.5px]" onClick={() => setOuvert(true)}>✉ {label}</button>
      ) : (
        <div className="card mt-2 max-w-xl">
          <label className="label">{label}</label>
          <textarea className="input min-h-[100px] resize-none mb-3" value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Votre message. Il apparaît dans la bulle Aide de l'utilisateur et lui est envoyé par email." />
          {error && <p className="font-mono text-xs text-[#E8735D] mb-2">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-primary py-2 px-4 text-[13px] disabled:opacity-50" disabled={busy || !texte.trim()} onClick={envoyer}>{busy ? "Envoi…" : "Envoyer"}</button>
            <button className="btn-ghost py-2 px-4 text-[13px]" onClick={() => setOuvert(false)}>Annuler</button>
          </div>
        </div>
      )}
      {ok && <p className="font-mono text-xs text-vert mt-2">{ok}</p>}
    </div>
  );
}
