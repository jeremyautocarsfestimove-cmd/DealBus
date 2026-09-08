"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

type Etat = "verification" | "pret" | "invalide";

// Traduction des messages Supabase, qui reviennent en anglais.
function messageClair(brut: string): string {
  const m = brut.toLowerCase();
  if (m.includes("different from the old")) return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (m.includes("at least") || m.includes("too short")) return "Mot de passe trop court : 6 caractères minimum.";
  if (m.includes("pwned") || m.includes("weak")) return "Ce mot de passe est trop courant. Choisissez-en un autre.";
  if (m.includes("session") || m.includes("jwt")) return "Votre lien a expiré. Demandez-en un nouveau.";
  if (m.includes("same_password")) return "Le nouveau mot de passe doit être différent de l'ancien.";
  return brut;
}

export default function NouveauMotDePassePage() {
  const supabase = createClient();
  const [etat, setEtat] = useState<Etat>("verification");
  const [compte, setCompte] = useState<string | null>(null);
  const [motif, setMotif] = useState<string | null>(null);
  const [mdp, setMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- Ouverture de la session de récupération ----------
  useEffect(() => {
    let actif = true;

    (async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const erreurLien = url.searchParams.get("error_description") ?? hash.get("error_description");
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      // Lien périmé ou déjà consommé : Supabase le dit dans l'URL
      if (erreurLien) {
        if (!actif) return;
        setMotif(
          /expired|invalid/i.test(erreurLien)
            ? "Ce lien a expiré ou a déjà été utilisé."
            : decodeURIComponent(erreurLien)
        );
        setEtat("invalide");
        return;
      }

      // Le client browser (@supabase/ssr, flow PKCE) échange déjà le ?code=
      // automatiquement au démarrage : getSession attend cette initialisation.
      const { data: { session } } = await supabase.auth.getSession();
      let ouverte = session;

      // Filet 1 : le code n'a pas été consommé automatiquement
      if (!ouverte && code) {
        const { data, error: err } = await supabase.auth.exchangeCodeForSession(code);
        if (err) {
          if (!actif) return;
          setMotif(
            /verifier/i.test(err.message)
              ? "Ce lien doit être ouvert dans le navigateur depuis lequel la demande a été faite."
              : "Ce lien a expiré ou a déjà été utilisé."
          );
          setEtat("invalide");
          return;
        }
        ouverte = data.session;
      }

      // Filet 2 : modèle d'email basé sur {{ .TokenHash }} plutôt que sur
      // {{ .ConfirmationURL }} — fonctionne alors depuis n'importe quel appareil.
      if (!ouverte && tokenHash && type === "recovery") {
        const { data, error: err } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (err) {
          if (!actif) return;
          setMotif("Ce lien a expiré ou a déjà été utilisé.");
          setEtat("invalide");
          return;
        }
        ouverte = data.session;
      }

      if (!actif) return;

      if (!ouverte) {
        setMotif("Aucun lien de réinitialisation valide n'a été détecté.");
        setEtat("invalide");
        return;
      }

      // Le jeton disparaît de la barre d'adresse une fois consommé
      window.history.replaceState({}, "", "/nouveau-mot-de-passe");
      setCompte(ouverte.user.email ?? null);
      setEtat("pret");
    })();

    return () => { actif = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Enregistrement ----------
  async function enregistrer() {
    setError(null);
    if (mdp.length < 6) {
      setError("Mot de passe trop court : 6 caractères minimum.");
      return;
    }
    if (mdp !== confirmation) {
      setError("Les deux mots de passe ne sont pas identiques.");
      return;
    }

    setSaving(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: mdp });
      if (err) { setError(messageClair(err.message)); return; }

      // Le cache de la barre de navigation est reconstruit à la volée
      try { localStorage.removeItem("dealbus_nav"); } catch { /* sans importance */ }

      // Destination selon le rôle, avec le même filet que la page de connexion
      const { data: { user } } = await supabase.auth.getUser();
      const lecture = (async () => {
        if (!user) return "/login";
        const { data: p } = await supabase
          .from("profiles").select("role").eq("id", user.id).maybeSingle();
        const role = p?.role ?? "client";
        if (role === "transporteur") return "/pro";
        if (role === "admin") return "/admin";
        return "/mes-demandes";
      })();
      const secours = new Promise<string>((r) => setTimeout(() => r("/mes-demandes"), 2500));
      window.location.assign(await Promise.race([lecture, secours]));
    } catch (e) {
      setError(`Enregistrement impossible : ${(e as Error).message || "erreur réseau"}. Réessayez.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-7 py-20">
        <h1 className="h-display text-4xl mb-8 text-center">Nouveau mot de passe</h1>

        {etat === "verification" && (
          <div className="card max-w-md mx-auto text-center">
            <p className="font-mono text-sm text-blanc-faint">Vérification du lien…</p>
          </div>
        )}

        {etat === "invalide" && (
          <div className="card max-w-md mx-auto">
            <p className="font-semibold mb-2">Lien inutilisable.</p>
            <p className="text-sm text-blanc-dim mb-5 leading-6">
              {motif} Les liens sont valables une heure et ne servent qu&apos;une fois.
              Demandez-en un nouveau, c&apos;est immédiat.
            </p>
            <Link href="/mot-de-passe-oublie" className="btn-primary w-full">
              Demander un nouveau lien →
            </Link>
          </div>
        )}

        {etat === "pret" && (
          <div className="card max-w-md mx-auto">
            {compte && (
              <p className="text-sm text-blanc-dim mb-5">
                Compte : <span className="font-mono text-blanc">{compte}</span>
              </p>
            )}
            <div>
              <label className="label">Nouveau mot de passe</label>
              <input
                onKeyDown={(e) => e.key === "Enter" && enregistrer()}
                className="input mb-4"
                type="password"
                placeholder="6 caractères minimum"
                autoComplete="new-password"
                value={mdp}
                onChange={(e) => setMdp(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Confirmation</label>
              <input
                onKeyDown={(e) => e.key === "Enter" && enregistrer()}
                className="input mb-5"
                type="password"
                placeholder="Ressaisissez le mot de passe"
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </div>
            {error && <p className="font-mono text-sm text-[#E8735D] mb-4">{error}</p>}
            <button
              className="btn-primary w-full disabled:opacity-50"
              disabled={saving}
              onClick={enregistrer}
            >
              {saving ? "…" : "Enregistrer et me connecter →"}
            </button>
          </div>
        )}
      </main>
    </>
  );
}