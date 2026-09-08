"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangerMotDePasse({ email }: { email: string }) {
  const supabase = createClient();
  const [actuel, setActuel] = useState("");
  const [mdp, setMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enregistrer() {
    setError(null);
    setOk(null);

    if (!actuel) { setError("Saisissez votre mot de passe actuel."); return; }
    if (mdp.length < 6) { setError("Mot de passe trop court : 6 caractères minimum."); return; }
    if (mdp !== confirmation) { setError("Les deux mots de passe ne sont pas identiques."); return; }
    if (mdp === actuel) { setError("Le nouveau mot de passe doit être différent de l'ancien."); return; }

    setBusy(true);
    try {
      // Ré-authentification : une session ouverte ne suffit pas à changer le mot de passe
      const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: actuel });
      if (e1) {
        setError(e1.message.includes("Invalid")
          ? "Mot de passe actuel incorrect."
          : e1.message);
        return;
      }

      const { error: e2 } = await supabase.auth.updateUser({ password: mdp });
      if (e2) {
        setError(e2.message.toLowerCase().includes("different from the old")
          ? "Le nouveau mot de passe doit être différent de l'ancien."
          : e2.message);
        return;
      }

      setActuel(""); setMdp(""); setConfirmation("");
      setOk("Mot de passe modifié. Il sera demandé à votre prochaine connexion.");
    } catch (e) {
      setError(`Modification impossible : ${(e as Error).message || "erreur réseau"}. Réessayez.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mb-5">
      <p className="font-semibold text-sm mb-1.5">Mot de passe</p>
      <p className="text-[12.5px] text-blanc-dim mb-5">
        Votre mot de passe actuel est demandé pour valider la modification.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Mot de passe actuel</label>
          <input className="input w-full" type="password" autoComplete="current-password"
            value={actuel} onChange={(e) => setActuel(e.target.value)} />
        </div>
        <div>
          <label className="label">Nouveau mot de passe</label>
          <input className="input w-full" type="password" placeholder="6 caractères minimum"
            autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} />
        </div>
        <div>
          <label className="label">Confirmation</label>
          <input onKeyDown={(e) => e.key === "Enter" && enregistrer()} className="input w-full"
            type="password" placeholder="Ressaisissez le mot de passe" autoComplete="new-password"
            value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
        </div>
      </div>

      {error && <p className="font-mono text-sm text-[#E8735D] mt-4">{error}</p>}
      {ok && <p className="font-mono text-sm text-vert mt-4">{ok}</p>}

      <button className="btn-primary mt-5 disabled:opacity-50" disabled={busy} onClick={enregistrer}>
        {busy ? "…" : "Modifier mon mot de passe →"}
      </button>
    </div>
  );
}