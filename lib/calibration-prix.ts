// Fourchette de prix estimée à partir des devis réels des transporteurs.
//
// Principe : chaque devis reçu donne un prix au km aller (prix TTC / km aller).
// On ne compare que des devis du même type de trajet (aller simple, aller-retour
// dans la journée, aller-retour avec nuits) : le car rentre à vide sur un aller
// simple ou une dépose, donc les prix au km ne se comparent qu'entre trajets du même type.
// Pour une nouvelle demande, on fait la moyenne de ces prix au km en donnant
// plus de poids aux devis dont la distance est proche de celle du client
// (un trajet de 50 km et un trajet de 600 km n'ont pas le même prix au km).
// Fourchette = km du client × prix au km (quart bas → quart haut des devis pondérés).
//
// C'est une estimation au km : hors déplacements sur place, nuits, options.
//
// Fichier partagé client / serveur : aucune dépendance serveur ici.

import type { Analyse } from "./assistant-demande";

export type Stats = { p25: number; p50: number; p75: number; n: number };

// Un devis réel, réduit à ce qui sert au calcul (aucune identité)
export type PointMarche = {
  demandeId: string;
  km: number;          // km aller
  prixKm: number;      // € TTC / km aller (comme le tableau admin)
  groupe: string;      // aller simple / aller-retour journée / aller-retour avec nuits
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
  prixKmMin: 1.5,    // devis aberrants écartés (€ TTC / km aller)
  prixKmMax: 80,
};

export function groupeDe(type: string, nuits: number): string {
  if (type === "aller_simple") return "simple";
  return nuits > 0 ? "ar_sejour" : "ar_journee";
}

export const LIBELLES_GROUPE: Record<string, string> = {
  simple: "aller simple",
  ar_journee: "aller-retour dans la journée",
  ar_sejour: "aller-retour avec nuit(s)",
};

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

export function fourchetteDepuisDevis(points: PointMarche[], km: number, typeTrajet: string, nuits: number): Fourchette | null {
  const groupe = groupeDe(typeTrajet, nuits);
  const st = prixKmPondere(points.filter((p) => p.groupe === groupe), km);
  if (!st) return null;
  const lo = Math.min(st.p25, st.p50 * (1 - CALIB.ecartMin));
  const hi = Math.max(st.p75, st.p50 * (1 + CALIB.ecartMin));
  return { min: arrondi(km * lo), max: arrondi(km * hi), source: "devis", n: st.n };
}

export function fourchetteBareme(a: Analyse): Fourchette | null {
  return a.fourchette ? { ...a.fourchette, source: "bareme", n: 0 } : null;
}

export function libelleFourchette(f: Fourchette): string {
  return f.source === "devis"
    ? `Estimation TTC au km, d'après ${f.n} devis de transporteurs sur des trajets du même type et de distance proche. Hors déplacements sur place, nuits et options`
    : "Estimation TTC indicative sur barème, hors déplacements sur place et options";
}

// ---------- Repère €/km aller (pro et admin) : même type de trajet, même tranche de distance ----------
const tranche = (km: number) => (km < 100 ? "moins de 100 km" : km <= 300 ? "100 à 300 km" : "plus de 300 km");

function stats(v: number[]): Stats {
  const t = [...v].sort((a, b) => a - b);
  const q = (p: number) => {
    const i = (t.length - 1) * p, b = Math.floor(i), h = Math.ceil(i);
    return t[b] + (t[h] - t[b]) * (i - b);
  };
  return { p25: q(0.25), p50: q(0.5), p75: q(0.75), n: t.length };
}

export function repereKmDepuisDevis(points: PointMarche[], km: number | null, typeTrajet: string, nuits: number): (Stats & { segment: string }) | null {
  if (!km) return null;
  const groupe = groupeDe(typeTrajet, nuits);
  const v = points.filter((p) => p.groupe === groupe && tranche(p.km) === tranche(km)).map((p) => p.prixKm);
  if (v.length < CALIB.nMin) return null;
  return { ...stats(v), segment: `${LIBELLES_GROUPE[groupe]}, ${tranche(km)}` };
}

export const fmtKm = (v: number) => `${v.toFixed(2).replace(".", ",")} €/km`;
