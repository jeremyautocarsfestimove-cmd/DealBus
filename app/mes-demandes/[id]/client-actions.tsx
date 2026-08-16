"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ConfirmModal";

/* ---------- Retenir une offre (devis) ---------- */
export function RetenirOffre({ offreId }: { offreId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function run() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retenir_offre", offre_id: offreId }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Erreur");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button className="btn-primary w-full disabled:opacity-50" disabled={busy} onClick={() => setConfirmOpen(true)}>
        {busy ? "Confirmation…" : "Retenir cette offre →"}
      </button>
      {error && <p className="font-mono text-xs text-[#E8735D] mt-2">{error}</p>}
      <ConfirmModal
        open={confirmOpen}
        title="Retenir cette offre ?"
        message="Les identités et coordonnées seront échangées avec ce transporteur, et les autres offres seront automatiquement déclinées."
        confirmLabel="Retenir l'offre →"
        busy={busy}
        onConfirm={() => { setConfirmOpen(false); run(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

/* ---------- Vue enchère : compte à rebours, meilleur prix live, clôture ---------- */
export function EnchereCliente({
  demandeId,
  enchereFin,
  initialBest,
}: {
  demandeId: string;
  enchereFin: string | null;
  initialBest: number | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [best, setBest] = useState<number | null>(initialBest);
  const [remaining, setRemaining] = useState<string | null>(null);
  const [over, setOver] = useState(enchereFin ? new Date(enchereFin) <= new Date() : false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"valider_enchere" | "refuser_enchere" | null>(null);

  useEffect(() => {
    if (!enchereFin) return;
    const tick = () => {
      const diff = new Date(enchereFin).getTime() - Date.now();
      if (diff <= 0) { setOver(true); setRemaining("00:00:00"); return; }
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setRemaining(`${h}:${m}:${s}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [enchereFin]);

  useEffect(() => {
    const channel = supabase
      .channel(`bids-client-${demandeId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "bids", filter: `demande_id=eq.${demandeId}` },
        (payload) => {
          const prix = Number((payload.new as { prix_ttc: number }).prix_ttc);
          setBest((b) => (b === null || prix < b ? prix : b));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandeId]);

  async function decide(action: "valider_enchere" | "refuser_enchere") {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, demande_id: demandeId }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Erreur");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="card max-w-lg">
      <p className="font-mono text-xs uppercase tracking-wider text-blanc-faint mb-2">
        Meilleure offre {over ? "finale" : "actuelle"} (anonyme)
      </p>
      <p className="font-mono text-5xl font-semibold text-vert mb-4">
        {best !== null ? `${best.toLocaleString("fr-FR")} €` : "—"}
      </p>
      <p className="font-mono text-sm text-blanc-dim mb-5">
        {over ? "Enchère clôturée" : `Clôture dans ${remaining ?? "…"}`}
      </p>

      {!over && (
        <p className="text-[13px] text-blanc-dim border-t border-ligne pt-4">
          L&apos;enchère va jusqu&apos;au bout du compte à rebours. À la clôture, vous
          validez (ou non) la meilleure offre — identités révélées à ce moment seulement.
        </p>
      )}

      {over && (
        <div className="border-t border-ligne pt-5 space-y-3">
          {best !== null ? (
            <>
              <button className="btn-primary w-full disabled:opacity-50" disabled={busy}
                onClick={() => setPending("valider_enchere")}>
                Valider la meilleure offre ({best.toLocaleString("fr-FR")} €) →
              </button>
              <button className="btn-ghost w-full disabled:opacity-50" disabled={busy}
                onClick={() => setPending("refuser_enchere")}>
                Ne pas donner suite
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-blanc-dim">Aucune offre reçue pendant la fenêtre d&apos;enchère.</p>
              <button className="btn-ghost w-full disabled:opacity-50" disabled={busy}
                onClick={() => setPending("refuser_enchere")}>
                Clore la demande
              </button>
            </>
          )}
          {error && <p className="font-mono text-xs text-[#E8735D]">{error}</p>}
        </div>
      )}

      <ConfirmModal
        open={pending !== null}
        title={pending === "valider_enchere" ? "Valider la meilleure offre ?" : "Ne pas donner suite ?"}
        message={pending === "valider_enchere"
          ? `Vous confirmez la meilleure offre à ${best?.toLocaleString("fr-FR")} € TTC. Les identités seront échangées avec ce transporteur.`
          : "La demande sera close sans sélection — les transporteurs participants en seront informés."}
        confirmLabel={pending === "valider_enchere" ? "Valider →" : "Clore la demande"}
        danger={pending === "refuser_enchere"}
        busy={busy}
        onConfirm={() => { const a = pending!; setPending(null); decide(a); }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

/* ---------- Laisser un avis (mission terminée) ---------- */
export function AvisForm({
  missionId,
  clientId,
  transporteurId,
}: {
  missionId: string;
  clientId: string;
  transporteurId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function envoyer() {
    if (!note) { setError("Choisissez une note."); return; }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("avis").insert({
      mission_id: missionId,
      client_id: clientId,
      transporteur_id: transporteurId,
      note,
      commentaire: commentaire.trim() || null,
    });
    if (err) { setError(err.message); setBusy(false); return; }
    router.refresh();
  }

  return (
    <div className="border-t border-ligne pt-5 mt-5">
      <p className="font-semibold text-sm mb-3">Comment s&apos;est passé votre trajet ?</p>
      <div className="flex gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setNote(n)}
            className={`text-3xl transition ${n <= note ? "text-ambre" : "text-blanc-faint hover:text-blanc-dim"}`}>
            ★
          </button>
        ))}
      </div>
      <textarea className="input min-h-[90px] resize-none mb-4"
        placeholder="Ponctualité, confort, conduite, contact… (optionnel)"
        value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
      {error && <p className="font-mono text-xs text-[#E8735D] mb-3">{error}</p>}
      <button className="btn-primary disabled:opacity-50" disabled={busy} onClick={envoyer}>
        {busy ? "Envoi…" : "Publier mon avis →"}
      </button>
    </div>
  );
}
