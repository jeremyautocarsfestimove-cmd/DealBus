"use client";

import { useEffect, useState } from "react";

// Onglets avec ancre : « Mon profil (3) » répond à #mon-profil, #profil…
// Le menu déroulant de la barre de navigation pointe par exemple sur /pro#profil.
const slug = (l: string) =>
  l.replace(/\s*\(.*\)\s*$/, "").normalize("NFD").replace(/[̀-ͯ]/g, "")
   .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function Tabs({
  labels,
  children,
}: {
  labels: string[];
  children: React.ReactNode[];
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const depuisHash = () => {
      const h = window.location.hash.replace(/^#/, "").toLowerCase();
      if (!h) return;
      const i = labels.findIndex((l) => { const s = slug(l); return s === h || s.includes(h) || h.includes(s); });
      if (i >= 0) setActive(i);
    };
    depuisHash();
    window.addEventListener("hashchange", depuisHash);
    return () => window.removeEventListener("hashchange", depuisHash);
  }, [labels]);

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-8">
        {labels.map((l, i) => (
          <button
            key={l}
            onClick={() => { setActive(i); history.replaceState(null, "", `#${slug(l)}`); }}
            className={`text-[13px] font-semibold px-4 py-2 rounded-sm border transition
              ${active === i
                ? "bg-asphalte-2 text-blanc border-ligne-strong"
                : "text-blanc-faint border-transparent hover:text-blanc-dim"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {children.map((c, i) => (
        <div key={i} hidden={active !== i}>{c}</div>
      ))}
    </div>
  );
}
