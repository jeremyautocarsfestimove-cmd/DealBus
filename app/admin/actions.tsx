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

export function EnvoyerEmailTransporteur({
  id,
  raisonSociale,
}: {
  id: string;
  raisonSociale?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [envoye, setEnvoye] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sujet, setSujet] = useState("Votre inscription DealBus : une précision à apporter");
  const [message, setMessage] = useState(
    `Bonjour,\n\nMerci pour votre inscription${raisonSociale ? ` de ${raisonSociale}` : ""} sur DealBus.\n\nEn vérifiant votre dossier, j'ai relevé un point à clarifier avant de pouvoir activer votre compte :\n\n(précisez ici l'anomalie constatée : SIREN, titre d'exercice, RC Pro…)\n\nPouvez-vous me transmettre l'information corrigée en répondant simplement à cet email ? Votre compte sera activé dans la foulée.\n\nBonne route,\nJeremy, de DealBus`
  );

  async function envoyer() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/transporteurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "email", sujet, message }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(body.error ?? "Erreur d'envoi"); return; }
    setEnvoye(body.envoye_a ?? "ok");
    setTimeout(() => { setOpen(false); setEnvoye(null); }, 1800);
  }

  return (
    <>
      <button className="btn-ghost text-xs px-4 py-2" onClick={() => setOpen(true)}>
        Email ✉
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => !busy && setOpen(false)}>
          <div className="absolute inset-0 bg-asphalte/80 backdrop-blur-sm" />
          <div className="relative card max-w-xl w-full border-ligne-strong shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow mb-4">Email au transporteur</p>
            <h2 className="h-display text-2xl mb-5">{raisonSociale ?? "Contacter ce transporteur"}</h2>
            <label className="label">Objet</label>
            <input className="input w-full mb-4" value={sujet} onChange={(e) => setSujet(e.target.value)} />
            <label className="label">Message</label>
            <textarea className="input w-full min-h-[260px] font-normal leading-relaxed"
              value={message} onChange={(e) => setMessage(e.target.value)} />
            <p className="font-mono text-[10.5px] text-blanc-faint mt-2">
              Envoyé depuis l&apos;adresse DealBus officielle, avec la charte email de la plateforme.
              Les réponses arrivent sur contact@dealbus.fr.
            </p>
            {error && <p className="font-mono text-xs text-[#E8735D] mt-3">{error}</p>}
            {envoye && <p className="font-mono text-xs text-vert mt-3">✓ Email envoyé à {envoye}</p>}
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-ghost" disabled={busy} onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn-primary disabled:opacity-50"
                disabled={busy || !sujet.trim() || !message.trim()}
                onClick={envoyer}>
                {busy ? "Envoi…" : "Envoyer l'email →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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