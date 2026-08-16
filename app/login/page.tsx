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
    const next = params.get("next") ?? "/mes-demandes";

    if (mode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message.toLowerCase().includes("already registered")
          ? "Un compte existe déjà avec cet email."
          : err.message);
        setSaving(false);
        return;
      }
      if (!data.session) {
        setError("Confirmez votre email (lien envoyé), puis reconnectez-vous.");
        setSaving(false);
        return;
      }
      await supabase.from("profiles").upsert({
        id: data.session.user.id,
        role: "client",
        ...(nom.trim() && { nom: nom.trim() }),
      });
      router.push(next);
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError("Identifiants incorrects."); setSaving(false); return; }
    router.push(next);
  }

  return (
    <div className="card max-w-md mx-auto">
      {mode === "signup" && (
        <div>
          <label className="label">Prénom et nom</label>
          <input className="input mb-4" placeholder="Ex. Jeremy Peloso"
            value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
      )}
      <div>
        <label className="label">Email</label>
        <input className="input mb-4" type="email" placeholder="vous@exemple.fr"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label">Mot de passe</label>
        <input className="input mb-5" type="password" placeholder="6 caractères minimum"
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
