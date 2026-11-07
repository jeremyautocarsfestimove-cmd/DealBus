"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Cle = "cockpit" | "clients" | "demandes" | "missions" | "facturation" | "messagerie" | "support" | "litiges" | "transporteurs" | "avis" | "retours" | "prospection" | "prospectionClients" | "reseaux" | "parametres";
type Entree = {
  href: string; label: string; icone: Cle; exact?: boolean;
  alerte?: "transporteurs" | "litiges" | "support" | "maintenance";
  compteur?: "clients" | "demandes";
};
type Categorie = { titre: string | null; entrees: Entree[] };

const MENU: Categorie[] = [
  { titre: null, entrees: [{ href: "/admin", label: "Cockpit", icone: "cockpit", exact: true }] },
  {
    titre: "CRM",
    entrees: [
      { href: "/admin/clients", label: "Clients", icone: "clients", compteur: "clients" },
      { href: "/admin/demandes", label: "Demandes", icone: "demandes", compteur: "demandes" },
      { href: "/admin/missions", label: "Missions", icone: "missions" },
      { href: "/admin/facturation", label: "Facturation", icone: "facturation" },
    ],
  },
  {
    titre: "Relation",
    entrees: [
      { href: "/admin/messagerie", label: "Messagerie", icone: "messagerie" },
      { href: "/admin/support", label: "Support", icone: "support", alerte: "support" },
      { href: "/admin/litiges", label: "Annulations & litiges", icone: "litiges", alerte: "litiges" },
    ],
  },
  {
    titre: "Réseau",
    entrees: [
      { href: "/admin/transporteurs", label: "Transporteurs", icone: "transporteurs", alerte: "transporteurs" },
      { href: "/admin/avis", label: "Avis", icone: "avis" },
      { href: "/admin/retours", label: "Retours à vide", icone: "retours" },
    ],
  },
  {
    titre: "Développement",
    entrees: [
      { href: "/admin/prospection", label: "Prospection transporteurs", icone: "prospection" },
      { href: "/admin/prospection-clients", label: "Prospection clients", icone: "prospectionClients" },
      { href: "/admin/reseaux", label: "Réseaux sociaux", icone: "reseaux" },
    ],
  },
  { titre: "Réglages", entrees: [{ href: "/admin/parametres", label: "Paramètres", icone: "parametres", alerte: "maintenance" }] },
];

// Icônes au trait (style « lucide »), dessinées en SVG inline
const P: Record<Cle, string> = {
  cockpit: "M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z",
  clients: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  demandes: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  missions: "M4 17h16M6 17V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10M8 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M16 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M6 11h12",
  facturation: "M4 2v20l3-2 3 2 3-2 3 2 3-2 1 .7V2l-1 .7-3-2-3 2-3-2-3 2-3-2zM8 8h8M8 12h8M8 16h5",
  messagerie: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  support: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  litiges: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0",
  transporteurs: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01",
  avis: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  retours: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
  prospection: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3",
  prospectionClients: "M22 12h-4l-3 9L9 3l-3 9H2",
  reseaux: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6M8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  parametres: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1",
};

function Icone({ nom }: { nom: Cle }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[nom]} />
    </svg>
  );
}

export function AdminMenu({ alertes, compteurs, admin }: {
  alertes: { transporteurs: number; litiges: number; support: number; maintenance: number };
  compteurs: { clients: number; demandes: number };
  admin: { nom: string; initiales: string };
}) {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);

  const actif = (e: Entree) => (e.exact ? chemin === e.href : chemin === e.href || chemin.startsWith(e.href + "/"));
  const courante = MENU.flatMap((c) => c.entrees).find(actif)?.label ?? "Administration";

  return (
    <>
      {/* Barre mobile */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 adm-sb border-b">
        <span className="flex items-center gap-2 font-semibold text-[14px]">
          <span className="w-6 h-6 rounded-md bg-[#111] text-[#F5A524] grid place-items-center text-[12px] font-extrabold">D</span>
          {courante}
        </span>
        <button type="button" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} className="btn-ghost btn py-1.5 px-3">
          {ouvert ? "Fermer" : "Menu"}
        </button>
      </div>

      <aside className={`${ouvert ? "block" : "hidden"} lg:flex lg:flex-col adm-sb lg:sticky lg:top-0 lg:h-screen overflow-y-auto px-3 py-4`}>
        <Link href="/admin" className="hidden lg:flex items-center gap-2.5 px-2 pb-4">
          <span className="w-[26px] h-[26px] rounded-[7px] bg-[#111] text-[#F5A524] grid place-items-center text-[13px] font-extrabold">D</span>
          <span className="font-semibold text-[14px] tracking-tight">DealBus</span>
          <span className="ml-auto text-[11px] text-[#9A9893]">Admin</span>
        </Link>

        <form action="/admin/clients" method="get" className="mb-2">
          <input name="q" placeholder="Rechercher un client…" aria-label="Rechercher un client"
            className="w-full bg-white border border-[#E7E6E2] rounded-lg px-3 py-[7px] text-[12.5px] text-[#111] placeholder:text-[#9A9893] focus:outline-none focus:border-[#F5A524]" />
        </form>

        <nav className="adm-nav flex-1" aria-label="Navigation de l'administration">
          {MENU.map((cat, i) => (
            <div key={cat.titre ?? `bloc-${i}`}>
              {cat.titre && <p className="adm-grp">{cat.titre}</p>}
              <ul className="space-y-px">
                {cat.entrees.map((e) => {
                  const n = e.alerte ? alertes[e.alerte] : 0;
                  const c = e.compteur ? compteurs[e.compteur] : 0;
                  return (
                    <li key={e.href}>
                      <Link href={e.href} onClick={() => setOuvert(false)} aria-current={actif(e) ? "page" : undefined}>
                        <Icone nom={e.icone} />
                        <span className="truncate">{e.label}</span>
                        {n > 0 ? <span className="adm-alert">{n}</span> : c > 0 ? <span className="adm-cnt">{c}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-4 pt-3 border-t border-[#ECEBE8] flex items-center gap-2.5 px-2">
          <span className="w-7 h-7 rounded-full bg-[#111] text-white grid place-items-center text-[11px] font-semibold">{admin.initiales}</span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold truncate">{admin.nom}</p>
            <Link href="/" className="text-[11.5px] text-[#9A9893] hover:text-[#111]">Voir le site →</Link>
          </div>
        </div>
      </aside>
    </>
  );
}
