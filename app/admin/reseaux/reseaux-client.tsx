"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RESEAUX_DEF, type ReseauCle } from "@/lib/reseaux-def";

export function ReseauxForm({ initial }: { initial: Record<ReseauCle, string> }) {
  const router = useRouter();
  const [valeurs, setValeurs] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enregistrer() {
    setBusy(true);
    setOk(false);
    setError(null);
    const res = await fetch("/api/admin/reseaux", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valeurs),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Erreur");
      setBusy(false);
      return;
    }
    setOk(true);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="card">
      <p className="text-[13px] text-blanc-dim mb-6">
        Les réseaux renseignés apparaissent dans le pied de page du site. Laissez vide pour masquer.
      </p>
      <div className="grid gap-5">
        {RESEAUX_DEF.map((r) => (
          <label key={r.cle} className="block">
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-blanc-faint block mb-2">
              {r.nom}
            </span>
            <input
              className="input w-full"
              type="url"
              placeholder={r.placeholder}
              value={valeurs[r.cle]}
              onChange={(e) => setValeurs({ ...valeurs, [r.cle]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-8">
        <button className="btn-primary disabled:opacity-50" disabled={busy} onClick={enregistrer}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        {ok && <span className="font-mono text-xs text-vert">Enregistré ✓</span>}
        {error && <span className="font-mono text-xs text-[#E8735D]">{error}</span>}
      </div>
    </div>
  );
}
