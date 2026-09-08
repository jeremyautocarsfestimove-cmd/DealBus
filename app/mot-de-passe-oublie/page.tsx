"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

function DemandeReinitialisation() {
  const params = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  async function envoyer() {
    setError(null);
    const cible = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cible)) {
      setError("Adresse email invalide.");
      return;
    }

    setSaving(true);
    try {
      // redirectTo bâti sur l'origine réelle de la page : fonctionne en local,
      // en préproduction Vercel et en production sans dépendre d'une variable
      // d'environnement qui pourrait rester sur localhost.
      const { error: err } = await supabase.auth.resetPasswordForEmail(cible, {
        redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
      });
      if (err) {
        setError(
          err.status === 429
            ? "Trop de demandes en peu de temps. Patientez une minute avant de réessayer."
            : err.message
        );
        return;
      }
      // Message identique que le compte existe ou non : pas d'énumération d'adresses.
      setEnvoye(true);
    } catch (e) {
      setError(`Envoi impossible : ${(e as Error).message || "erreur réseau"}. Réessayez.`);
    } finally {
      setSaving(false);
    }
  }

  if (envoye) {
    return (
      <div className="card max-w-md mx-auto">
        <p className="font-semibold mb-2">Email envoyé.</p>
        <p className="text-sm text-blanc-dim mb-5 leading-6">
          Si un compte existe pour{" "}
          <span className="font-mono text-blanc">{email.trim().toLowerCase()}</span>, un lien
          de réinitialisation vient de partir. Il est valable une heure, ne fonctionne
          qu&apos;une seule fois, et doit être ouvert{" "}
          <span className="text-blanc">dans ce même navigateur</span>. Pensez à regarder
          les spams.
        </p>
        <div className="flex flex-col gap-2.5">
          <Link href="/login" className="btn-ghost w-full">Retour à la connexion</Link>
          <button
            className="font-mono text-xs text-blanc-faint hover:text-blanc-dim w-full text-center"
            onClick={() => setEnvoye(false)}
          >
            Renvoyer le lien →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-md mx-auto">
      <p className="text-sm text-blanc-dim mb-5 leading-6">
        Saisissez l&apos;adresse email de votre compte. Vous recevrez un lien pour
        choisir un nouveau mot de passe.
      </p>
      <div>
        <label className="label">Email</label>
        <input
          onKeyDown={(e) => e.key === "Enter" && envoyer()}
          className="input mb-5"
          type="email"
          placeholder="vous@exemple.fr"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && <p className="font-mono text-sm text-[#E8735D] mb-4">{error}</p>}
      <button className="btn-primary w-full disabled:opacity-50" disabled={saving} onClick={envoyer}>
        {saving ? "…" : "Envoyer le lien →"}
      </button>
      <Link
        href="/login"
        className="block mt-3.5 font-mono text-xs text-blanc-faint hover:text-blanc-dim w-full text-center"
      >
        ← Revenir à la connexion
      </Link>
    </div>
  );
}

export default function MotDePasseOubliePage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-7 py-20">
        <h1 className="h-display text-4xl mb-8 text-center">Mot de passe oublié</h1>
        <Suspense>
          <DemandeReinitialisation />
        </Suspense>
      </main>
    </>
  );
}