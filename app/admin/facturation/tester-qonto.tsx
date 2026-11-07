"use client";

import { useState } from "react";

type Point = { libelle: string; ok: boolean; detail: string };

// Diagnostic Qonto : clé, IBAN, transporteurs à facturer. N'émet rien.
export function TesterQonto() {
  const [busy, setBusy] = useState(false);
  const [points, setPoints] = useState<Point[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function tester() {
    setBusy(true); setErr(null); setPoints(null);
    const res = await fetch("/api/admin/facturation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "tester" }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(j.error ?? "Erreur"); return; }
    setPoints(j.points ?? []);
  }

  const ko = points?.filter((p) => !p.ok).length ?? 0;

  return (
    <section className="crm-panel mb-6">
      <div className="crm-panel-h">
        <div>
          <p className="crm-panel-t">Test de la connexion Qonto</p>
          <p className="text-[11.5px] text-blanc-faint">Vérifie la clé, l&apos;IBAN et les transporteurs à facturer. N&apos;émet aucune facture.</p>
        </div>
        <button className="btn-ghost py-1.5 px-3 text-[12px] disabled:opacity-50" disabled={busy} onClick={tester}>{busy ? "Test en cours…" : "Tester la connexion"}</button>
      </div>
      {err && <p className="px-4 py-3 font-mono text-[12px] text-[#C2410C]">{err}</p>}
      {points && (
        <ul>
          <li className={`px-4 py-2.5 border-b border-ligne text-[13px] font-semibold ${ko ? "text-[#C2410C]" : "text-vert"}`}>
            {ko ? `${ko} point${ko > 1 ? "s" : ""} à corriger avant la première facture` : "Tout est prêt : la première facture partira sans intervention."}
          </li>
          {points.map((p, i) => (
            <li key={i} className="flex gap-3 px-4 py-2.5 border-b border-ligne last:border-0 text-[13px]">
              <span className={`pill ${p.ok ? "bg-[#E6F6EE] text-[#1A7F52]" : "bg-[#FDE8E4] text-[#C2410C]"}`}>{p.ok ? "OK" : "À corriger"}</span>
              <span><strong>{p.libelle}</strong> · <span className="text-blanc-dim">{p.detail}</span></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
