"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Barre d'administration persistante, montée dans le layout : elle remplace
// les boutons de retour ad hoc qui différaient d'une page à l'autre
// (« ← Back-office », « ← Pilotage », « ← Retour à l'administration »).

const PILOTAGE = [
  { href: "/admin", label: "Pilotage", exact: true },
  { href: "/admin/transporteurs", label: "Transporteurs", alerte: "transporteurs" as const },
  { href: "/admin/demandes", label: "Demandes" },
  { href: "/admin/missions", label: "Missions & commissions" },
  { href: "/admin/litiges", label: "Annulations & litiges", alerte: "litiges" as const },
  { href: "/admin/avis", label: "Avis" },
  { href: "/admin/retours", label: "Retours à vide" },
];

const OUTILS = [
  { href: "/admin/prospection", label: "Prospection transporteurs" },
  { href: "/admin/prospection-clients", label: "Prospection clients" },
  { href: "/admin/reseaux", label: "Réseaux sociaux" },
];

export function AdminBar({ alertes }: { alertes: { transporteurs: number; litiges: number } }) {
  const chemin = usePathname();

  const actif = (href: string, exact?: boolean) =>
    exact ? chemin === href : chemin === href || chemin.startsWith(href + "/");

  const classe = (on: boolean) =>
    `shrink-0 whitespace-nowrap text-[13px] font-semibold px-3.5 py-2 rounded-sm border transition ${
      on
        ? "bg-asphalte-3 text-blanc border-ligne-strong"
        : "text-blanc-faint border-transparent hover:text-blanc-dim hover:bg-asphalte-2"
    }`;

  return (
    <div className="sticky top-[65px] z-40 bg-asphalte-2 border-b border-ligne">
      <div className="max-w-6xl mx-auto px-7 py-2.5 flex items-center gap-1.5 overflow-x-auto">
        {PILOTAGE.map((l) => {
          const n = l.alerte ? alertes[l.alerte] : 0;
          return (
            <Link key={l.href} href={l.href} className={classe(actif(l.href, l.exact))}>
              {l.label}
              {n > 0 && (
                <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-[#FCEBE4] text-[#C2410C]">
                  {n}
                </span>
              )}
            </Link>
          );
        })}

        <span className="shrink-0 w-px h-5 bg-ligne-strong mx-2" aria-hidden="true" />

        {OUTILS.map((l) => (
          <Link key={l.href} href={l.href} className={classe(actif(l.href))}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
