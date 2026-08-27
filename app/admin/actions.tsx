"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ConfirmModal";

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

  const [confirmOpen, setConfirmOpen] = useState(false);

  async function run() {
    setBusy(true);
    setError(null);
    const res = await fetch("/admin/pilotage", {
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
        onClick={() => (confirm ? setConfirmOpen(true) : run())}
      >
        {label}
      </button>
      {error && <span className="font-mono text-[11px] text-[#E8735D]">{error}</span>}
      {confirm && (
        <ConfirmModal
          open={confirmOpen}
          title={label}
          message={confirm}
          confirmLabel={label}
          danger
          busy={busy}
          onConfirm={() => { setConfirmOpen(false); run(); }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
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
    <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10 lg:items-start">
      {/* ---------- Menu latéral (barre horizontale défilante sur mobile) ---------- */}
      <nav className="mb-8 lg:mb-0 lg:sticky lg:top-24">
        <p className="hidden lg:block font-mono text-[10.5px] uppercase tracking-widest text-blanc-faint mb-3 px-4">
          Pilotage
        </p>
        <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1
                        lg:bg-asphalte-2/40 lg:border lg:border-ligne lg:rounded-md lg:p-2">
          {labels.map((l, i) => (
            <button
              key={l}
              onClick={() => setActive(i)}
              className={`shrink-0 lg:w-full text-left text-[13.5px] font-semibold px-4 py-2.5 rounded-sm border transition whitespace-nowrap
                ${active === i
                  ? "bg-asphalte-3 text-blanc border-ligne-strong lg:border-l-2 lg:border-l-ambre"
                  : "text-blanc-faint border-transparent hover:text-blanc-dim hover:bg-asphalte-2/60"}`}
            >
              {l}
            </button>
          ))}
          <a
            href="/admin/prospection"
            className="shrink-0 lg:w-full text-left text-[13.5px] font-semibold px-4 py-2.5 rounded-sm border border-transparent
                       text-blanc-faint hover:text-blanc-dim hover:bg-asphalte-2/60 transition whitespace-nowrap
                       lg:mt-2 lg:border-t lg:border-t-ligne lg:rounded-none lg:pt-4"
          >
            Prospection transporteurs →
          </a>
          <a
            href="/admin/prospection-clients"
            className="shrink-0 lg:w-full text-left text-[13.5px] font-semibold px-4 py-2.5 rounded-sm border border-transparent
                       text-blanc-faint hover:text-blanc-dim hover:bg-asphalte-2/60 transition whitespace-nowrap"
          >
            Prospection clients →
          </a>
        </div>
      </nav>

      {/* ---------- Contenu ---------- */}
      <div className="min-w-0">
        {children.map((c, i) => (
          <div key={i} hidden={active !== i}>{c}</div>
        ))}
      </div>
    </div>
  );
}