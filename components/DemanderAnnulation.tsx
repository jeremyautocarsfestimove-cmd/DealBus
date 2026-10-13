"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ConfirmModal";

// Demande d'annulation motivée, validée par DealBus. Sert au client et au
// transporteur (mission) et au client (demande avec offres reçues).
export function DemanderAnnulation({
  cible, id, label = "Demander l'annulation", role,
}: {
  cible: "mission" | "demande";
  id: string;
  label?: string;
  role: "client" | "transporteur";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [motif, setMotif] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true); setError(null);
    const res = cible === "mission"
      ? await fetch(`/api/missions/${id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ motif: motif.trim() }) })
      : await fetch("/api/demandes/modifier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "annuler", demande_id: id, motif: motif.trim() }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(j.error ?? "Erreur"); return; }
    setOpen(false); setMotif("");
    router.refresh();
  }

  return (
    <>
      <div>
        <button className="btn-ghost text-xs px-4 py-2" onClick={() => { setError(null); setOpen(true); }}>{label}</button>
        {error && <p className="mt-2 font-mono text-xs text-[#E8735D]">{error}</p>}
      </div>
      <ConfirmModal
        open={open}
        title={cible === "mission" ? "Demander l'annulation de la mission ?" : "Demander l'annulation de la demande ?"}
        danger
        confirmLabel="Envoyer la demande d'annulation"
        confirmDisabled={motif.trim().length < 10}
        busy={busy}
        onConfirm={run}
        onCancel={() => { setOpen(false); setMotif(""); }}
      >
        <div>
          <label className="label">Motif (obligatoire, 10 caractères minimum)</label>
          <textarea className="input min-h-[90px] resize-none"
            placeholder={role === "client" ? "Ex. événement annulé par l'organisateur, changement de date impossible…" : "Ex. véhicule immobilisé, conducteur indisponible, erreur de planning…"}
            value={motif} onChange={(e) => setMotif(e.target.value)} />
          <p className="mt-3 text-[12px] text-blanc-dim bg-ambre-dim border border-ambre/40 rounded-sm px-3.5 py-2.5">
            {cible === "mission"
              ? "Rien n'est annulé immédiatement : DealBus examine votre motif, informe l'autre partie et valide ou refuse. Tant que ce n'est pas validé, la mission reste prévue."
              : "Des transporteurs ont déjà répondu : DealBus examine votre motif avant d'annuler. Ils seront prévenus si l'annulation est validée."}
            {role === "transporteur" && " Un trajet déclaré annulé mais réalisé en direct constitue un contournement : commission due rétroactivement et exclusion de la plateforme."}
          </p>
        </div>
      </ConfirmModal>
    </>
  );
}

export function EtatAnnulation({ x, cible }: { x: { annulation_demandee_at?: string | null; annulation_decision?: string | null; annulation_motif?: string | null; annulation_demandee_role?: string | null; annulation_decidee_at?: string | null }; cible: "mission" | "demande" }) {
  if (!x.annulation_demandee_at) return null;
  if (!x.annulation_decision) {
    return (
      <div className="rounded-sm border border-ambre/50 bg-ambre-dim px-4 py-3 text-[13px]">
        <p className="font-mono text-[10.5px] uppercase tracking-wider text-ambre-fort mb-1">Annulation demandée{x.annulation_demandee_role ? ` par ${x.annulation_demandee_role === "client" ? "le client" : "le transporteur"}` : ""} · en attente de DealBus</p>
        <p className="text-blanc-dim">Motif : « {x.annulation_motif} ». {cible === "mission" ? "La mission reste prévue tant que DealBus n'a pas statué." : "La demande reste ouverte tant que DealBus n'a pas statué."}</p>
      </div>
    );
  }
  if (x.annulation_decision === "refusee") {
    return (
      <div className="rounded-sm border border-ligne bg-asphalte-2 px-4 py-3 text-[13px]">
        <p className="font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint mb-1">Annulation refusée par DealBus{x.annulation_decidee_at ? ` le ${new Date(x.annulation_decidee_at).toLocaleDateString("fr-FR")}` : ""}</p>
        <p className="text-blanc-dim">{cible === "mission" ? "La mission reste prévue aux conditions convenues." : "La demande reste ouverte."} Pour toute précision, écrivez-nous depuis la bulle Aide.</p>
      </div>
    );
  }
  return null;
}
