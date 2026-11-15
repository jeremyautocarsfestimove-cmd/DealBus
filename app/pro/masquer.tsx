"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// « Cette demande ne m'intéresse pas » : la demande disparaît de la liste du transporteur, pour lui seul.
export function MasquerDemande({ transporteurId, demandeId }: { transporteurId: string; demandeId: string }) {
  const router = useRouter();
  const [etat, setEtat] = useState<"idle" | "envoi" | "erreur">("idle");

  async function masquer() {
    setEtat("envoi");
    const { error } = await createClient().from("demandes_masquees").upsert({ transporteur_id: transporteurId, demande_id: demandeId });
    if (error) { setEtat("erreur"); return; }
    router.refresh();
  }

  return (
    <button type="button" className="pl-masquer" onClick={masquer} disabled={etat === "envoi"}>
      {etat === "envoi" ? "Masquage…" : etat === "erreur" ? "Impossible de masquer, réessayez" : "Cette demande ne m'intéresse pas"}
    </button>
  );
}

// Lien en bas de liste pour faire revenir les demandes masquées.
export function ReafficherDemandes({ transporteurId, nb }: { transporteurId: string; nb: number }) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);

  async function reafficher() {
    setEnvoi(true);
    await createClient().from("demandes_masquees").delete().eq("transporteur_id", transporteurId);
    router.refresh();
    setEnvoi(false);
  }

  return (
    <p className="pl-masquees">
      {nb} demande{nb > 1 ? "s" : ""} masquée{nb > 1 ? "s" : ""}.{" "}
      <button type="button" onClick={reafficher} disabled={envoi}>{envoi ? "Un instant…" : "Tout réafficher"}</button>
    </p>
  );
}
