"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ConfirmModal";

// Modifier (tant qu'aucune offre) ou clore une demande ouverte.
export function GererDemande({ demandeId, nbOffres }: { demandeId: string; nbOffres: number }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function clore() {
    setBusy(true); setError(null);
    const res = await fetch("/api/demandes/modifier", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clore", demande_id: demandeId }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false); setConfirm(false);
    if (!res.ok) { setError(j.error ?? "Erreur"); return; }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={`/demande?modifier=${demandeId}`} className="btn-ghost text-[13px] py-2 px-4">✎ Modifier ma demande</Link>
      <button className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint hover:text-[#E8735D] transition" onClick={() => setConfirm(true)}>
        Clore sans donner suite
      </button>
      {error && <p className="font-mono text-xs text-[#E8735D] w-full">{error}</p>}
      <ConfirmModal
        open={confirm}
        title="Clore cette demande ?"
        message="Aucune offre reçue : la demande ne sera plus diffusée aux transporteurs. Vous pourrez en déposer une nouvelle."
        confirmLabel="Clore la demande"
        danger
        busy={busy}
        onConfirm={clore}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
