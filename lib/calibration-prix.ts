// Fourchette de prix = km du trajet × prix au km observé sur les devis des transporteurs.
//
// Prix au km d'un devis = prix TTC / (km du transport (aller, ou aller + retour) × nombre de cars).
// Pour une demande, on prend les devis de distance proche (pondération par la distance),
// et on applique le prix au km observé (quart bas → quart haut) aux km de la demande.
//
// Transport pur, aller et/ou retour uniquement : hors déplacements sur place, nuits, options.
// Fichier partagé client / serveur : aucune dépendance serveur ici.

import type { Analyse } from "./assistant-demande";

export type Stats = { p25: number; p50: number; p75: number; n: number };

// Un devis réel, réduit à ce qui sert au calcul (aucune identité)
export type PointMarche = {
  demandeId: string;
  km: number;      // km du transport (aller, ou aller + retour)
  prixKm: number;  // € TTC / km du transport, par car
};

export type Fourchette = {
  min: number;
  max: number;
  source: "devis" | "bareme";
  n: number; // nombre de devis utilisés (0 = barème)
};

export const CALIB = {
  largeur: 0.35,   // pondération par la distance : poids fort à ±30 % environ
  nMin: 5,         // devis de distance proche nécessaires
  ecartMin: 0.08,  // fourchette d'au moins ±8 % autour de la médiane
  prixKmMin: 0.8,  // devis aberrants écartés
  prixKmMax: 40,
};

// Km du transport : aller seul, ou aller + retour
export const kmTransport = (kmAller: number, typeTrajet: string) =>
  typeTrajet === "aller_simple" ? kmAller : kmAller * 2;

const arrondi = (n: number) => Math.round(n / 50) * 50;

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

// Prix au km observé sur les devis de distance proche
export function prixKmObserve(points: PointMarche[], km: number): Stats | null {
  const v = points.map((p) => {
    const d = Math.log(p.km / km);
    return { x: p.prixKm, w: Math.exp(-(d * d) / (2 * CALIB.largeur * CALIB.largeur)) };
  }).filter((e) => e.w > 0.01);
  const nProches = v.filter((e) => e.w >= 0.5).length;
  if (nProches < CALIB.nMin) return null;
  return { p25: quantilePondere(v, 0.25), p50: quantilePondere(v, 0.5), p75: quantilePondere(v, 0.75), n: nProches };
}

export function fourchetteDepuisDevis(points: PointMarche[], kmAller: number, typeTrajet: string, nbCars = 1): Fourchette | null {
  const km = kmTransport(kmAller, typeTrajet);
  const st = prixKmObserve(points, km);
  if (!st) return null;
  const cars = Math.max(1, nbCars);
  const lo = Math.min(st.p25, st.p50 * (1 - CALIB.ecartMin));
  const hi = Math.max(st.p75, st.p50 * (1 + CALIB.ecartMin));
  return { min: arrondi(km * cars * lo), max: arrondi(km * cars * hi), source: "devis", n: st.n };
}

export function fourchetteBareme(a: Analyse): Fourchette | null {
  return a.fourchette ? { ...a.fourchette, source: "bareme", n: 0 } : null;
}

export function libelleFourchette(f: Fourchette): string {
  return f.source === "devis"
    ? `Transport aller et/ou retour, d'après le prix au km de ${f.n} devis de transporteurs sur des distances proches. Hors déplacements sur place, nuits et options`
    : "Transport aller et/ou retour, estimation sur barème. Hors déplacements sur place, nuits et options";
}

export const fmtKm = (v: number) => `${v.toFixed(2).replace(".", ",")} €/km`;
