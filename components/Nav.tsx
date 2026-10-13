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
      { href: "/pro", label: "Mon espace", aide: "Leads, offres, missions" },
      { href: "/pro#profil", label: "Mon profil", aide: "Dépôt, zones, véhicules, tarifs" },
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

  return (
    <header className="sombre sticky top-0 z-[100] bg-asphalte/95 backdrop-blur border-b border-ligne">
      <nav className="max-w-6xl mx-auto px-7 py-4 flex items-center justify-between">
        <Link href="/" className="text-ambre"><Logo /></Link>

        {/* Menu central : jamais rendu tant que l'état est inconnu, jamais pour un transporteur */}
        {checked && role !== "transporteur" && role !== "admin" && (
          <div className="hidden md:flex items-center gap-8 text-sm text-blanc-dim">
            <Link href="/demande" className="hover:text-blanc transition">Faire une demande</Link>
            <Link href="/#comment-ca-marche" className="hover:text-blanc transition">Comment ça marche</Link>
            {FEATURES.retours && <Link href="/retours" className="hover:text-blanc transition">Retours à vide</Link>}
            {!name && <Link href="/pro" className="text-vert hover:opacity-80 transition">Inscription transporteur</Link>}
          </div>
        )}

        {!checked ? (
          <span className="w-28" />
        ) : name ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOuvert((o) => !o)}
              aria-expanded={menuOuvert}
              aria-haspopup="menu"
              className={`flex items-center gap-2.5 text-sm font-semibold rounded-sm pl-1 pr-2.5 py-1 transition border
                ${menuOuvert ? "bg-asphalte-2 border-ligne-strong" : "border-transparent hover:bg-asphalte-2"}`}
            >
              <span className="w-7 h-7 rounded-full bg-ambre text-encre flex items-center justify-center font-mono text-xs font-bold uppercase">
                {name.charAt(0)}
              </span>
              <span className="hidden sm:block max-w-[140px] truncate">{name}</span>
              <span className={`text-blanc-faint text-[10px] transition ${menuOuvert ? "rotate-180" : ""}`}>▼</span>
            </button>

            {menuOuvert && (
              <div role="menu" className="absolute right-0 mt-2 w-64 bg-asphalte border border-ligne-strong rounded shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-ligne">
                  <p className="font-semibold text-sm truncate">{name}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint">
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
                    className="w-full text-left px-4 py-2.5 text-sm text-[#E8735D] hover:bg-asphalte-2 transition">
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="btn-ghost text-xs px-4 py-2">Connexion →</Link>
        )}
      </nav>
    </header>
  );
}
