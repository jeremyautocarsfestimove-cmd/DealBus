"use client";

import { useState } from "react";

export function Tabs({
  labels,
  children,
}: {
  labels: string[];
  children: React.ReactNode[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-8">
        {labels.map((l, i) => (
          <button
            key={l}
            onClick={() => setActive(i)}
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
