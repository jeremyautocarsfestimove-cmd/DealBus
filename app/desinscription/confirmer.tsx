"use client";

import { useState } from "react";

export function Confirmer({ requete }: { requete: string }) {
  const [etat, setEtat] = useState<"attente" | "envoi" | "fait" | "erreur">("attente");

  async function confirmer() {
    setEtat("envoi");
    try {
      const res = await fetch(`/api/desinscription?${requete}`, { method: "POST" });
      setEtat(res.ok ? "fait" : "erreur");
    } catch {
      setEtat("erreur");
    }
  }

  if (etat === "fait") {
    return (
      <>
        <h1 className="h-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] mb-5">C&apos;est fait.</h1>
        <p className="text-blanc-dim leading-relaxed">
          Votre adresse est retirée de notre liste. Vous ne recevrez plus de message de prospection de DealBus.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="h-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] mb-5">Ne plus recevoir nos messages ?</h1>
      <p className="text-blanc-dim leading-relaxed mb-7">
        Un clic suffit. Votre adresse sera retirée de notre liste tout de suite.
      </p>
      <button className="btn-primary disabled:opacity-50" disabled={etat === "envoi"} onClick={confirmer}>
        {etat === "envoi" ? "Un instant…" : "Me désinscrire"}
      </button>
      {etat === "erreur" && (
        <p className="text-sm text-blanc-dim mt-5">
          La désinscription n&apos;a pas abouti. Réessayez, ou écrivez « STOP » à{" "}
          <a href="mailto:contact@dealbus.fr?subject=STOP" className="text-ambre underline">contact@dealbus.fr</a>.
        </p>
      )}
    </>
  );
}
