"use client";

import { useState } from "react";

export function Copier({ code }: { code: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(code);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      setCopie(false);
    }
  }

  return (
    <>
      <textarea readOnly value={code} rows={4} onFocus={(e) => e.currentTarget.select()}
        className="input w-full font-mono !text-[12px] leading-relaxed resize-none mb-3" aria-label="Code à copier" />
      <button type="button" className="btn btn-primary" onClick={copier}>
        {copie ? "Code copié" : "Copier le code"}
      </button>
    </>
  );
}
