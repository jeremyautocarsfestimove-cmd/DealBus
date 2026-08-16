"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TransporteurActions({
  id,
  statut,
}: {
  id: string;
  statut: "en_attente" | "valide" | "suspendu";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/transporteurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Erreur");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {statut === "en_attente" && (
        <>
          <button className="btn-primary text-xs px-4 py-2 disabled:opacity-50" disabled={busy}
            onClick={() => run("valider")}>Valider ✓</button>
          <button className="btn-ghost text-xs px-4 py-2 disabled:opacity-50" disabled={busy}
            onClick={() => run("refuser")}>Refuser</button>
        </>
      )}
      {statut === "valide" && (
        <button className="btn-ghost text-xs px-4 py-2 disabled:opacity-50" disabled={busy}
          onClick={() => run("suspendre")}>Suspendre</button>
      )}
      {statut === "suspendu" && (
        <button className="btn-ghost text-xs px-4 py-2 disabled:opacity-50" disabled={busy}
          onClick={() => run("reactiver")}>Réactiver</button>
      )}
      {error && <span className="font-mono text-xs text-[#E8735D]">{error}</span>}
    </div>
  );
}

export function PilotageAction({
  entity,
  id,
  action,
  label,
  primary = false,
  confirm,
}: {
  entity: string;
  id: string;
  action: string;
  label: string;
  primary?: boolean;
  confirm?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/pilotage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, id, action }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Erreur");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        className={`${primary ? "btn-primary" : "btn-ghost"} text-xs px-3.5 py-1.5 disabled:opacity-50`}
        disabled={busy}
        onClick={run}
      >
        {label}
      </button>
      {error && <span className="font-mono text-[11px] text-[#E8735D]">{error}</span>}
    </span>
  );
}

export function AdminTabs({
  labels,
  children,
}: {
  labels: string[];
  children: React.ReactNode[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-8">
        {labels.map((l, i) => (
          <button
            key={l}
            onClick={() => setActive(i)}
            className={`text-[13px] font-semibold px-4 py-2 rounded-sm border transition
              ${active === i
                ? "bg-asphalte-2 text-blanc border-ligne-strong"
                : "text-blanc-faint border-transparent hover:text-blanc-dim"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {children.map((c, i) => (
        <div key={i} hidden={active !== i}>{c}</div>
      ))}
    </div>
  );
}
