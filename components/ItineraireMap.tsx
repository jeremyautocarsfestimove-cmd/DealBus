"use client";

import { useEffect, useRef, useState } from "react";

// Carte d'itinéraire (Leaflet + tuiles OpenStreetMap, chargés à la volée — zéro clé API).
// Affiche le tracé routier, le kilométrage et, si demandé, le temps de route à 80 km/h.

type Props = {
  depart: string;
  arrivee: string;
  allerRetour?: boolean;   // double le kilométrage affiché
  montrerTemps?: boolean;  // côté transporteur : temps de conduite à 80 km/h
};

const dureeA80 = (km: number): string => {
  const minutes = Math.round((km / 80) * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h} h${m > 0 ? ` ${String(m).padStart(2, "0")}` : ""}`;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function chargerLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.L) return resolve(w.L);
    if (!document.querySelector('link[data-leaflet]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      css.setAttribute("data-leaflet", "1");
      document.head.appendChild(css);
    }
    const existant = document.querySelector('script[data-leaflet]') as HTMLScriptElement | null;
    if (existant) {
      existant.addEventListener("load", () => resolve((window as any).L));
      return;
    }
    const js = document.createElement("script");
    js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.setAttribute("data-leaflet", "1");
    js.onload = () => resolve((window as any).L);
    js.onerror = reject;
    document.body.appendChild(js);
  });
}

export function ItineraireMap({ depart, arrivee, allerRetour = false, montrerTemps = false }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<any>(null);
  const [km, setKm] = useState<number | null>(null);
  const [etat, setEtat] = useState<"chargement" | "ok" | "erreur">("chargement");

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const r = await fetch(
          `/api/itineraire?depart=${encodeURIComponent(depart)}&arrivee=${encodeURIComponent(arrivee)}`
        );
        if (!r.ok) throw new Error();
        const itin = (await r.json()) as { km: number; geometry: [number, number][] };
        if (!actif) return;
        setKm(itin.km);

        const L = await chargerLeaflet();
        if (!actif || !conteneur.current || carte.current) { setEtat("ok"); return; }

        const points = itin.geometry.map(([lon, lat]) => [lat, lon] as [number, number]);
        const map = L.map(conteneur.current, {
          zoomControl: false,
          scrollWheelZoom: false,
          attributionControl: true,
        });
        carte.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map);

        const ligne = L.polyline(points, { color: "#E8A33D", weight: 4, opacity: 0.9 }).addTo(map);
        const pastille = (couleur: string) =>
          L.divIcon({
            className: "",
            html: `<div style="width:14px;height:14px;border-radius:50%;background:${couleur};border:2.5px solid #12151B"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
        L.marker(points[0], { icon: pastille("#3FB68B") }).addTo(map);
        L.marker(points[points.length - 1], { icon: pastille("#E8A33D") }).addTo(map);
        map.fitBounds(ligne.getBounds(), { padding: [28, 28] });
        setEtat("ok");
      } catch {
        if (actif) setEtat("erreur");
      }
    })();
    return () => {
      actif = false;
      if (carte.current) { carte.current.remove(); carte.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depart, arrivee]);

  if (etat === "erreur") return null; // pas d'itinéraire trouvable : on n'encombre pas la page

  const kmTotal = km !== null && allerRetour ? km * 2 : km;

  return (
    <div className="rounded border border-ligne overflow-hidden mb-8">
      <div ref={conteneur} className="h-64 w-full bg-asphalte-2" />
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 bg-asphalte-2/60 border-t border-ligne font-mono text-xs">
        {km === null ? (
          <span className="text-blanc-faint">Calcul de l&apos;itinéraire…</span>
        ) : (
          <>
            <span className="text-blanc">
              ≈ <strong className="text-ambre">{kmTotal!.toLocaleString("fr-FR")} km</strong>
              {allerRetour ? ` (${km!.toLocaleString("fr-FR")} km par trajet)` : ""}
            </span>
            {montrerTemps && (
              <span className="text-blanc-dim">
                ≈ {dureeA80(km!)} de route par trajet <span className="text-blanc-faint">(moy. 80 km/h)</span>
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
