"use client";

import { useEffect, useState } from "react";

type PoolItem = {
  route: string;
  pax: number;
  mode: "devis" | "enchere";
  depart?: number;    // prix de départ d'enchère
  plancher?: number;  // prix minimum
};

type Row = PoolItem & { key: string; prix?: number; offres?: number };

// Pool de trajets factices — remplacé par les vraies demandes (Supabase realtime) dès qu'il y en aura
const POOL: PoolItem[] = [
  { route: "Paris → Lyon", pax: 50, mode: "enchere", depart: 1980, plancher: 1740 },
  { route: "Nantes → La Rochelle", pax: 22, mode: "devis" },
  { route: "Lille → Bruxelles", pax: 38, mode: "enchere", depart: 2340, plancher: 2050 },
  { route: "Toulouse → Andorre", pax: 44, mode: "devis" },
  { route: "Bordeaux → Biarritz", pax: 31, mode: "enchere", depart: 1420, plancher: 1230 },
  { route: "Marseille → Nice", pax: 55, mode: "devis" },
  { route: "Strasbourg → Colmar", pax: 27, mode: "devis" },
  { route: "Rennes → Mont-St-Michel", pax: 48, mode: "enchere", depart: 980, plancher: 840 },
  { route: "Rouen → Paris", pax: 53, mode: "enchere", depart: 1150, plancher: 990 },
  { route: "Dijon → Genève", pax: 35, mode: "devis" },
  { route: "Tours → Futuroscope", pax: 42, mode: "devis" },
  { route: "Grenoble → Alpe d'Huez", pax: 29, mode: "enchere", depart: 760, plancher: 650 },
  { route: "Nancy → Strasbourg", pax: 33, mode: "devis" },
  { route: "Angers → Puy du Fou", pax: 51, mode: "enchere", depart: 1240, plancher: 1080 },
  { route: "Clermont → Vulcania", pax: 40, mode: "devis" },
];

const MAX_ROWS = 5;
const FENETRE_MS = 2 * 3600 * 1000; // fenêtre d'enchère : 2h, alignée sur l'horloge
const BUCKET_MS = 10 * 1000;        // granularité des baisses : 10 s

// --- PRNG déterministe (seed → suite pseudo-aléatoire reproductible) ---
function hash(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRows(now: number): (PoolItem & { key: string })[] {
  const block = Math.floor(now / FENETRE_MS);
  const rng = mulberry32(hash(`bloc-${block}`));
  const indices = POOL.map((_, i) => i)
    .map((i) => ({ i, k: rng() }))
    .sort((a, b) => a.k - b.k)
    .map(({ i }) => i);

  const chosen = indices.slice(0, MAX_ROWS);
  const quart = Math.floor((now % FENETRE_MS) / (30 * 60 * 1000)); // 0..3
  for (let q = 1; q <= quart; q++) {
    const rngQ = mulberry32(hash(`bloc-${block}-q${q}`));
    const remplacant = indices[MAX_ROWS + ((q - 1) % (indices.length - MAX_ROWS))];
    chosen[Math.floor(rngQ() * MAX_ROWS)] = remplacant;
  }
  return chosen.map((i) => ({ ...POOL[i], key: `${block}-${POOL[i].route}` }));
}

function prixEnchere(item: PoolItem, now: number): number {
  const block = Math.floor(now / FENETRE_MS);
  const debut = block * FENETRE_MS;
  const buckets = Math.floor((now - debut) / BUCKET_MS);
  const rng = mulberry32(hash(`${item.route}-${block}`));
  let prix = item.depart!;
  for (let b = 0; b < buckets; b++) {
    const p = rng();
    const montant = 3 + Math.floor(rng() * 10); // 3–12 €
    if (p < 0.05) prix = Math.max(item.plancher!, prix - montant);
    if (prix <= item.plancher!) break;
  }
  return prix;
}

function nbOffres(item: PoolItem, now: number): number {
  const block = Math.floor(now / FENETRE_MS);
  const debut = block * FENETRE_MS;
  const rng = mulberry32(hash(`offres-${item.route}-${block}`));
  const base = Math.floor(rng() * 2);
  const total = 3 + Math.floor(rng() * 4);
  let count = base;
  for (let k = base; k < total; k++) {
    const arrivee = debut + rng() * FENETRE_MS;
    if (now >= arrivee) count++;
  }
  return Math.min(count, 6);
}

export function LiveBoard() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    function compute() {
      const now = Date.now();
      setRows(
        pickRows(now).map((r) => ({
          ...r,
          prix: r.mode === "enchere" ? prixEnchere(r, now) : undefined,
          offres: r.mode === "devis" ? nbOffres(r, now) : undefined,
        }))
      );
    }
    compute(); // premier rendu après montage (pas d'écart SSR/client)
    const t = setInterval(compute, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded border border-ligne overflow-hidden bg-asphalte-2/30 backdrop-blur-[2px]">
      <div className="flex items-center justify-between px-5 py-3.5 bg-asphalte-3/30 border-b border-ligne">
        <span className="font-mono text-xs uppercase tracking-wider text-blanc-dim flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-vert animate-pulse" />
          Demandes en direct
        </span>
        <span className="font-mono text-xs text-blanc-faint">
          {rows ? `${rows.length} en cours` : "…"}
        </span>
      </div>

      {rows === null && (
        <div className="px-5 py-8 font-mono text-sm text-blanc-faint">Chargement…</div>
      )}

      {rows?.map((r) => (
        <div
          key={r.key}
          className="grid grid-cols-[90px_1fr_80px_90px] gap-3.5 items-center px-5 py-4 border-b border-ligne last:border-0 font-mono text-sm"
        >
          <span className={r.mode === "enchere" ? "tag-enchere" : "tag-devis"}>
            {r.mode === "enchere" ? "Enchère" : "Devis"}
          </span>
          <span className="font-medium">{r.route}</span>
          <span className="text-blanc-dim hidden sm:block text-center">{r.pax} pax</span>
          <span className="text-right font-semibold tabular-nums">
            {r.mode === "enchere"
              ? `${r.prix!.toLocaleString("fr-FR")} €`
              : `${r.offres} offre${(r.offres ?? 0) > 1 ? "s" : ""}`}
          </span>
        </div>
      ))}

      <p className="px-5 py-3 font-mono text-[11px] text-blanc-faint border-t border-ligne">
        Client et transporteurs restent mutuellement anonymes jusqu&apos;à la sélection finale — quel que soit le mode choisi.
      </p>
    </div>
  );
}
