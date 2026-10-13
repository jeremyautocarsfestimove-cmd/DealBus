"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SupprimerMessage({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!confirm("Remplacer ce message par « supprimé par DealBus » ?")) return;
    setBusy(true);
    await fetch("/api/admin/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "supprimer" }),
    });
    setBusy(false);
    router.refresh();
  }
  return (
    <button className="font-mono text-[10.5px] uppercase tracking-wider text-[#C2410C] hover:underline disabled:opacity-50"
      disabled={busy} onClick={run}>{busy ? "…" : "Supprimer"}</button>
  );
}
