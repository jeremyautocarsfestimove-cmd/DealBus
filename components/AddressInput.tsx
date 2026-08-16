"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = {
  label: string;
  city: string;
  postcode: string;
  dept: string;       // département français ("" si étranger)
  country: string;    // "France", "Belgique", …
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
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (s: Suggestion) => void;
  placeholder?: string;
  mode?: "fr" | "international";
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
          // --- France : BAN ---
          fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=4`, { signal })
            .then((r) => r.json())
            .then((data) =>
              (data.features ?? []).map(
                (f: { properties: { label: string; city: string; postcode: string; context: string } }) => ({
                  label: f.properties.label,
                  city: f.properties.city,
                  postcode: f.properties.postcode ?? "",
                  dept: (f.properties.context ?? "").split(",")[0].trim() || f.properties.postcode?.slice(0, 2) || "",
                  country: "France",
                })
              )
            )
            .catch(() => [] as Suggestion[]),
        ];

        if (mode === "international") {
          // --- Monde : Photon (OpenStreetMap) ---
          requests.push(
            fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=fr`, { signal })
              .then((r) => r.json())
              .then((data) =>
                (data.features ?? [])
                  .filter((f: { properties: { countrycode?: string } }) =>
                    f.properties.countrycode && f.properties.countrycode !== "FR")
                  .slice(0, 4)
                  .map((f: { properties: { name?: string; city?: string; postcode?: string; country?: string } }) => {
                    const p = f.properties;
                    const parts = [p.name, p.city && p.city !== p.name ? p.city : null].filter(Boolean);
                    return {
                      label: `${parts.join(", ")}${p.country ? `, ${p.country}` : ""}`,
                      city: p.city ?? p.name ?? "",
                      postcode: p.postcode ?? "",
                      dept: "",
                      country: p.country ?? "",
                    };
                  })
              )
              .catch(() => [] as Suggestion[])
          );
        }

        const results = await Promise.all(requests);
        const list = results.flat().slice(0, 7);
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
        className="input"
        placeholder={placeholder ?? "Adresse, ville ou lieu"}
        value={value}
        onChange={(e) => search(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open && (
        <ul className="absolute z-30 left-0 right-0 top-full mt-1 bg-asphalte-2 border border-ligne-strong rounded-sm overflow-hidden shadow-xl">
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
                <span className="text-blanc flex-1 truncate">{s.label}</span>
                <span className="text-blanc-faint text-[11px] font-mono shrink-0">
                  {s.country === "France" ? s.postcode : s.country}
                </span>
              </button>
            </li>
          ))}
          <li className="px-3.5 py-1.5 text-right font-mono text-[9.5px] text-blanc-faint border-t border-ligne">
            {mode === "international" ? "BAN · OpenStreetMap" : "Base Adresse Nationale"}
          </li>
        </ul>
      )}
    </div>
  );
}
