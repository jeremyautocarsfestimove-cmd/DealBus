// Fourchette de prix estimée à partir des devis réels des transporteurs.
//
// Principe : chaque devis reçu donne un prix au km (prix TTC / km en charge).
// Pour une nouvelle demande, on fait la moyenne de ces prix au km en donnant
// plus de poids aux devis dont la distance est proche de celle du client
// (un trajet de 50 km et un trajet de 600 km n'ont pas le même prix au km).
// Fourchette = km du client × prix au km (quart bas → quart haut des devis pondérés).
//
// Km en charge = km aller × 1 (aller simple) ou × 2 (aller-retour, circuit).
// C'est une estimation au km : hors déplacements sur place, nuits, options.
//
// Fichier partagé client / serveur : aucune dépendance serveur ici.

import type { Analyse } from "./assistant-demande";

export type Stats = { p25: number; p50: number; p75: number; n: number };

// Un devis réel, réduit à ce qui sert au calcul (aucune identité)
export type PointMarche = {
  demandeId: string;
  km: number;          // km aller
  kmCharge: number;    // km aller × trajets en charge
  prixKm: number;      // € TTC / km en charge
  prixKmAller: number; // € TTC / km aller (repère métier, comme le tableau admin)
  nuits: number;
};

export type Fourchette = {
  min: number;
  max: number;
  source: "devis" | "bareme";
  n: number; // nombre de devis utilisés (0 = barème)
};

export const CALIB = {
  largeur: 0.35,     // largeur de la pondération (en log de distance) : ±35 % ≈ poids fort
  nMin: 5,           // nombre effectif minimum de devis comparables
  ecartMin: 0.08,    // fourchette d'au moins ±8 % autour de la médiane
  prixKmMin: 0.8,    // devis aberrants écartés (€ TTC / km en charge)
  prixKmMax: 40,
};

export const trajetsEnCharge = (type: string) => (type === "aller_simple" ? 1 : 2);

const arrondi = (n: number) => Math.round(n / 50) * 50;

// Quantile pondéré
function quantilePondere(v: { x: number; w: number }[], p: number): number {
  const t = [...v].sort((a, b) => a.x - b.x);
  const total = t.reduce((s, e) => s + e.w, 0);
  let cumul = 0;
  for (const e of t) {
    cumul += e.w;
    if (cumul >= p * total) return e.x;
  }
  return t[t.length - 1].x;
}

// Prix au km pondéré par la proximité de distance
export function prixKmPondere(points: PointMarche[], km: number): Stats | null {
  const v = points.map((p) => {
    const d = Math.log(p.km / km);
    return { x: p.prixKm, w: Math.exp(-(d * d) / (2 * CALIB.largeur * CALIB.largeur)) };
  }).filter((e) => e.w > 0.01);
  if (!v.length) return null;
  // Devis « à distance proche » (±30 % environ) : il en faut assez pour estimer
  const nProches = v.filter((e) => e.w >= 0.5).length;
  if (nProches < CALIB.nMin) return null;
  return {
    p25: quantilePondere(v, 0.25),
    p50: quantilePondere(v, 0.5),
    p75: quantilePondere(v, 0.75),
    n: nProches,
  };
}

export function fourchetteDepuisDevis(points: PointMarche[], km: number, typeTrajet: string): Fourchette | null {
  const st = prixKmPondere(points, km);
  if (!st) return null;
  const kmCharge = km * trajetsEnCharge(typeTrajet);
  const lo = Math.min(st.p25, st.p50 * (1 - CALIB.ecartMin));
  const hi = Math.max(st.p75, st.p50 * (1 + CALIB.ecartMin));
  return { min: arrondi(kmCharge * lo), max: arrondi(kmCharge * hi), source: "devis", n: st.n };
}

export function fourchetteBareme(a: Analyse): Fourchette | null {
  return a.fourchette ? { ...a.fourchette, source: "bareme", n: 0 } : null;
}

export function libelleFourchette(f: Fourchette): string {
  return f.source === "devis"
    ? `Estimation TTC au km, d'après ${f.n} devis de transporteurs sur des distances proches. Hors déplacements sur place, nuits et options`
    : "Estimation TTC indicative sur barème, hors déplacements sur place et options";
}

// ---------- Repère €/km aller (pro et admin) ----------
export function cleSegment(km: number, nuits: number): string {
  const d = km < 100 ? "court" : km <= 300 ? "moyen" : "long";
  return `${d}_${nuits > 0 ? "sejour" : "journee"}`;
}

export const LIBELLES_SEGMENT: Record<string, string> = {
  court_journee: "moins de 100 km, journée",
  moyen_journee: "100 à 300 km, journée",
  long_journee: "plus de 300 km, journée",
  court_sejour: "moins de 100 km, avec nuit(s)",
  moyen_sejour: "100 à 300 km, avec nuit(s)",
  long_sejour: "plus de 300 km, avec nuit(s)",
};

function stats(v: number[]): Stats {
  const t = [...v].sort((a, b) => a - b);
  const q = (p: number) => {
    const i = (t.length - 1) * p, b = Math.floor(i), h = Math.ceil(i);
    return t[b] + (t[h] - t[b]) * (i - b);
  };
  return { p25: q(0.25), p50: q(0.5), p75: q(0.75), n: t.length };
}

export function repereKmDepuisDevis(points: PointMarche[], km: number | null, nuits: number): (Stats & { segment: string }) | null {
  if (!km) return null;
  const cle = cleSegment(km, nuits);
  const v = points.filter((p) => cleSegment(p.km, p.nuits) === cle).map((p) => p.prixKmAller);
  if (v.length < CALIB.nMin) return null;
  return { ...stats(v), segment: LIBELLES_SEGMENT[cle] ?? cle };
}

export const fmtKm = (v: number) => `${v.toFixed(2).replace(".", ",")} €/km`;
