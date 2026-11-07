// Fourchette de prix calibrée sur les offres réelles des transporteurs.
//
// Principe : pour chaque offre déjà reçue, on calcule le ratio
//   prix de l'offre / prix central du barème pour la même demande.
// Le barème sert de « règle commune » (il absorbe distance, durée, nuits,
// second conducteur, nombre de cars). Les ratios observés disent ensuite
// de combien le marché réel s'en écarte, par segment de trajet.
// Fourchette affichée = prix barème × [P25 ; P75] des ratios du segment.
//
// Fichier partagé client / serveur : aucune dépendance serveur ici.

import type { Analyse } from "./assistant-demande";

export type Stats = { p25: number; p50: number; p75: number; n: number };
export type Calibration = {
  segments: Record<string, Stats>;   // ratios prix offre / prix barème
  parKm: Record<string, Stats>;      // € TTC par km aller, observé sur les offres (repère métier)
  global: Stats | null;
  maj: string; // ISO
};

export type Fourchette = {
  min: number;
  max: number;
  source: "offres" | "bareme";
  n: number; // nombre d'offres utilisées (0 = barème)
};

// Réglages
export const CALIB = {
  nMinSegment: 5,      // en dessous, on passe au global
  nMinGlobal: 8,       // en dessous, on reste sur le barème
  lissage: 4,          // poids du barème (ratio 1) dans la moyenne : tire vers 1 quand n est petit
  ecartMin: 0.08,      // fourchette d'au moins ±8 % autour de la médiane
  ratioMin: 0.5,       // offres aberrantes écartées (ex. car trop petit)
  ratioMax: 2,
};

export function cleSegment(km: number, nuits: number): string {
  const d = km < 100 ? "court" : km <= 300 ? "moyen" : "long";
  return `${d}_${nuits > 0 ? "sejour" : "journee"}`;
}

export const LIBELLES_SEGMENT: Record<string, string> = {
  court_journee: "Moins de 100 km, journée",
  moyen_journee: "100 à 300 km, journée",
  long_journee: "Plus de 300 km, journée",
  court_sejour: "Moins de 100 km, avec nuit(s)",
  moyen_sejour: "100 à 300 km, avec nuit(s)",
  long_sejour: "Plus de 300 km, avec nuit(s)",
};

export function percentile(trie: number[], p: number): number {
  if (trie.length === 0) return 1;
  const i = (trie.length - 1) * p;
  const bas = Math.floor(i), haut = Math.ceil(i);
  return trie[bas] + (trie[haut] - trie[bas]) * (i - bas);
}

export function stats(ratios: number[]): Stats {
  const t = [...ratios].sort((a, b) => a - b);
  return { p25: percentile(t, 0.25), p50: percentile(t, 0.5), p75: percentile(t, 0.75), n: t.length };
}

const arrondi = (n: number) => Math.round(n / 50) * 50;

export function fourchetteCalibree(a: Analyse, c: Calibration | null): Fourchette | null {
  const bareme: Fourchette | null = a.fourchette ? { ...a.fourchette, source: "bareme", n: 0 } : null;
  if (!a.estimationTtc || !a.km || !c) return bareme;

  const seg = c.segments[cleSegment(a.km, a.nuits)];
  const st = seg && seg.n >= CALIB.nMinSegment ? seg
    : c.global && c.global.n >= CALIB.nMinGlobal ? c.global
    : null;
  if (!st) return bareme;

  // Lissage : avec peu d'offres, on reste proche du barème
  const lisse = (r: number) => (st.n * r + CALIB.lissage) / (st.n + CALIB.lissage);
  const mid = lisse(st.p50);
  const lo = Math.min(lisse(st.p25), mid * (1 - CALIB.ecartMin));
  const hi = Math.max(lisse(st.p75), mid * (1 + CALIB.ecartMin));

  return { min: arrondi(a.estimationTtc * lo), max: arrondi(a.estimationTtc * hi), source: "offres", n: st.n };
}

export function libelleFourchette(f: Fourchette): string {
  return f.source === "offres"
    ? `Fourchette indicative TTC, d'après ${f.n} offres réelles de transporteurs sur DealBus`
    : "Fourchette indicative TTC, estimée sur barème";
}

// Repère €/km (prix TTC / km aller) observé sur les offres d'un même segment
export function repereKm(km: number | null, nuits: number, c: Calibration | null): (Stats & { segment: string }) | null {
  if (!km || !c?.parKm) return null;
  const cle = cleSegment(km, nuits);
  const st = c.parKm[cle];
  return st && st.n >= CALIB.nMinSegment ? { ...st, segment: LIBELLES_SEGMENT[cle] ?? cle } : null;
}

export const fmtKm = (v: number) => `${v.toFixed(2).replace(".", ",")} €/km`;
