"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = {
  label: string;
  city: string;
  postcode: string;
  dept: string;       // département français ("" si étranger)
  country: string;    // "France", "Belgique", …
  genre?: "lieu" | "commune" | "adresse";   // pour l'affichage et le classement
};

// Photon : clés OSM considérées comme des lieux (monuments, parcs, gares, communes…)
const CLES_LIEU = new Set(["tourism", "historic", "leisure", "amenity", "natural", "railway", "aeroway", "sport"]);
// Comparaison sans accents ni casse : « com » doit trouver « Compiègne » avant tout le reste.
const norm = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const DEPT_DEPUIS_CP = (cp?: string) => {
  if (!cp) return "";
  if (cp.startsWith("20")) return Number(cp) < 20200 ? "2A" : "2B";
  return cp.startsWith("97") || cp.startsWith("98") ? cp.slice(0, 3) : cp.slice(0, 2);
};

/**
 * Autocomplétion d'adresses, sans clé API :
 * - France : API Adresse / Base Adresse Nationale (qualité maximale + département)
 * - International (mode="international") : Photon (OpenStreetMap) en complément
 */
export function AddressInput({
  value,
  onChange,
  onSelect,
  placeholder,
  mode = "fr",
  inputClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (s: Suggestion) => void;
  placeholder?: string;
  mode?: "fr" | "international";
  inputClassName?: string;   // remplace la classe "input" (ex. barre de recherche du hero)
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function search(q: string) {
    onChange(q);
    if (debounce.current) clearTimeout(debounce.current);
    if (q.trim().length < 3) { setSuggestions([]); setOpen(false); return; }

    debounce.current = setTimeout(async () => {
      abort.current?.abort();
      abort.current = new AbortController();
      const signal = abort.current.signal;

      try {
        const requests: Promise<Suggestion[]>[] = [
          // --- France : BAN (adresses précises) ---
          // --- France : communes d'abord (BAN, type=municipality : « Com » → Compiègne dès 3 lettres) ---
          fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&type=municipality&limit=4`, { signal })
            .then((r) => r.json())
            .then((data) =>
              (data.features ?? []).map(
                (f: { properties: { label: string; city: string; postcode: string; context: string } }) => ({
                  label: `${f.properties.label}, ${f.properties.postcode ?? ""}`.replace(/, $/, ""),
                  city: f.properties.city,
                  postcode: f.properties.postcode ?? "",
                  dept: (f.properties.context ?? "").split(",")[0].trim() || f.properties.postcode?.slice(0, 2) || "",
                  country: "France",
                  genre: "commune" as Suggestion["genre"],
                })
              )
            )
            .catch(() => [] as Suggestion[]),
          fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=4`, { signal })
            .then((r) => r.json())
            .then((data) =>
              (data.features ?? []).map(
                (f: { properties: { label: string; city: string; postcode: string; context: string; type?: string } }) => ({
                  label: f.properties.type === "municipality" ? `${f.properties.label}, ${f.properties.postcode ?? ""}`.replace(/, $/, "") : f.properties.label,
                  city: f.properties.city,
                  postcode: f.properties.postcode ?? "",
                  dept: (f.properties.context ?? "").split(",")[0].trim() || f.properties.postcode?.slice(0, 2) || "",
                  country: "France",
                  genre: (f.properties.type === "municipality" ? "commune" : "adresse") as Suggestion["genre"],
                })
              )
            )
            .catch(() => [] as Suggestion[]),
          // --- Lieux et communes : Photon (OpenStreetMap), France comprise ---
          // La BAN ne connaît que des adresses : « Mont Saint Michel » y devient une rue
          // de Challes-les-Eaux. Photon connaît les monuments, parcs, gares, communes.
          fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=fr`, { signal })
            .then((r) => r.json())
            .then((data) =>
              (data.features ?? [])
                .filter((f: { properties: { countrycode?: string; osm_key?: string; osm_value?: string } }) => {
                  const p = f.properties;
                  const fr = p.countrycode === "FR";
                  const lieu = CLES_LIEU.has(p.osm_key ?? "");
                  const commune = p.osm_key === "place" && ["city", "town", "village", "municipality"].includes(p.osm_value ?? "");
                  if (fr) return lieu || commune;                  // en France : jamais les rues (la BAN s'en charge)
                  return mode === "international";                 // à l'étranger : tout, si autorisé
                })
                .slice(0, 5)
                .map((f: { properties: { name?: string; city?: string; postcode?: string; country?: string; countrycode?: string; osm_key?: string; osm_value?: string } }) => {
                  const p = f.properties;
                  const fr = p.countrycode === "FR";
                  const commune = p.osm_key === "place";
                  const ville = p.city && p.city !== p.name ? p.city : "";
                  const label = fr
                    ? `${p.name ?? ""}${p.postcode || ville ? `, ${[p.postcode, ville].filter(Boolean).join(" ")}` : ""}`
                    : `${[p.name, ville].filter(Boolean).join(", ")}${p.country ? `, ${p.country}` : ""}`;
                  return {
                    label,
                    city: p.city ?? p.name ?? "",
                    postcode: p.postcode ?? "",
                    dept: fr ? DEPT_DEPUIS_CP(p.postcode) : "",
                    country: fr ? "France" : (p.country ?? ""),
                    genre: (commune ? "commune" : "lieu") as Suggestion["genre"],
                  };
                })
            )
            .catch(() => [] as Suggestion[]),
        ];

        const results = await Promise.all(requests);
        // Classement : la commune dont le nom commence par ce qu'on tape, puis les
        // lieux qui commencent pareil, puis le reste ; les adresses en dernier.
        const nq = norm(q);
        const score = (x: Suggestion) => {
          const prefixe = norm(x.label).startsWith(nq) || norm(x.city).startsWith(nq);
          if (x.genre === "commune") return prefixe ? 0 : 2;
          if (x.genre === "lieu") return prefixe ? 1 : 3;
          return 4;
        };
        const vus = new Set<string>();
        const list = results.flat()
          .filter((x) => { const k = norm(x.label); if (vus.has(k)) return false; vus.add(k); return true; })
          .map((x, i) => ({ x, i, s: score(x) }))
          .sort((a, b) => a.s - b.s || a.i - b.i)
          .map(({ x }) => x)
          .slice(0, 8);
        setSuggestions(list);
        setOpen(list.length > 0);
      } catch {
        /* requête annulée : rien à afficher */
      }
    }, 250);
  }

  return (
    <div ref={wrapper} className="relative">
      <input
        className={inputClassName ?? "input"}
        placeholder={placeholder ?? "Adresse, ville ou lieu"}
        value={value}
        onChange={(e) => search(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open && (
        <ul className="absolute z-50 left-0 top-full mt-1 min-w-full w-max max-w-[min(92vw,520px)] bg-asphalte-2 border border-ligne-strong rounded-sm overflow-hidden shadow-xl">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-asphalte-3 flex items-baseline gap-2"
                onClick={() => {
                  onChange(s.label);
                  onSelect?.(s);
                  setOpen(false);
                }}
              >
                <span className="text-blanc flex-1 whitespace-nowrap">{s.label}</span>
                <span className="text-blanc-faint text-[11px] font-mono shrink-0">
                  {s.genre === "lieu" ? "Lieu" : s.genre === "commune" ? "Commune" : s.country === "France" ? s.postcode : s.country}
                </span>
              </button>
            </li>
          ))}
          <li className="px-3.5 py-1.5 text-right font-mono text-[9.5px] text-blanc-faint border-t border-ligne">
            Base Adresse Nationale · OpenStreetMap
          </li>
        </ul>
      )}
    </div>
  );
}
