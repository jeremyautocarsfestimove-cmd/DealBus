"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Bouton d'action de facturation (émission, synchronisation, paiement, relance)
export function ActionFacturation({ action, missionId, factureId, label, confirm, primary }: {
  action: "emettre" | "synchroniser" | "payee" | "renvoyer";
  missionId?: string; factureId?: string;
  label: string; confirm?: string; primary?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [demande, setDemande] = useState(false);

  async function lancer() {
    setBusy(true); setErr(null); setMsg(null); setDemande(false);
    const res = await fetch("/api/admin/facturation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, mission_id: missionId, facture_id: factureId }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(j.error ?? "Erreur"); router.refresh(); return; }
    if (action === "emettre") {
      setMsg(`${j.ok} facture${j.ok > 1 ? "s" : ""} émise${j.ok > 1 ? "s" : ""}`);
      if (j.erreurs?.length) setErr(j.erreurs.map((x: { mission: string; erreur: string }) => `${x.mission} : ${x.erreur}`).join(" · "));
    } else if (action === "synchroniser") {
      setMsg(`${j.verifiees} facture(s) vérifiée(s), ${j.payees} nouvellement payée(s)`);
    } else {
      setMsg(action === "payee" ? "Marquée payée" : "Relance envoyée");
    }
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      {demande ? (
        <span className="inline-flex items-center gap-2">
          <span className="text-[12px] text-blanc-dim max-w-[260px] text-right">{confirm}</span>
          <button className="btn-primary py-1.5 px-3 text-[12px]" disabled={busy} onClick={lancer}>{busy ? "…" : "Confirmer"}</button>
          <button className="btn-ghost py-1.5 px-3 text-[12px]" onClick={() => setDemande(false)}>Annuler</button>
        </span>
      ) : (
        <button
          className={`${primary ? "btn-primary" : "btn-ghost"} py-1.5 px-3 text-[12px] whitespace-nowrap disabled:opacity-50`}
          disabled={busy}
          onClick={() => (confirm ? setDemande(true) : lancer())}
        >
          {busy ? "En cours…" : label}
        </button>
      )}
      {msg && <span className="font-mono text-[11px] text-vert">{msg}</span>}
      {err && <span className="font-mono text-[11px] text-[#C2410C] max-w-[360px] text-right">{err}</span>}
    </span>
  );
}
