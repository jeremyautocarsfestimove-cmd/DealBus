"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Statut = "idle" | "en_attente" | "validee" | "refusee";

export function ReserverRetourButton({
  retourId,
  initialStatut = "idle",
}: {
  retourId: string;
  initialStatut?: Statut;
}) {
  const [statut, setStatut] = useState<Statut>(initialStatut);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function reserver() {
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login?next=/retours"); return; }

    if (statut === "refusee") {
      // Redemande : la réservation refusée repasse en attente
      const { error: err } = await supabase
        .from("reservations_retour")
        .update({ statut: "en_attente" })
        .eq("retour_id", retourId)
        .eq("client_id", user.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from("reservations_retour").insert({
        retour_id: retourId,
        client_id: user.id,
      });
      if (err) { setError("Erreur — connexion requise ou trajet indisponible."); setSaving(false); return; }
    }
    setStatut("en_attente");
    setSaving(false);
  }

  if (statut === "validee") {
    return (
      <span className="font-mono text-[12.5px] text-vert flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-vert" />
        Réservation confirmée ✓ — le transporteur va vous contacter
      </span>
    );
  }

  if (statut === "en_attente") {
    return (
      <span className="font-mono text-[12.5px] text-blanc-dim flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-ambre" />
        En attente de validation du transporteur
      </span>
    );
  }

  return (
    <div>
      {statut === "refusee" && (
        <p className="font-mono text-xs text-blanc-faint mb-2.5">
          Votre demande n&apos;a pas été retenue — vous pouvez retenter tant que le trajet est disponible.
        </p>
      )}
      <button className="btn-primary disabled:opacity-50" disabled={saving} onClick={reserver}>
        {saving ? "Envoi…" : statut === "refusee" ? "Redemander ce trajet →" : "Réserver ce trajet →"}
      </button>
      {error && (
        <p className="font-mono text-xs text-[#E8735D] mt-2">{error}</p>
      )}
    </div>
  );
}
