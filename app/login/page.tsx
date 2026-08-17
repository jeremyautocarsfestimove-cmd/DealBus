"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setSaving(true);
    setError(null);
    if (!email || password.length < 6) {
      setError("Email requis et mot de passe d'au moins 6 caractères.");
      setSaving(false);
      return;
    }

    // Purge préventive : une session résiduelle corrompue (fréquent en changeant
    // souvent de compte) peut bloquer indéfiniment la connexion
    try { await supabase.auth.signOut(); } catch { /* sans importance */ }
    try { localStorage.removeItem("dealbus_nav"); } catch { /* idem */ }

    // Destination selon le rôle — avec filet : jamais plus de 2,5 s d'attente
    async function destination(userId: string): Promise<string> {
      const explicite = params.get("next");
      if (explicite) return explicite;
      const lecture = (async () => {
        const { data: p } = await supabase
          .from("profiles").select("role").eq("id", userId).maybeSingle();
        if (p?.role === "transporteur") return "/pro";
        if (p?.role === "admin") return "/admin";
        return "/mes-demandes";
      })();
      const secours = new Promise<string>((r) => setTimeout(() => r("/mes-demandes"), 2500));
      return Promise.race([lecture, secours]);
    }

    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) {
          setError(err.message.toLowerCase().includes("already registered")
            ? "Un compte existe déjà avec cet email."
            : err.message);
          return;
        }
        if (!data.session) {
          setError("Confirmez votre email (lien envoyé), puis reconnectez-vous.");
          return;
        }
        // Création du profil UNIQUEMENT s'il n'existe pas : ne jamais
        // écraser un rôle déjà attribué (admin/transporteur)
        await supabase.from("profiles").upsert({
          id: data.session.user.id,
          role: "client",
          email: data.session.user.email,
          ...(nom.trim() && { nom: nom.trim() }),
        }, { onConflict: "id", ignoreDuplicates: true });
        const dest = await destination(data.session.user.id);
        router.push(dest);
        router.refresh();
        return;
      }

      const { data: signin, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message.includes("Invalid") ? "Identifiants incorrects." : err.message);
        return;
      }
      const dest = await destination(signin.user.id);
      router.push(dest);
      router.refresh();
    } catch (e) {
      setError(`Connexion impossible : ${(e as Error).message || "erreur réseau"}. Réessayez.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card max-w-md mx-auto">
      {mode === "signup" && (
        <div>
          <label className="label">Prénom et nom</label>
          <input onKeyDown={(e) => e.key === "Enter" && go()} className="input mb-4" placeholder="Ex. Jeremy Peloso"
            value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
      )}
      <div>
        <label className="label">Email</label>
        <input onKeyDown={(e) => e.key === "Enter" && go()} className="input mb-4" type="email" placeholder="vous@exemple.fr"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label">Mot de passe</label>
        <input onKeyDown={(e) => e.key === "Enter" && go()} className="input mb-5" type="password" placeholder="6 caractères minimum"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="font-mono text-sm text-[#E8735D] mb-4">{error}</p>}
      <button className="btn-primary w-full disabled:opacity-50" disabled={saving} onClick={go}>
        {saving ? "…" : mode === "login" ? "Me connecter →" : "Créer mon compte →"}
      </button>
      <button
        className="mt-3.5 font-mono text-xs text-blanc-faint hover:text-blanc-dim w-full text-center"
        onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
      >
        {mode === "login" ? "Pas encore de compte → en créer un" : "J'ai déjà un compte → me connecter"}
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-7 py-20">
        <h1 className="h-display text-4xl mb-8 text-center">Connexion</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
