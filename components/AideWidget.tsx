"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { faqPour, repondre, type Faq, type Role } from "@/lib/aide-faq";

type Bulle = { de: "bot" | "moi"; texte: string; faq?: Faq };
type Msg = { id: string; auteur: "user" | "admin"; contenu: string; created_at: string; lu_le: string | null };

// Bulle « Aide » en bas à droite : assistant automatique (FAQ) puis relais
// vers l'équipe DealBus (support humain, réponse ici et par email).
export function AideWidget({ ouvertParDefaut = false, pleinePage = false }: { ouvertParDefaut?: boolean; pleinePage?: boolean }) {
  const chemin = usePathname();
  const params = useSearchParams();
  // Client Supabase créé à la demande (la bulle est dans le layout racine, prérendu au build)
  const sbRef = useRef<ReturnType<typeof createClient> | null>(null);
  const supabase = () => (sbRef.current ??= createClient());
  const [ouvert, setOuvert] = useState(ouvertParDefaut);
  const [onglet, setOnglet] = useState<"assistant" | "dealbus">(params.get("c") ? "dealbus" : "assistant");
  const [role, setRole] = useState<Role>("visiteur");
  const [userId, setUserId] = useState<string | null>(null);

  // ---------- Assistant ----------
  const [bulles, setBulles] = useState<Bulle[]>([]);
  const [question, setQuestion] = useState("");
  const [nonLus, setNonLus] = useState(0);

  // ---------- Support humain ----------
  const [convId, setConvId] = useState<string | null>(params.get("c"));
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const bas = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let actif = true;
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!actif) return;
      setUserId(user?.id ?? null);
      if (!user) { setRole("visiteur"); return; }
      const { data: p } = await supabase().from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (!actif) return;
      setRole(p?.role === "transporteur" ? "transporteur" : "client");
      // Dernière conversation ouverte + non lus (pour le badge)
      const { data: conv } = await supabase().from("support_conversations").select("id")
        .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (!actif) return;
      const id = params.get("c") ?? conv?.id ?? null;
      setConvId(id);
      if (id) {
        const { data: m } = await supabase().from("support_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
        if (!actif) return;
        setMsgs((m ?? []) as Msg[]);
        setNonLus((m ?? []).filter((x: Msg) => x.auteur === "admin" && !x.lu_le).length);
      }
    })();
    return () => { actif = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Temps réel sur la conversation
  useEffect(() => {
    if (!convId) return;
    const canal = supabase().channel(`support-${convId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.auteur === "admin" && !(ouvert && onglet === "dealbus")) setNonLus((n) => n + 1);
        })
      .subscribe();
    return () => { supabase().removeChannel(canal); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId, ouvert, onglet]);

  // Marquer lus à l'ouverture de l'onglet DealBus
  useEffect(() => {
    if (ouvert && onglet === "dealbus" && convId && nonLus > 0) {
      fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "lu", conversation_id: convId }) }).catch(() => {});
      setNonLus(0);
    }
  }, [ouvert, onglet, convId, nonLus]);

  useEffect(() => { bas.current?.scrollIntoView({ block: "nearest" }); }, [msgs.length, bulles.length, onglet, ouvert]);

  // Message d'accueil de l'assistant
  useEffect(() => {
    if (bulles.length === 0) {
      setBulles([{ de: "bot", texte: role === "transporteur"
        ? "Bonjour ! Une question sur une demande, votre compte ou la commission ? Posez-la ici, ou choisissez un sujet."
        : "Bonjour ! Une question sur votre demande, les offres ou le fonctionnement de DealBus ? Posez-la ici, ou choisissez un sujet." }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (!pleinePage && chemin?.startsWith("/admin")) return null;

  function poser(q: string) {
    const texteQ = q.trim();
    if (!texteQ) return;
    const f = repondre(texteQ, role);
    setBulles((b) => [...b, { de: "moi", texte: texteQ }, f
      ? { de: "bot", texte: f.reponse, faq: f }
      : { de: "bot", texte: "Je n'ai pas de réponse toute faite à ça. L'équipe DealBus peut vous répondre directement : ouvrez l'onglet « DealBus » et écrivez-nous, la réponse arrive ici et par email." }]);
    setQuestion("");
  }

  async function envoyer() {
    const contenu = texte.trim();
    if (!contenu || envoi) return;
    setEnvoi(true); setErreur(null);
    const res = await fetch("/api/support", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "envoyer", conversation_id: convId, contenu }),
    });
    const j = await res.json().catch(() => ({}));
    setEnvoi(false);
    if (!res.ok) { setErreur(j.error ?? "Erreur d'envoi"); return; }
    if (!convId && j.conversation_id) setConvId(j.conversation_id);
    setTexte("");
    // Le temps réel ajoute le message ; en secours, on le pousse nous-mêmes
    setMsgs((prev) => (prev.some((x) => x.id === j.id) ? prev : [...prev, { id: j.id, auteur: "user", contenu, created_at: new Date().toISOString(), lu_le: null }]));
  }

  const quand = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const suggestions = faqPour(role).slice(0, 5);

  const panneau = (
    <div className={`${pleinePage ? "w-full" : "w-[min(380px,calc(100vw-2rem))] shadow-2xl"} bg-asphalte border border-ligne-strong rounded overflow-hidden flex flex-col`} style={{ height: pleinePage ? "70vh" : "min(560px, calc(100vh - 7rem))" }}>
      <div className="sombre px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-condensed font-bold uppercase tracking-wide text-lg leading-none">Aide DealBus</p>
          <p className="font-mono text-[10.5px] text-blanc-faint mt-0.5">{onglet === "assistant" ? "Réponses immédiates" : "L'équipe répond en général dans la journée"}</p>
        </div>
        {!pleinePage && <button className="text-blanc-dim hover:text-blanc text-xl leading-none" onClick={() => setOuvert(false)} aria-label="Fermer">×</button>}
      </div>
      <div className="flex border-b border-ligne">
        {(["assistant", "dealbus"] as const).map((o) => (
          <button key={o} onClick={() => setOnglet(o)}
            className={`flex-1 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition ${onglet === o ? "text-ambre border-ambre" : "text-blanc-faint border-transparent"}`}>
            {o === "assistant" ? "Assistant" : <>Écrire à DealBus{nonLus > 0 && <span className="ml-1.5 tag bg-ambre text-encre">{nonLus}</span>}</>}
          </button>
        ))}
      </div>

      {onglet === "assistant" ? (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {bulles.map((b, i) => (
              <div key={i} className={`max-w-[88%] rounded px-3.5 py-2.5 text-[13.5px] leading-relaxed ${b.de === "moi" ? "ml-auto bg-bleunuit" : "bg-asphalte-2 border border-ligne"}`}>
                <p className="whitespace-pre-line">{b.texte}</p>
                {b.faq?.lien && <Link href={b.faq.lien.href} className="inline-block mt-2 font-mono text-[11px] uppercase tracking-wider text-ambre-fort hover:underline">{b.faq.lien.label} →</Link>}
                {b.de === "bot" && i === bulles.length - 1 && i > 0 && (
                  <button onClick={() => setOnglet("dealbus")} className="block mt-2 font-mono text-[11px] uppercase tracking-wider text-blanc-faint hover:text-blanc">Ça ne répond pas ? Écrire à DealBus →</button>
                )}
              </div>
            ))}
            {bulles.length <= 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((f) => (
                  <button key={f.id} onClick={() => poser(f.question)} className="rounded-full border border-ligne-strong px-3 py-1.5 text-[12.5px] text-blanc-dim hover:border-blanc-dim hover:text-blanc">{f.question}</button>
                ))}
              </div>
            )}
            <div ref={bas} />
          </div>
          <div className="border-t border-ligne p-3 flex gap-2">
            <input className="input py-2.5" placeholder="Votre question…" value={question}
              onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") poser(question); }} />
            <button className="btn-primary px-4 py-2 text-[13px]" onClick={() => poser(question)}>OK</button>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {!userId ? (
              <div className="text-[13.5px] text-blanc-dim leading-relaxed">
                <p className="mb-3">Pour écrire à l&apos;équipe et recevoir la réponse ici et par email, connectez-vous ou créez un compte.</p>
                <Link href="/login" className="btn-primary text-[13px] py-2">Me connecter →</Link>
                <p className="mt-4 font-mono text-[11px] text-blanc-faint">Sans compte : contact@dealbus.fr</p>
              </div>
            ) : (
              <>
                {msgs.length === 0 && <p className="text-[13.5px] text-blanc-dim">Dites-nous tout : une demande qui ne reçoit rien, un doute sur une offre, un souci de compte. Nous répondons ici, et par email.</p>}
                {msgs.map((m) => (
                  <div key={m.id} className={`max-w-[88%] rounded px-3.5 py-2.5 text-[13.5px] ${m.auteur === "user" ? "ml-auto bg-bleunuit" : "bg-asphalte-2 border border-ligne"}`}>
                    <p className="font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint mb-1">{m.auteur === "user" ? "Vous" : "DealBus"} · {quand(m.created_at)}</p>
                    <p className="whitespace-pre-line leading-relaxed">{m.contenu}</p>
                  </div>
                ))}
              </>
            )}
            <div ref={bas} />
          </div>
          {userId && (
            <div className="border-t border-ligne p-3">
              <textarea className="input min-h-[60px] resize-none" placeholder="Votre message à l'équipe DealBus…" value={texte}
                onChange={(e) => setTexte(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) envoyer(); }} />
              {erreur && <p className="font-mono text-xs text-[#E8735D] mt-1.5">{erreur}</p>}
              <div className="flex justify-between items-center mt-2">
                <span className="font-mono text-[10.5px] text-blanc-faint">Réponse ici et par email</span>
                <button className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50" disabled={envoi || !texte.trim()} onClick={envoyer}>{envoi ? "Envoi…" : "Envoyer"}</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (pleinePage) return panneau;

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3">
      {ouvert && panneau}
      {!ouvert && (
        <button onClick={() => setOuvert(true)}
          className="flex items-center gap-2.5 bg-ambre text-encre font-semibold text-[15px] pl-4 pr-5 py-3 rounded-full shadow-xl hover:-translate-y-px transition"
          aria-label="Ouvrir l'aide">
          <span className="w-6 h-6 rounded-full border-2 border-encre flex items-center justify-center font-mono text-[13px] font-bold">?</span>
          Aide
          {nonLus > 0 && <span className="ml-1 bg-encre text-ambre font-mono text-[11px] px-1.5 py-0.5 rounded-full">{nonLus}</span>}
        </button>
      )}
    </div>
  );
}
