"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { createClient } from "@/lib/supabase/client";

type NavState = { checked: boolean; name: string | null; role: string | null };
const CACHE_KEY = "dealbus_nav";

export function Nav() {
  const router = useRouter();
  const supabase = createClient();
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
    await supabase.auth.signOut();
    localStorage.removeItem(CACHE_KEY);
    setState({ checked: true, name: null, role: null });
    router.push("/");
    router.refresh();
  }

  const { checked, name, role } = state;
  const espaceHref = role === "transporteur" ? "/pro" : "/mes-demandes";

  return (
    <header className="sticky top-0 z-50 bg-asphalte/90 backdrop-blur border-b border-ligne">
      <nav className="max-w-6xl mx-auto px-7 py-4 flex items-center justify-between">
        <Link href="/"><Logo /></Link>

        {/* Menu central : jamais rendu tant que l'état est inconnu, jamais pour un transporteur */}
        {checked && role !== "transporteur" && (
          <div className="hidden md:flex items-center gap-8 text-sm text-blanc-dim">
            <Link href="/demande" className="hover:text-blanc">Faire une demande</Link>
            <Link href="/mes-demandes" className="hover:text-blanc">Mes demandes</Link>
            <Link href="/retours" className="hover:text-blanc">Retours à vide</Link>
            <Link href="/pro" className="text-vert hover:opacity-80">Inscription transporteur</Link>
          </div>
        )}

        {!checked ? (
          <span className="w-28" />
        ) : name ? (
          <div className="flex items-center gap-3">
            <Link href={espaceHref} className="flex items-center gap-2.5 text-sm font-semibold hover:text-ambre">
              <span className="w-7 h-7 rounded-full bg-ambre text-asphalte flex items-center justify-center font-mono text-xs font-bold uppercase">
                {name.charAt(0)}
              </span>
              <span className="hidden sm:block max-w-[140px] truncate">{name}</span>
            </Link>
            <button onClick={logout} className="font-mono text-[11px] text-blanc-faint hover:text-blanc-dim uppercase tracking-wider">
              Déconnexion
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn-ghost text-xs px-4 py-2">Connexion →</Link>
        )}
      </nav>
    </header>
  );
}
