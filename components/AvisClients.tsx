"use client";

import { useEffect, useState } from "react";

type Avis = { id: string; note: number; commentaire: string; date: string; auteur: string; organisme: string; trajet: string; passagers: number | null };

export function Etoiles({ note, taille = "text-[15px]" }: { note: number; taille?: string }) {
  return (
    <span className={`${taille} tracking-[.05em]`} aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(note) ? "text-ambre" : "text-ligne-strong"}>★</span>
      ))}
    </span>
  );
}

// Avis réels laissés par les clients après une mission (via /api/avis).
// La section ne s'affiche pas tant qu'il n'y a aucun avis commenté.
export function AvisClients() {
  const [data, setData] = useState<{ avis: Avis[]; total: number; moyenne: number | null } | null>(null);

  useEffect(() => {
    fetch("/api/avis").then((r) => r.json()).then(setData).catch(() => setData({ avis: [], total: 0, moyenne: null }));
  }, []);

  if (!data || data.avis.length === 0) return null;

  return (
    <section className="pb-20" id="avis">
      <div className="max-w-6xl mx-auto px-7">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:items-end mb-9">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.14em] text-ambre-fort">Ils sont partis avec DealBus</p>
            <h2 className="h-display text-4xl md:text-5xl mt-3 mb-2">Ce qu&apos;en disent les groupes.</h2>
          </div>
          {data.moyenne !== null && (
            <div className="flex items-center gap-3">
              <span className="h-display text-5xl">{data.moyenne.toLocaleString("fr-FR")}</span>
              <div>
                <Etoiles note={data.moyenne} taille="text-[18px]" />
                <p className="font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint mt-0.5">{data.total} avis après mission</p>
              </div>
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.avis.map((a) => (
            <article key={a.id} className="bg-asphalte border border-ligne rounded-lg p-6 flex flex-col">
              <Etoiles note={a.note} />
              <p className="text-[15px] leading-relaxed mt-3 flex-1">« {a.commentaire} »</p>
              <div className="mt-4 pt-4 border-t border-ligne">
                <b className="block text-[14px]">{a.auteur}{a.organisme ? ` · ${a.organisme}` : ""}</b>
                <p className="font-mono text-[11px] text-blanc-faint mt-0.5">
                  {a.trajet}{a.passagers ? ` · ${a.passagers} passagers` : ""} · {new Date(a.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
