"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ReserverRetourButton({ retourId }: { retourId: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const router = useRouter();
  const supabase = createClient();

  async function reserver() {
    setStatus("saving");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login?next=/retours"); return; }

    const { error } = await supabase.from("reservations_retour").insert({
      retour_id: retourId,
      client_id: user.id,
    });
    setStatus(error ? "error" : "done");
  }

  if (status === "done") {
    return (
      <span className="font-mono text-[12.5px] text-blanc-dim flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-ambre" />
        En attente de validation du transporteur
      </span>
    );
  }

  return (
    <div>
      <button className="btn-primary disabled:opacity-50" disabled={status === "saving"} onClick={reserver}>
        {status === "saving" ? "Envoi…" : "Demander cette place →"}
      </button>
      {status === "error" && (
        <p className="font-mono text-xs text-[#E8735D] mt-2">Erreur — déjà demandé ou connexion requise.</p>
      )}
    </div>
  );
}
