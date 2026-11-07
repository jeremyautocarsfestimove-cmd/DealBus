"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Entree = {
  href: string; label: string; exact?: boolean;
  alerte?: "transporteurs" | "litiges" | "support" | "maintenance";
  compteur?: "clients" | "demandes";
};
type Categorie = { titre: string | null; entrees: Entree[] };

const MENU: Categorie[] = [
  {
    titre: null,
    entrees: [{ href: "/admin", label: "Cockpit", exact: true }],
  },
  {
    titre: "CRM",
    entrees: [
      { href: "/admin/clients", label: "Clients", compteur: "clients" },
      { href: "/admin/demandes", label: "Demandes", compteur: "demandes" },
      { href: "/admin/missions", label: "Missions & commissions" },
      { href: "/admin/litiges", label: "Annulations & litiges", alerte: "litiges" },
      { href: "/admin/messagerie", label: "Messagerie" },
      { href: "/admin/support", label: "Support", alerte: "support" },
      { href: "/admin/retours", label: "Retours à vide" },
    ],
  },
  {
    titre: "Réseau transporteurs",
    entrees: [
      { href: "/admin/transporteurs", label: "Comptes", alerte: "transporteurs" },
      { href: "/admin/avis", label: "Avis" },
    ],
  },
  {
    titre: "Développement",
    entrees: [
      { href: "/admin/prospection", label: "Prospection transporteurs" },
      { href: "/admin/prospection-clients", label: "Prospection clients" },
      { href: "/admin/reseaux", label: "Réseaux sociaux" },
    ],
  },
  {
    titre: "Réglages",
    entrees: [{ href: "/admin/parametres", label: "Paramètres du site", alerte: "maintenance" }],
  },
];

export function AdminMenu({ alertes, compteurs }: {
  alertes: { transporteurs: number; litiges: number; support: number; maintenance: number };
  compteurs: { clients: number; demandes: number };
}) {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);

  const actif = (e: Entree) =>
    e.exact ? chemin === e.href : chemin === e.href || chemin.startsWith(e.href + "/");

  const courante = MENU.flatMap((c) => c.entrees).find(actif)?.label ?? "Administration";

  return (
    <nav className="lg:sticky lg:top-24 lg:self-start" aria-label="Navigation de l'administration">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="lg:hidden w-full flex items-center justify-between gap-3 card py-3 mb-3"
      >
        <span className="text-sm font-semibold">{courante}</span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint">
          {ouvert ? "Fermer" : "Menu"}
        </span>
      </button>

      <div className={`${ouvert ? "block" : "hidden"} lg:block sombre rounded p-3 space-y-5`}>
        <div className="px-1 pt-1">
          <p className="font-condensed font-bold uppercase text-xl leading-none">Deal<span className="text-ambre">Bus</span> <span className="font-mono text-[10px] text-blanc-faint tracking-wider align-middle">CRM</span></p>
        </div>
        <form action="/admin/clients" method="get" className="px-1">
          <input name="q" placeholder="Chercher un client…" aria-label="Chercher un client"
            className="w-full bg-asphalte-2 border border-ligne rounded-sm px-3 py-2 text-[13px] text-blanc placeholder:text-blanc-faint focus:outline-none focus:border-ambre-fort" />
        </form>
        {MENU.map((cat, i) => (
          <div key={cat.titre ?? `bloc-${i}`}>
            {cat.titre && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-blanc-faint mb-1.5 px-3">
                {cat.titre}
              </p>
            )}
            <ul className="space-y-0.5">
              {cat.entrees.map((e) => {
                const on = actif(e);
                const n = e.alerte ? alertes[e.alerte] : 0;
                const c = e.compteur ? compteurs[e.compteur] : 0;
                return (
                  <li key={e.href}>
                    <Link
                      href={e.href}
                      onClick={() => setOuvert(false)}
                      aria-current={on ? "page" : undefined}
                      className={`flex items-center justify-between gap-2 rounded-sm px-3 py-[7px] text-[13px] transition ${
                        on
                          ? "bg-asphalte-3 text-blanc font-semibold border-l-2 border-ambre"
                          : "text-blanc-dim hover:text-blanc hover:bg-asphalte-2 border-l-2 border-transparent"
                      }`}
                    >
                      {e.label}
                      {n === 0 && c > 0 && (
                        <span className="font-mono text-[10px] text-blanc-faint">{c}</span>
                      )}
                      {n > 0 && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-[#FCEBE4] text-[#C2410C]">
                          {n}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
