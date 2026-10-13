import { createClient } from "@/lib/supabase/server";
import { detecterContacts, detecterPrix } from "@/lib/messagerie";
import { TAG_ALERTE } from "../helpers";
import { SupprimerMessage } from "./supprimer-message";

export const metadata = { title: "Messagerie — Administration" };

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function AdminMessageriePage() {
  const supabase = await createClient();
  const { data } = await supabase.from("messages")
    .select("*, demande:demandes(numero, depart_adresse, arrivee_adresse, statut), transporteur:transporteurs(raison_sociale, numero_anonyme)")
    .order("created_at", { ascending: false })
    .limit(1000);
  const messages = (data ?? []) as any[];

  // Regroupement par conversation (demande × transporteur)
  const convs = new Map<string, { cle: string; demande: any; transporteur: any; messages: any[] }>();
  for (const m of messages) {
    const cle = `${m.demande_id}:${m.transporteur_id}`;
    if (!convs.has(cle)) convs.set(cle, { cle, demande: m.demande, transporteur: m.transporteur, messages: [] });
    convs.get(cle)!.messages.push(m);
  }
  const liste = Array.from(convs.values()).map((c) => ({
    ...c,
    messages: [...c.messages].reverse(),
    dernier: c.messages[0],
    // Signalement : contact ou prix passés malgré les filtres (ex. après révélation, ou message antérieur)
    suspects: c.messages.filter((m) => detecterContacts(m.contenu).length > 0 || (m.auteur_role === "transporteur" && detecterPrix(m.contenu).length > 0)).length,
    sansReponse: c.messages[0]?.auteur_role === "client" && Date.now() - new Date(c.messages[0].created_at).getTime() > 24 * 3600 * 1000,
  }));
  const nbSuspects = liste.filter((c) => c.suspects > 0).length;
  const nbSansReponse = liste.filter((c) => c.sansReponse).length;

  const quand = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <main>
      <p className="eyebrow mb-4">Administration</p>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
        <div>
          <h1 className="h-display text-4xl mb-2">Messagerie.</h1>
          <p className="text-sm text-blanc-dim">Toutes les conversations client ↔ transporteur. Lecture réservée à la modération et aux litiges.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="tag bg-asphalte-3 text-blanc-dim">{liste.length} conversation{liste.length > 1 ? "s" : ""}</span>
          <span className={`tag ${nbSuspects ? TAG_ALERTE : "bg-vert-dim text-vert"}`}>{nbSuspects} à vérifier</span>
          <span className={`tag ${nbSansReponse ? "bg-ambre-dim text-ambre-fort" : "bg-vert-dim text-vert"}`}>{nbSansReponse} client{nbSansReponse > 1 ? "s" : ""} sans réponse &gt; 24 h</span>
        </div>
      </div>

      <div className="space-y-3">
        {liste.map((c) => (
          <details key={c.cle} className="card p-0 overflow-hidden group">
            <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 flex-wrap hover:bg-asphalte-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  #{c.demande?.numero} — {c.demande?.depart_adresse} → {c.demande?.arrivee_adresse}
                  <span className="font-normal text-blanc-faint"> · {c.transporteur?.raison_sociale} (T#{c.transporteur?.numero_anonyme})</span>
                </p>
                <p className="font-mono text-[11px] text-blanc-faint mt-1 truncate">
                  {c.messages.length} message{c.messages.length > 1 ? "s" : ""} · dernier {quand(c.dernier.created_at)} par {c.dernier.auteur_role === "client" ? "le client" : "le transporteur"} : « {c.dernier.contenu.slice(0, 90)}{c.dernier.contenu.length > 90 ? "…" : ""} »
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {c.suspects > 0 && <span className={`tag ${TAG_ALERTE}`}>{c.suspects} à vérifier</span>}
                {c.sansReponse && <span className="tag bg-ambre-dim text-ambre-fort">Sans réponse</span>}
                {c.demande?.statut === "confirmee" && <span className="tag bg-vert-dim text-vert">Mission conclue</span>}
                <span className="font-mono text-[11px] text-blanc-faint self-center group-open:rotate-180 transition">▾</span>
              </div>
            </summary>
            <div className="border-t border-ligne px-5 py-4 space-y-3 bg-asphalte-2">
              {c.messages.map((m) => {
                const flags = [...detecterContacts(m.contenu), ...(m.auteur_role === "transporteur" && detecterPrix(m.contenu).length ? ["prix"] : [])];
                return (
                  <div key={m.id} className={`max-w-[80%] rounded px-3.5 py-2.5 text-[13.5px] border ${m.auteur_role === "transporteur" ? "ml-auto bg-asphalte border-ligne" : "bg-bleunuit border-transparent"}`}>
                    <p className="font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint mb-1 flex items-center gap-3">
                      <span>{m.auteur_role === "client" ? "Client" : "Transporteur"} · {quand(m.created_at)}{m.lu_le ? " · lu" : ""}</span>
                      {flags.length > 0 && <span className={`tag ${TAG_ALERTE}`}>{flags.join(", ")}</span>}
                      <span className="ml-auto"><SupprimerMessage id={m.id} /></span>
                    </p>
                    <p className="whitespace-pre-line leading-relaxed">{m.contenu}</p>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
        {liste.length === 0 && <p className="text-blanc-dim text-sm">Aucune conversation pour l&apos;instant.</p>}
      </div>
    </main>
  );
}
