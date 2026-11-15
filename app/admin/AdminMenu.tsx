"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Cle = "auj" | "dem" | "cpt" | "fac" | "plus";
type Entree = { cle: Cle; href: string; label: string };

// Cinq entrées. Tout le reste est rangé dans « Plus ».
const ENTREES: Entree[] = [
  { cle: "auj", href: "/admin", label: "Aujourd'hui" },
  { cle: "dem", href: "/admin/demandes", label: "Demandes" },
  { cle: "cpt", href: "/admin/transporteurs", label: "Comptes" },
  { cle: "fac", href: "/admin/facturation", label: "Factures" },
  { cle: "plus", href: "/admin/plus", label: "Plus" },
];

const GROUPES: Partial<Record<Cle, { href: string; label: string }[]>> = {
  dem: [{ href: "/admin/demandes", label: "Demandes" }, { href: "/admin/missions", label: "Missions" }],
  cpt: [{ href: "/admin/transporteurs", label: "Transporteurs" }, { href: "/admin/clients", label: "Clients" }],
};

const sous = (chemin: string, base: string) => chemin === base || chemin.startsWith(base + "/");

function cleDe(chemin: string): Cle {
  if (chemin === "/admin") return "auj";
  if (sous(chemin, "/admin/demandes") || sous(chemin, "/admin/missions")) return "dem";
  if (sous(chemin, "/admin/transporteurs") || sous(chemin, "/admin/clients")) return "cpt";
  if (sous(chemin, "/admin/facturation")) return "fac";
  return "plus";
}

const P: Record<Cle, string> = {
  auj: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z",
  dem: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  cpt: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  fac: "M3 6h18v12H3zM3 10h18M7 15h4",
  plus: "M5 12h.01M12 12h.01M19 12h.01",
};

function Icone({ nom }: { nom: Cle }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={nom === "plus" ? 3 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[nom]} />
    </svg>
  );
}

export function AdminMenu({ alertes, admin }: {
  alertes: { comptes: number; plus: number };
  admin: { nom: string; initiales: string };
}) {
  const chemin = usePathname();
  const active = cleDe(chemin);
  const pastille = (c: Cle) => (c === "cpt" ? alertes.comptes : c === "plus" ? alertes.plus : 0);

  return (
    <>
      {/* Barre du haut : logo, cinq entrées sur ordinateur, recherche, compte */}
      <header className="adm-top">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-8 h-[54px] flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 flex-none">
            <span className="w-[26px] h-[26px] rounded-[7px] bg-[#111] text-[#F5A524] grid place-items-center text-[13px] font-extrabold">D</span>
            <span className="font-semibold text-[14px] tracking-tight">DealBus</span>
            <span className="text-[11px] text-[#9A9893]">Admin</span>
          </Link>
          <nav className="adm-tabs hidden lg:flex" aria-label="Navigation de l'administration">
            {ENTREES.map((e) => (
              <Link key={e.cle} href={e.href} aria-current={active === e.cle ? "page" : undefined}>
                <Icone nom={e.cle} />
                {e.label}
                {pastille(e.cle) > 0 && <span className="adm-alert">{pastille(e.cle)}</span>}
              </Link>
            ))}
          </nav>
          <form action="/admin/clients" method="get" className="ml-auto hidden md:block w-[220px]">
            <input name="q" placeholder="Rechercher un client…" aria-label="Rechercher un client"
              className="w-full bg-[#F7F7F5] border border-[#E7E6E2] rounded-lg px-3 py-[7px] text-[12.5px] text-[#111] placeholder:text-[#9A9893] focus:outline-none focus:border-[#F5A524]" />
          </form>
          <Link href="/" className="ml-auto md:ml-0 flex items-center gap-2 flex-none" title={admin.nom}>
            <span className="hidden sm:block text-[12px] text-[#77756F]">Voir le site</span>
            <span className="w-7 h-7 rounded-full bg-[#111] text-white grid place-items-center text-[11px] font-semibold">{admin.initiales}</span>
          </Link>
        </div>
      </header>

      {/* Barre du bas sur téléphone */}
      <nav className="adm-bas lg:hidden" aria-label="Navigation de l'administration">
        {ENTREES.map((e) => (
          <Link key={e.cle} href={e.href} aria-current={active === e.cle ? "page" : undefined}>
            <span className="relative">
              <Icone nom={e.cle} />
              {pastille(e.cle) > 0 && <span className="adm-pastille">{pastille(e.cle)}</span>}
            </span>
            {e.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

/** Sous-navigation : Demandes | Missions, Transporteurs | Clients, ou retour vers « Plus ». */
export function AdminSousNav() {
  const chemin = usePathname();
  const active = cleDe(chemin);
  const groupe = GROUPES[active];
  if (groupe) {
    return (
      <div className="adm-seg mb-5">
        {groupe.map((g) => (
          <Link key={g.href} href={g.href} aria-current={sous(chemin, g.href) ? "page" : undefined}>{g.label}</Link>
        ))}
      </div>
    );
  }
  if (active === "plus" && chemin !== "/admin/plus") {
    return <Link href="/admin/plus" className="inline-block text-[12.5px] text-[#77756F] hover:text-[#111] mb-4">‹ Plus</Link>;
  }
  return null;
}
