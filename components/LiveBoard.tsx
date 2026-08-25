"use client";

import { useEffect, useState } from "react";


type PoolItem = {
  route: string;
  pax: number;
  mode: "devis" | "enchere";
  depart?: number;
  plancher?: number;
};

type Row = {
  key: string;
  mode: "devis" | "enchere" | "retour";
  route: string;
  pax: number;
  valeur: string;
  reel: boolean;
};

// Pool de complément — utilisé uniquement pour remplir les lignes
// restantes tant qu'il n'y a pas assez d'activité réelle.
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
const FENETRE_MS = 2 * 3600 * 1000;
const BUCKET_MS = 10 * 1000;
const REFRESH_REEL_MS = 45 * 1000; // refetch des vraies données

// --- PRNG déterministe (lignes de complément refresh-proof) ---
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

function pickFake(now: number, exclude: number): PoolItem[] {
  const block = Math.floor(now / FENETRE_MS);
  const rng = mulberry32(hash(`bloc-${block}`));
  const indices = POOL.map((_, i) => i)
    .map((i) => ({ i, k: rng() }))
    .sort((a, b) => a.k - b.k)
    .map(({ i }) => i);
  return indices.slice(0, Math.max(0, MAX_ROWS - exclude)).map((i) => POOL[i]);
}

function prixEnchereFake(item: PoolItem, now: number): number {
  const block = Math.floor(now / FENETRE_MS);
  const debut = block * FENETRE_MS;
  const buckets = Math.floor((now - debut) / BUCKET_MS);
  const rng = mulberry32(hash(`${item.route}-${block}`));
  let prix = item.depart!;
  for (let b = 0; b < buckets; b++) {
    const p = rng();
    const montant = 3 + Math.floor(rng() * 10);
    if (p < 0.05) prix = Math.max(item.plancher!, prix - montant);
    if (prix <= item.plancher!) break;
  }
  return prix;
}

function nbOffresFake(item: PoolItem, now: number): number {
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

// Adresse → ville (protège l'adresse précise du client sur cet affichage public)
function ville(adresse: string): string {
  const m = adresse.match(/\d{5}\s+(.+)$/);          // "8 Rue X 78270 Limetz-Villez" → "Limetz-Villez"
  if (m) return m[1];
  return adresse.length > 26 ? adresse.slice(0, 24) + "…" : adresse;
}

const eur = (n: number) => Number(n).toLocaleString("fr-FR") + " €";

export function LiveBoard() {
  const [reelles, setReelles] = useState<Row[]>([]);
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Vraies données : demandes ouvertes + retours à vide publiés
  useEffect(() => {
    let active = true;
    const supabasePromise = import("@/lib/supabase/client").then((m) => m.createClient());

    async function fetchReel() {
      const supabase = await supabasePromise;

      // Garde-fou : si Supabase ne répond pas, on abandonne au bout de 5s
      // plutôt que de laisser le spinner tourner indéfiniment.
      const timeout = new Promise<"timeout">((resolve) =>
        setTimeout(() => resolve("timeout"), 5000)
      );
      const requete = Promise.all([
        supabase.from("demandes_en_direct")
          .select("*").order("created_at", { ascending: false }).limit(MAX_ROWS),
        supabase.from("retours_vide")
          .select("id, depart_adresse, arrivee_adresse, places, prix_fixe, created_at")
          .in("statut", ["publie", "demande_recue"])
          .order("created_at", { ascending: false }).limit(MAX_ROWS),
      ]);

      const resultat = await Promise.race([requete, timeout]);
      if (!active) return;

      if (resultat === "timeout") {
        // Pas de données réelles cette fois : on affiche quand même les lignes
        // de complément plutôt que de rester bloqué sur "Chargement…".
        setLoaded(true);
        return;
      }
      const [{ data: demandes }, { data: retours }] = resultat;

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const rows: (Row & { created_at: string })[] = [
        ...(retours ?? []).map((r: any) => ({
          key: `retour-${r.id}`,
          mode: "retour" as const,
          route: `${ville(r.depart_adresse)} → ${ville(r.arrivee_adresse)}`,
          pax: r.places,
          valeur: eur(r.prix_fixe),
          reel: true,
          created_at: r.created_at,
        })),
        ...(demandes ?? []).map((d: any) => ({
          key: `demande-${d.id}`,
          mode: d.mode as "devis" | "enchere",
          route: `${ville(d.depart_adresse)} → ${ville(d.arrivee_adresse)}`,
          pax: d.passagers,
          valeur: d.mode === "enchere"
            ? (d.meilleure_enchere ? eur(d.meilleure_enchere) : "En attente")
            : `${d.nb_offres} offre${d.nb_offres > 1 ? "s" : ""}`,
          reel: true,
          created_at: d.created_at,
        })),
      ];
      rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      setReelles(rows.slice(0, MAX_ROWS));
      setLoaded(true);
    }

    fetchReel();
    const t = setInterval(fetchReel, REFRESH_REEL_MS);
    return () => { active = false; clearInterval(t); };
  }, []);

  // Tick d'animation des lignes de complément
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const fakes: Row[] = loaded
    ? pickFake(now, reelles.length).map((f) => ({
        key: `fake-${f.route}`,
        mode: f.mode,
        route: f.route,
        pax: f.pax,
        valeur: f.mode === "enchere"
          ? eur(prixEnchereFake(f, now))
          : `${nbOffresFake(f, now)} offre${nbOffresFake(f, now) > 1 ? "s" : ""}`,
        reel: false,
      }))
    : [];
  void tick; // le tick force le recalcul des lignes de complément

  const rows = [...reelles, ...fakes].slice(0, MAX_ROWS);

  return (
    <div className="rounded border border-ligne overflow-hidden bg-asphalte-2/30 backdrop-blur-[2px]">
      <div className="flex items-center justify-between px-5 py-3.5 bg-asphalte-3/30 border-b border-ligne">
        <span className="font-mono text-xs uppercase tracking-wider text-blanc-dim flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-vert animate-pulse" />
          Demandes en direct
        </span>
        <span className="font-mono text-xs text-blanc-faint">
          {loaded ? `${rows.length} en cours` : "…"}
        </span>
      </div>

      {!loaded && (
        <div className="px-5 py-8 font-mono text-sm text-blanc-faint">Chargement…</div>
      )}

      {rows.map((r) => (
        <div
          key={r.key}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[90px_1fr_80px_90px] gap-2.5 sm:gap-3.5 items-center px-4 sm:px-5 py-4 border-b border-ligne last:border-0 font-mono text-[13px] sm:text-sm"
        >
          <span className={
            r.mode === "enchere" ? "tag-enchere"
            : r.mode === "retour" ? "tag bg-ambre-dim text-ambre"
            : "tag-devis"
          }>
            {r.mode === "enchere" ? "Enchère" : r.mode === "retour" ? "Retour" : "Devis"}
          </span>
          <span className="font-medium truncate">{r.route}</span>
          <span className="text-blanc-dim hidden sm:block text-center">{r.pax} pax</span>
          <span className="text-right font-semibold tabular-nums">{r.valeur}</span>
        </div>
      ))}

      <p className="px-5 py-3 font-mono text-[11px] text-blanc-faint border-t border-ligne">
        Client et transporteurs restent mutuellement anonymes jusqu&apos;à la sélection finale — quel que soit le mode choisi.
      </p>
    </div>
  );
}
