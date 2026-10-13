"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Maintenance } from "@/lib/maintenance";

// Interrupteur « site en travaux » : message affiché aux visiteurs et
// heure de retour prévue (facultative). Les admins connectés voient toujours le site.
export function MaintenanceClient({ initial, majLe }: { initial: Maintenance; majLe: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState(initial.message);
  const [retour, setRetour] = useState(initial.retour ? toLocal(initial.retour) : "");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enregistrer(actif: boolean) {
    setBusy(true); setError(null); setOk(null);
    const res = await fetch("/api/admin/maintenance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif, message, retour: retour || "" }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(j.error ?? "Erreur"); return; }
    setOk(actif ? "Mode travaux activé. Les visiteurs voient la page « en travaux » d'ici quelques secondes." : "Site rouvert au public.");
    router.refresh();
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="h-display text-2xl mb-1">Site en travaux</h2>
          <p className="text-sm text-blanc-dim max-w-xl">
            Quand le mode est actif, tout le site public renvoie une page « en travaux » (code 503, non indexée).
            Vous et les autres admins connectés continuez à voir le site normalement. La connexion reste ouverte
            pour que l&apos;équipe puisse entrer. Les API (cron, webhooks) ne sont pas coupées.
          </p>
        </div>
        <span className={`tag ${initial.actif ? "bg-[#FCEBE4] text-[#C2410C]" : "bg-vert/15 text-vert"}`}>
          {initial.actif ? "● En travaux" : "● En ligne"}
        </span>
      </div>

      <div className="grid md:grid-cols-[1fr_260px] gap-4 mb-4">
        <div>
          <label className="label">Message affiché aux visiteurs (facultatif)</label>
          <textarea className="input min-h-[96px]" maxLength={600} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Nous améliorons DealBus en ce moment même. Vos demandes et vos offres en cours sont conservées." />
        </div>
        <div>
          <label className="label">Retour prévu (facultatif)</label>
          <input className="input font-mono" type="datetime-local" value={retour} onChange={(e) => setRetour(e.target.value)} />
          <p className="font-mono text-[11px] text-blanc-faint mt-2">Affiché sur la page travaux et dans l&apos;en-tête Retry-After.</p>
        </div>
      </div>

      {error && <p className="font-mono text-sm text-[#E8735D] mb-3">{error}</p>}
      {ok && <p className="font-mono text-sm text-vert mb-3">{ok}</p>}

      <div className="flex flex-wrap items-center gap-3">
        {initial.actif ? (
          <>
            <button className="btn-primary disabled:opacity-50" disabled={busy} onClick={() => enregistrer(false)}>
              {busy ? "…" : "Rouvrir le site"}
            </button>
            <button className="btn-ghost disabled:opacity-50" disabled={busy} onClick={() => enregistrer(true)}>
              Mettre à jour le message
            </button>
          </>
        ) : (
          <button className="btn bg-[#C2410C] text-white hover:brightness-110 disabled:opacity-50" disabled={busy} onClick={() => enregistrer(true)}>
            {busy ? "…" : "Mettre le site en travaux"}
          </button>
        )}
        {majLe && <span className="font-mono text-[11px] text-blanc-faint">Dernier changement : {new Date(majLe).toLocaleString("fr-FR")}</span>}
      </div>
    </div>
  );
}

function toLocal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
