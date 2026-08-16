"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { createClient } from "@/lib/supabase/client";

export function Nav() {
  const router = useRouter();
  const supabase = createClient();
  const [checked, setChecked] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) { setChecked(true); return; }
      const { data: profile } = await supabase
        .from("profiles").select("nom").eq("id", user.id).maybeSingle();
      if (!active) return;
      setDisplayName(profile?.nom?.trim() || user.email?.split("@")[0] || "Mon compte");
      setChecked(true);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setDisplayName(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-asphalte/90 backdrop-blur border-b border-ligne">
      <nav className="max-w-6xl mx-auto px-7 py-4 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-blanc-dim">
          <Link href="/demande" className="hover:text-blanc">Faire une demande</Link>
          <Link href="/mes-demandes" className="hover:text-blanc">Mes demandes</Link>
          <Link href="/retours" className="hover:text-blanc">Retours à vide</Link>
          <Link href="/pro" className="text-vert hover:opacity-80">Espace transporteur</Link>
        </div>
        {!checked ? (
          <span className="w-28" />
        ) : displayName ? (
          <div className="flex items-center gap-3">
            <Link href="/mes-demandes" className="flex items-center gap-2.5 text-sm font-semibold hover:text-ambre">
              <span className="w-7 h-7 rounded-full bg-ambre text-asphalte flex items-center justify-center font-mono text-xs font-bold uppercase">
                {displayName.charAt(0)}
              </span>
              <span className="hidden sm:block max-w-[140px] truncate">{displayName}</span>
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
