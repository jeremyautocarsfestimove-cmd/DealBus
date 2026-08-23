"use client";

import { useEffect, useRef, useState } from "react";

// Carte de France interactive : départements couverts par les transporteurs actifs.
// Fond de carte : france-geojson (simplifié), données : vue couverture_departements.

type Couverture = Record<string, number>;
type Feature = {
  properties: { code: string; nom: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
};

const GEOJSON_URL =
  "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson";

const COS_LAT = Math.cos((46.5 * Math.PI) / 180);
const W = 520, H = 500, PAD = 8;

export function CarteCouverture() {
  const [paths, setPaths] = useState<{ code: string; nom: string; d: string }[]>([]);
  const [couverture, setCouverture] = useState<Couverture>({});
  const [survol, setSurvol] = useState<{ nom: string; code: string; nb: number; x: number; y: number } | null>(null);
  const conteneur = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let actif = true;
    (async () => {
      // 1. Couverture depuis Supabase (import différé — hors bundle critique)
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data } = await supabase.from("couverture_departements").select("*");
        if (actif && data) {
          const map: Couverture = {};
          for (const l of data as { departement: string; nb_transporteurs: number }[]) {
            map[String(l.departement).toUpperCase().padStart(2, "0")] = l.nb_transporteurs;
          }
          setCouverture(map);
        }
      } catch { /* la carte reste affichable sans données */ }

      // 2. Fond de carte
      try {
        const r = await fetch(GEOJSON_URL);
        const geo = await r.json();
        if (!actif) return;

        // Projection équirectangulaire compensée + cadrage
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const proj = ([lon, lat]: number[]) => {
          const x = lon * COS_LAT, y = -lat;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
          return [x, y] as const;
        };
        const brut = (geo.features as Feature[]).map((f) => {
          const polys = f.geometry.type === "Polygon"
            ? [f.geometry.coordinates as number[][][]]
            : (f.geometry.coordinates as number[][][][]);
          return { code: f.properties.code, nom: f.properties.nom, polys: polys.map((p) => p.map((ring) => ring.map(proj))) };
        });
        const k = Math.min((W - PAD * 2) / (maxX - minX), (H - PAD * 2) / (maxY - minY));
        const tx = (x: number) => PAD + (x - minX) * k;
        const ty = (y: number) => PAD + (y - minY) * k;
        setPaths(brut.map((f) => ({
          code: f.code, nom: f.nom,
          d: f.polys.map((p) => p.map((ring) =>
            "M" + ring.map(([x, y]) => `${tx(x).toFixed(1)},${ty(y).toFixed(1)}`).join("L") + "Z"
          ).join("")).join(""),
        })));
      } catch { /* réseau indisponible : pas de carte */ }
    })();
    return () => { actif = false; };
  }, []);

  const nbCouverts = Object.keys(couverture).length;
  const teinte = (nb: number | undefined) =>
    !nb ? "rgba(245,242,234,0.05)"
    : nb === 1 ? "rgba(232,166,61,0.35)"
    : nb <= 3 ? "rgba(232,166,61,0.6)"
    : "rgba(232,166,61,0.9)";

  function survoler(e: React.MouseEvent, p: { code: string; nom: string }) {
    const rect = conteneur.current?.getBoundingClientRect();
    if (!rect) return;
    setSurvol({
      nom: p.nom, code: p.code, nb: couverture[p.code] ?? 0,
      x: e.clientX - rect.left, y: e.clientY - rect.top,
    });
  }

  return (
    <div ref={conteneur} className="relative">
      {paths.length === 0 ? (
        <div className="aspect-[520/500] flex items-center justify-center font-mono text-xs text-blanc-faint">
          Chargement de la carte…
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
          aria-label={`Carte de France : ${nbCouverts} départements couverts par des transporteurs DealBus`}>
          {paths.map((p) => (
            <path key={p.code} d={p.d}
              fill={teinte(couverture[p.code])}
              stroke="rgba(245,242,234,0.18)" strokeWidth="0.6"
              className="transition-opacity hover:opacity-75 cursor-pointer"
              onMouseMove={(e) => survoler(e, p)}
              onMouseLeave={() => setSurvol(null)}
            />
          ))}
        </svg>
      )}

      {survol && (
        <div className="pointer-events-none absolute z-10 card px-3.5 py-2.5 border-ligne-strong shadow-xl"
          style={{ left: Math.min(survol.x + 14, 340), top: survol.y - 10 }}>
          <p className="font-semibold text-[13.5px]">{survol.nom} <span className="font-mono text-blanc-faint">({survol.code})</span></p>
          <p className="font-mono text-[11px] mt-0.5">
            {survol.nb > 0
              ? <span className="text-ambre">{survol.nb} transporteur{survol.nb > 1 ? "s" : ""} actif{survol.nb > 1 ? "s" : ""}</span>
              : <span className="text-blanc-faint">Zone à prendre — soyez le premier</span>}
          </p>
        </div>
      )}

      <div className="flex items-center gap-5 mt-4 font-mono text-[10.5px] text-blanc-faint">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "rgba(232,166,61,0.9)" }} /> 4+ transporteurs</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "rgba(232,166,61,0.55)" }} /> 2-3</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "rgba(232,166,61,0.3)" }} /> 1</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-ligne" style={{ background: "rgba(245,242,234,0.05)" }} /> À couvrir</span>
      </div>
    </div>
  );
}
