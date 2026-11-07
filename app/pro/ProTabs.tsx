"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Compteurs = { demandes: number; offres: number; missions: number; factures: number; avis: number; messages: number };

const ONGLETS: { href: string; label: string; cle?: keyof Compteurs; exact?: boolean; accent?: boolean }[] = [
  { href: "/pro", label: "Demandes", cle: "demandes", exact: true, accent: true },
  { href: "/pro/offres", label: "Mes offres", cle: "offres" },
  { href: "/pro/missions", label: "Missions", cle: "missions" },
  { href: "/pro/factures", label: "Factures", cle: "factures" },
  { href: "/pro/avis", label: "Avis", cle: "avis" },
  { href: "/pro/profil", label: "Mon entreprise" },
];

export function ProTabs({ compteurs }: { compteurs: Compteurs }) {
  const chemin = usePathname();
  const actif = (o: (typeof ONGLETS)[number]) => (o.exact ? chemin === o.href : chemin === o.href || chemin.startsWith(o.href + "/"));
  return (
    <nav className="pro-tabs flex gap-1 overflow-x-auto" aria-label="Espace transporteur">
      {ONGLETS.map((o) => {
        const n = o.cle ? compteurs[o.cle] : 0;
        return (
          <Link key={o.href} href={o.href} aria-current={actif(o) ? "page" : undefined}>
            {o.label}
            {n > 0 && <em className={o.accent ? "" : "muted"}>{n}</em>}
          </Link>
        );
      })}
    </nav>
  );
}
