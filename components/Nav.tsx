import Link from "next/link";
import { Logo } from "./Logo";

export function Nav() {
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
        <Link href="/login" className="btn-ghost text-xs px-4 py-2">Connexion →</Link>
      </nav>
    </header>
  );
}
