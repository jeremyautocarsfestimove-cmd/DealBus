"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type ConvAdmin = {
  id: string;
  user_id: string;
  demande_id: string | null;
  sujet: string | null;
  statut: "ouverte" | "close";
  ouverte_par: "user" | "admin";
  updated_at: string;
  nom: string | null;
  email: string | null;
  role: string | null;
  numero_demande: number | null;
  nonLus: number;
  dernier: { auteur: "user" | "admin"; contenu: string; created_at: string } | null;
};
type Msg = { id: string; auteur: "user" | "admin"; contenu: string; created_at: string; lu_le: string | null };

export function SupportAdmin({ conversations, initiale }: { conversations: ConvAdmin[]; initiale: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [filtre, setFiltre] = useState<"ouvertes" | "toutes">("ouvertes");
  const [actuelle, setActuelle] = useState<string | null>(initiale ?? conversations[0]?.id ?? null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const bas = useRef<HTMLDivElement>(null);
  const conv = conversations.find((c) => c.id === actuelle) ?? null;

  useEffect(() => {
    if (!actuelle) return;
    let actif = true;
    (async () => {
      const { data } = await supabase.from("support_messages").select("*").eq("conversation_id", actuelle).order("created_at", { ascending: true });
      if (!actif) return;
      setMsgs((data ?? []) as Msg[]);
      if ((data ?? []).some((m: Msg) => m.auteur === "user" && !m.lu_le)) {
        await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "lu", conversation_id: actuelle }) });
        router.refresh();
      }
    })();
    const canal = supabase.channel(`support-admin-${actuelle}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${actuelle}` },
        (p) => { const m = p.new as Msg; setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m])); })
      .subscribe();
    return () => { actif = false; supabase.removeChannel(canal); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actuelle]);

  useEffect(() => { bas.current?.scrollIntoView({ block: "nearest" }); }, [msgs.length]);

  async function repondre() {
    const contenu = texte.trim();
    if (!contenu || !actuelle || envoi) return;
    setEnvoi(true);
    const res = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "repondre", conversation_id: actuelle, contenu }) });
    setEnvoi(false);
    if (res.ok) { setTexte(""); router.refresh(); }
  }
  async function statut(action: "clore" | "rouvrir") {
    await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, conversation_id: actuelle }) });
    router.refresh();
  }

  const quand = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const liste = conversations.filter((c) => filtre === "toutes" || c.statut === "ouverte");

  return (
    <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-ligne">
          {(["ouvertes", "toutes"] as const).map((f) => (
            <button key={f} onClick={() => setFiltre(f)} className={`flex-1 py-2.5 text-[12.5px] font-semibold border-b-2 -mb-px ${filtre === f ? "text-ambre border-ambre" : "text-blanc-faint border-transparent"}`}>
              {f === "ouvertes" ? `Ouvertes (${conversations.filter((c) => c.statut === "ouverte").length})` : `Toutes (${conversations.length})`}
            </button>
          ))}
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {liste.map((c) => (
            <button key={c.id} onClick={() => setActuelle(c.id)}
              className={`w-full text-left px-4 py-3 border-b border-ligne hover:bg-asphalte-2 ${actuelle === c.id ? "bg-asphalte-2 border-l-2 border-l-ambre" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[13.5px] truncate">{c.nom ?? c.email ?? "Utilisateur"} <span className="font-normal text-blanc-faint">· {c.role ?? "client"}</span></p>
                {c.nonLus > 0 && <span className="tag bg-ambre text-encre">{c.nonLus}</span>}
              </div>
              <p className="font-mono text-[11px] text-blanc-faint truncate mt-0.5">
                {c.numero_demande ? `Demande #${c.numero_demande} · ` : ""}{c.dernier ? `${c.dernier.auteur === "admin" ? "Vous" : "Lui"} : ${c.dernier.contenu.slice(0, 60)}` : c.sujet}
              </p>
              <p className="font-mono text-[10px] text-blanc-faint mt-0.5">{quand(c.updated_at)}{c.statut === "close" ? " · close" : ""}</p>
            </button>
          ))}
          {liste.length === 0 && <p className="p-4 text-sm text-blanc-dim">Aucune conversation.</p>}
        </div>
      </div>

      <div className="card p-0 overflow-hidden flex flex-col" style={{ minHeight: "60vh" }}>
        {conv ? (
          <>
            <div className="px-5 py-3.5 border-b border-ligne flex items-center justify-between gap-3 flex-wrap bg-asphalte-2">
              <div>
                <p className="font-semibold">{conv.nom ?? "Utilisateur"} <span className="font-normal text-blanc-faint">· {conv.email} · {conv.role}</span></p>
                <p className="font-mono text-[11px] text-blanc-faint">
                  {conv.demande_id && conv.numero_demande ? <Link href={`/admin/demandes/${conv.demande_id}`} className="text-ambre-fort hover:underline">Demande #{conv.numero_demande}</Link> : "Sans demande liée"}
                  {" · "}{conv.role === "transporteur" ? <Link href={`/admin/transporteurs/${conv.user_id}`} className="hover:underline">Fiche transporteur</Link> : "Client"}
                  {" · ouverte par "}{conv.ouverte_par === "admin" ? "DealBus" : "l'utilisateur"}
                </p>
              </div>
              <button className="btn-ghost py-1.5 px-3 text-[12px]" onClick={() => statut(conv.statut === "ouverte" ? "clore" : "rouvrir")}>
                {conv.statut === "ouverte" ? "Clore" : "Rouvrir"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[55vh]">
              {msgs.map((m) => (
                <div key={m.id} className={`max-w-[80%] rounded px-3.5 py-2.5 text-[13.5px] ${m.auteur === "admin" ? "ml-auto bg-bleunuit" : "bg-asphalte-2 border border-ligne"}`}>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint mb-1">{m.auteur === "admin" ? "DealBus" : conv.nom ?? "Utilisateur"} · {quand(m.created_at)}{m.auteur === "admin" && m.lu_le ? " · lu" : ""}</p>
                  <p className="whitespace-pre-line leading-relaxed">{m.contenu}</p>
                </div>
              ))}
              <div ref={bas} />
            </div>
            <div className="border-t border-ligne p-4">
              <textarea className="input min-h-[80px] resize-none" placeholder="Votre réponse (envoyée aussi par email)…" value={texte}
                onChange={(e) => setTexte(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) repondre(); }} />
              <div className="flex justify-end mt-2">
                <button className="btn-primary py-2 px-4 text-[13px] disabled:opacity-50" disabled={envoi || !texte.trim()} onClick={repondre}>{envoi ? "Envoi…" : "Répondre"}</button>
              </div>
            </div>
          </>
        ) : (
          <p className="p-6 text-sm text-blanc-dim">Sélectionnez une conversation, ou écrivez à un utilisateur depuis une fiche demande ou transporteur.</p>
        )}
      </div>
    </div>
  );
}
