"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { detecterContacts, detecterPrix, LIBELLES_INFRACTION, REGLES_MESSAGERIE } from "@/lib/messagerie";

type Message = {
  id: string;
  auteur_id: string;
  auteur_role: "client" | "transporteur";
  contenu: string;
  lu_le: string | null;
  created_at: string;
};

// Conversation (demande × transporteur). Le même composant sert au client et
// au transporteur ; `role` indique qui regarde.
export function Messagerie({
  demandeId,
  transporteurId,
  role,
  interlocuteur,
  anonyme,
  placeholder,
}: {
  demandeId: string;
  transporteurId: string;
  role: "client" | "transporteur";
  interlocuteur: string;          // « Transporteur #14 » ou « Client de la demande #1042 »
  anonyme: boolean;               // identités non révélées → filtres actifs
  placeholder?: string;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [charge, setCharge] = useState(false);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string[] | null>(null);
  const [moi, setMoi] = useState<string | null>(null);
  const bas = useRef<HTMLDivElement>(null);

  // Chargement + temps réel
  useEffect(() => {
    let actif = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!actif) return;
      setMoi(user?.id ?? null);
      const { data } = await supabase.from("messages").select("*")
        .eq("demande_id", demandeId).eq("transporteur_id", transporteurId)
        .order("created_at", { ascending: true });
      if (!actif) return;
      setMessages((data ?? []) as Message[]);
      setCharge(true);
      // Marquer lus les messages de l'autre partie
      if ((data ?? []).some((m: Message) => m.auteur_id !== user?.id && !m.lu_le)) {
        fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "lu", demande_id: demandeId, transporteur_id: transporteurId }) }).catch(() => {});
      }
    })();
    const canal = supabase.channel(`messages-${demandeId}-${transporteurId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `demande_id=eq.${demandeId}` },
        (payload) => {
          const m = payload.new as Message & { transporteur_id: string };
          if (m.transporteur_id !== transporteurId) return;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        })
      .subscribe();
    return () => { actif = false; supabase.removeChannel(canal); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandeId, transporteurId]);

  useEffect(() => { bas.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);

  // Avertissement avant envoi (le serveur revérifie)
  const contacts = anonyme ? detecterContacts(texte) : [];
  const prix = anonyme && role === "transporteur" ? detecterPrix(texte) : [];

  async function envoyer() {
    const contenu = texte.trim();
    if (!contenu || envoi) return;
    setEnvoi(true);
    setErreur(null);
    const res = await fetch("/api/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demande_id: demandeId, transporteur_id: transporteurId, contenu }),
    });
    const j = await res.json().catch(() => ({}));
    setEnvoi(false);
    if (!res.ok) { setErreur(j.motifs ?? [j.error ?? "Erreur d'envoi"]); return; }
    setTexte("");
  }

  const quand = (iso: string) => {
    const d = new Date(iso);
    const auj = new Date().toDateString() === d.toDateString();
    return `${auj ? "aujourd'hui" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-ligne bg-asphalte-2">
        <div>
          <p className="font-semibold text-sm">{interlocuteur}</p>
          <p className="font-mono text-[10.5px] text-blanc-faint">{anonyme ? "Échanges anonymes jusqu'à la sélection" : "Coordonnées échangées, vous pouvez aussi vous appeler"}</p>
        </div>
        <span className="font-mono text-[10.5px] text-blanc-faint">{messages.length} message{messages.length > 1 ? "s" : ""}</span>
      </div>

      <div className="px-4 py-4 space-y-3 max-h-[380px] overflow-y-auto">
        {!charge && <p className="text-sm text-blanc-faint">Chargement…</p>}
        {charge && messages.length === 0 && (
          <p className="text-sm text-blanc-dim">
            {role === "client"
              ? "Posez une question sur l'offre : hébergement du chauffeur, équipements, horaires… Le transporteur reçoit aussi votre message par email."
              : "Une question sur le trajet, les horaires ou le groupe ? Le client reçoit aussi votre message par email. Le prix, lui, passe par votre offre."}
          </p>
        )}
        {messages.map((m) => {
          const mien = m.auteur_id === moi;
          return (
            <div key={m.id} className={`max-w-[85%] rounded px-3.5 py-2.5 text-[13.5px] border
              ${mien ? "ml-auto bg-bleunuit border-transparent" : "bg-asphalte border-ligne"}`}>
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint mb-1">
                {mien ? "Vous" : interlocuteur} · {quand(m.created_at)}{mien && m.lu_le ? " · lu" : ""}
              </p>
              <p className="whitespace-pre-line leading-relaxed">{m.contenu}</p>
            </div>
          );
        })}
        <div ref={bas} />
      </div>

      <div className="border-t border-ligne px-4 py-3">
        <textarea className="input min-h-[64px] resize-none" placeholder={placeholder ?? `Écrire à ${interlocuteur}…`}
          value={texte} onChange={(e) => { setTexte(e.target.value); if (erreur) setErreur(null); }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) envoyer(); }} />
        {(contacts.length > 0 || prix.length > 0) && !erreur && (
          <p className="mt-2 text-[12.5px] text-ambre bg-ambre-dim border border-ambre/40 rounded-sm px-3 py-2">
            {contacts.length > 0 && <>Ce message contient {contacts.map((c) => LIBELLES_INFRACTION[c]).join(", ")} : il sera refusé avant la sélection. </>}
            {prix.length > 0 && <>Un prix se communique par votre offre, pas dans un message.</>}
          </p>
        )}
        {erreur && (
          <div className="mt-2 text-[12.5px] bg-[#3a2020] border border-[#E8735D]/40 rounded-sm px-3 py-2">
            <p className="font-semibold text-[#E8735D] mb-0.5">Message non envoyé</p>
            {erreur.map((e) => <p key={e} className="text-blanc-dim">{e}</p>)}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 mt-2.5">
          <details className="text-[11.5px] text-blanc-faint">
            <summary className="cursor-pointer font-mono uppercase tracking-wider hover:text-blanc-dim">Règles de la messagerie</summary>
            <ul className="mt-2 space-y-1">{REGLES_MESSAGERIE.map((r) => <li key={r}>· {r}</li>)}</ul>
          </details>
          <button className="btn-primary py-2 px-4 text-[13px] disabled:opacity-50" disabled={envoi || !texte.trim()} onClick={envoyer}>
            {envoi ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}
