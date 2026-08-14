"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function EnchereForm({
  demandeId,
  enchereFin,
  bestPrix: initialBest,
}: {
  demandeId: string;
  enchereFin: string | null;
  bestPrix: number | null;
}) {
  const supabase = createClient();
  const [best, setBest] = useState<number | null>(initialBest);
  const [bid, setBid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ prix: number; at: string }[]>([]);
  const [remaining, setRemaining] = useState("");

  // Compte à rebours
  useEffect(() => {
    if (!enchereFin) return;
    const tick = () => {
      const diff = Math.max(0, new Date(enchereFin).getTime() - Date.now());
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setRemaining(`${h}:${m}:${s}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [enchereFin]);

  // Realtime : nouvelle meilleure offre (anonyme)
  useEffect(() => {
    const channel = supabase
      .channel(`bids-${demandeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids", filter: `demande_id=eq.${demandeId}` },
        (payload) => {
          const prix = Number((payload.new as { prix_ttc: number }).prix_ttc);
          setBest((b) => (b === null || prix < b ? prix : b));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandeId]);

  const maxAllowed = best !== null ? Math.floor(best * 0.99) : null;

  async function encherir() {
    const prix = Number(bid.replace(/\D/g, ""));
    setError(null);
    if (!prix) { setError("Indiquez un montant."); return; }
    if (maxAllowed !== null && prix > maxAllowed) {
      setError(`Palier non respecté : maximum ${maxAllowed.toLocaleString("fr-FR")} € (−1% vs ${best!.toLocaleString("fr-FR")} €).`);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error: err } = await supabase.from("bids").insert({
      demande_id: demandeId,
      transporteur_id: user!.id,
      prix_ttc: prix,
    });
    if (err) { setError(err.message); return; }
    setHistory((h) => [...h, { prix, at: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) }]);
    setBid("");
  }

  return (
    <div className="card">
      <div className="flex justify-between items-end flex-wrap gap-4 pb-4 border-b border-ligne mb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-blanc-faint mb-1">Meilleure offre actuelle (anonyme)</p>
          <p className="font-mono text-3xl font-semibold text-vert">
            {best !== null ? `${best.toLocaleString("fr-FR")} €` : "Aucune offre"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xl font-semibold">{remaining || "—"}</p>
          <p className="font-mono text-[11px] text-blanc-faint">avant clôture</p>
        </div>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <label className="label">
            Votre relance {maxAllowed !== null ? `(max. ${maxAllowed.toLocaleString("fr-FR")} €)` : ""}
          </label>
          <input className="input font-mono" placeholder="Ex. 2310"
            value={bid} onChange={(e) => setBid(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={encherir}>Enchérir →</button>
      </div>
      {error && <p className="font-mono text-xs text-[#E8735D] mt-2.5">{error}</p>}

      {history.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-ligne">
          <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mb-2">Vos relances</p>
          {history.map((h, i) => (
            <p key={i} className="font-mono text-xs text-blanc-dim py-0.5">
              {h.at} — {h.prix.toLocaleString("fr-FR")} € soumis
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
