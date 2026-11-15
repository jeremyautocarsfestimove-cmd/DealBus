"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Compteurs = { demandes: number; offres: number; missions: number; factures: number; avis: number; messages: number };

type Onglet = { href: string; label: string; cle?: keyof Compteurs; exact?: boolean; accent?: boolean; sous?: { href: string; label: string }[] };

export const ONGLETS_PRO: Onglet[] = [
  { href: "/pro", label: "Demandes", cle: "demandes", exact: true, accent: true },
  { href: "/pro/offres", label: "Mes offres", cle: "offres" },
  { href: "/pro/missions", label: "Missions", cle: "missions" },
  { href: "/pro/factures", label: "Factures", cle: "factures" },
  { href: "/pro/avis", label: "Avis", cle: "avis" },
  {
    href: "/pro/profil", label: "Mon entreprise",
    sous: [
      { href: "/pro/profil", label: "Coordonnées" },
      { href: "/pro/profil#zones", label: "Mes zones" },
      { href: "/pro/profil#vehicules", label: "Véhicules" },
    ],
  },
];

// Onglets de l'espace transporteur, affichés dans la capsule du menu (ordinateur)
// ou en liste dans le panneau du menu (téléphone, avec `liste`).
export function ProTabs({ compteurs, liste, onNavigate }: { compteurs: Compteurs; liste?: boolean; onNavigate?: () => void }) {
  const chemin = usePathname();
  const actif = (o: Onglet) => (o.exact ? chemin === o.href : chemin === o.href || chemin.startsWith(o.href + "/"));
  return (
    <nav className={liste ? "pro-tabs pro-tabs-liste" : "pro-tabs flex gap-1"} aria-label="Espace transporteur">
      {ONGLETS_PRO.map((o) => {
        const n = o.cle ? compteurs[o.cle] : 0;
        const lien = (
          <Link href={o.href} aria-current={actif(o) ? "page" : undefined} onClick={onNavigate}>
            {o.label}
            {n > 0 && <em className={o.accent ? "" : "muted"}>{n}</em>}
            {o.sous && !liste && <span className="pro-chevron" aria-hidden="true">▾</span>}
          </Link>
        );
        if (!o.sous) return <span key={o.href} className="pro-item">{lien}</span>;
        return (
          <span key={o.href} className="pro-item pro-avec-sous">
            {lien}
            <span className="pro-sous">
              {o.sous.map((s) => <Link key={s.href} href={s.href} onClick={onNavigate}>{s.label}</Link>)}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
