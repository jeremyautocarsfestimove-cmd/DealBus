"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { FEATURES } from "@/lib/features";
import type { createClient as CreateClientType } from "@/lib/supabase/client";

// Chargement différé de Supabase : la librairie (~40 Ko) sort du bundle
// critique de la home — elle n'est téléchargée qu'après le premier rendu.
let clientPromise: Promise<ReturnType<typeof CreateClientType>> | null = null;
function getSupabase() {
  clientPromise ??= import("@/lib/supabase/client").then((m) => m.createClient());
  return clientPromise;
}

type NavState = { checked: boolean; name: string | null; role: string | null };
const CACHE_KEY = "dealbus_nav";

export function Nav() {
  const router = useRouter();
  const [state, setState] = useState<NavState>({ checked: false, name: null, role: null });

  // 1. Avant le premier affichage : restaurer l'état depuis le cache local (zéro saut)
  useLayoutEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
      if (cached) setState({ checked: true, name: cached.n ?? null, role: cached.r ?? null });
      else setState((s) => ({ ...s, checked: false }));
    } catch { /* cache illisible : on attend le fetch */ }
  }, []);

  // 2. En arrière-plan : rafraîchir depuis Supabase et mettre le cache à jour
  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = await getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setState({ checked: true, name: null, role: null });
        localStorage.removeItem(CACHE_KEY);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles").select("nom, role").eq("id", user.id).maybeSingle();
      if (!active) return;
      const name = profile?.nom?.trim() || user.email?.split("@")[0] || "Mon compte";
      const role = profile?.role ?? null;
      setState({ checked: true, name, role });
      localStorage.setItem(CACHE_KEY, JSON.stringify({ n: name, r: role }));
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    localStorage.removeItem(CACHE_KEY);
    setState({ checked: true, name: null, role: null });
    router.push("/");
    router.refresh();
  }

  const { checked, name, role } = state;
  const [menuOuvert, setMenuOuvert] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermeture du menu au clic extérieur et à la touche Échap
  useEffect(() => {
    if (!menuOuvert) return;
    const clic = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOuvert(false); };
    const touche = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOuvert(false); };
    document.addEventListener("mousedown", clic);
    document.addEventListener("keydown", touche);
    return () => { document.removeEventListener("mousedown", clic); document.removeEventListener("keydown", touche); };
  }, [menuOuvert]);

  // Entrées du menu déroulant selon le rôle
  const entrees: { href: string; label: string; aide?: string }[] =
    role === "transporteur" ? [
      { href: "/pro", label: "Mon espace", aide: "Demandes, offres, missions" },
      { href: "/pro/profil", label: "Mon entreprise", aide: "Dépôt, zones, véhicules" },
      { href: "/compte", label: "Mon compte", aide: "Email, mot de passe" },
    ] : role === "admin" ? [
      { href: "/admin", label: "Administration" },
      { href: "/admin/support", label: "Support" },
      { href: "/compte", label: "Mon compte" },
    ] : [
      { href: "/mes-demandes", label: "Mes demandes", aide: "Offres reçues, messagerie" },
      { href: "/demande", label: "Nouvelle demande" },
      { href: "/compte", label: "Mon compte", aide: "Email, mot de passe" },
    ];

  const [panneau, setPanneau] = useState(false);
  const client = checked && role !== "transporteur" && role !== "admin";
  const LIENS = [
    { href: "/#comment", label: "Comment ça marche" },
    { href: "/#pour-qui", label: "Pour qui" },
    { href: "/#vehicule", label: "Autocars" },
    { href: "/#prix", label: "Tarifs" },
    { href: "/#destinations", label: "Destinations" },
    { href: "/#questions", label: "Questions" },
  ];

  return (
    <header className="nav-capsule sticky top-0 z-[100] px-3 pt-2.5 pb-2.5 md:pt-3 md:pb-3 pointer-events-none">
      <nav className="pointer-events-auto relative max-w-6xl mx-auto h-[54px] md:h-[60px] pl-5 pr-2 md:pr-2.5 flex items-center gap-5 rounded-full bg-white/80 backdrop-blur-xl text-encre shadow-[0_10px_30px_-12px_rgba(18,21,27,.35)] ring-1 ring-black/5">
        <Link href="/" className="text-encre [&_svg]:text-[#E07B1A] flex-none"><Logo /></Link>

        {/* Menu central : jamais rendu tant que l'état est inconnu, jamais pour un transporteur */}
        {client && (
          <div className="hidden lg:flex items-center gap-6 text-[14.5px] text-[#4a5060]">
            {LIENS.map((l) => <Link key={l.href} href={l.href} className="hover:text-encre transition whitespace-nowrap">{l.label}</Link>)}
            {FEATURES.retours && <Link href="/retours" className="hover:text-encre transition">Retours à vide</Link>}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
        {!checked ? (
          <span className="w-28" />
        ) : name ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOuvert((o) => !o)}
              aria-expanded={menuOuvert}
              aria-haspopup="menu"
              className={`flex items-center gap-2.5 text-sm font-semibold rounded-full pl-1 pr-3 py-1 transition border
                ${menuOuvert ? "bg-white border-black/10" : "border-transparent hover:bg-white"}`}
            >
              <span className="w-8 h-8 rounded-full bg-ambre text-encre flex items-center justify-center text-xs font-bold uppercase">
                {name.charAt(0)}
              </span>
              <span className="hidden sm:block max-w-[140px] truncate">{name}</span>
              <span className={`text-blanc-faint text-[10px] transition ${menuOuvert ? "rotate-180" : ""}`}>▼</span>
            </button>

            {menuOuvert && (
              <div role="menu" className="absolute right-0 mt-3 w-64 bg-white rounded-[22px] shadow-2xl ring-1 ring-black/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-ligne">
                  <p className="font-semibold text-sm truncate">{name}</p>
                  <p className="text-[12px] text-blanc-faint">
                    {role === "transporteur" ? "Transporteur" : role === "admin" ? "Administration" : "Client"}
                  </p>
                </div>
                <ul className="py-1.5">
                  {entrees.map((e) => (
                    <li key={e.href}>
                      <Link href={e.href} role="menuitem" onClick={() => setMenuOuvert(false)}
                        className="block px-4 py-2.5 hover:bg-asphalte-2 transition">
                        <span className="block text-sm">{e.label}</span>
                        {e.aide && <span className="block text-[11.5px] text-blanc-faint">{e.aide}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-ligne py-1.5">
                  <button role="menuitem" onClick={() => { setMenuOuvert(false); logout(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#C2410C] hover:bg-asphalte-2 transition">
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/login" className="text-[14.5px] font-medium px-3 py-2 rounded-full hover:bg-white transition whitespace-nowrap">Connexion</Link>
            <Link href="/pro" className="hidden sm:inline-flex text-[14.5px] font-semibold px-4 py-2.5 rounded-full bg-[#12151B] text-white hover:bg-[#2a2f3a] transition whitespace-nowrap">Espace pro</Link>
          </>
        )}
        {client && (
          <Link href="/demande" className="hidden md:inline-flex nav-devis text-[14.5px] font-semibold px-5 py-2.5 rounded-full text-encre whitespace-nowrap">Demander un devis</Link>
        )}
        {client && (
          <button type="button" onClick={() => setPanneau((o) => !o)} aria-expanded={panneau} aria-label="Menu"
            className="lg:hidden w-10 h-10 rounded-full grid place-items-center hover:bg-white transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {panneau ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        )}
        </div>

        {/* Panneau du menu sur téléphone et tablette */}
        {panneau && client && (
          <div className="lg:hidden absolute left-0 right-0 top-full mt-2 bg-white rounded-[26px] shadow-2xl ring-1 ring-black/5 p-3">
            <ul>
              {LIENS.map((l) => (
                <li key={l.href}><Link href={l.href} onClick={() => setPanneau(false)} className="block px-4 py-3 rounded-2xl text-[16px] hover:bg-asphalte-2">{l.label}</Link></li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-ligne">
              <Link href="/pro" onClick={() => setPanneau(false)} className="text-center text-[15px] font-semibold px-4 py-3 rounded-full bg-[#12151B] text-white">Espace pro</Link>
              <Link href="/demande" onClick={() => setPanneau(false)} className="nav-devis text-center text-[15px] font-semibold px-4 py-3 rounded-full text-encre">Demander un devis</Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
