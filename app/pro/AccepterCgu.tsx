"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CGU_VERSION, CGU_DATE } from "@/lib/cgu";

// Écran bloquant : les CGU ont changé depuis la dernière acceptation du transporteur.
export function AccepterCgu({ premiereFois, raisonSociale }: { premiereFois: boolean; raisonSociale: string }) {
  const router = useRouter();
  const [lu, setLu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function accepter() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/cgu/accepter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contexte: "reconsentement" }) });
    if (!res.ok) { setErr("Impossible d'enregistrer votre acceptation, réessayez."); setBusy(false); return; }
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="h-display text-4xl mb-2">{premiereFois ? "Avant d'accéder aux demandes" : "Nos conditions ont été mises à jour"}</h1>
        <p className="text-blanc-dim mb-5">
          {premiereFois
            ? <>Pour continuer, {raisonSociale} doit accepter les Conditions Générales d&apos;Utilisation de DealBus (version {CGU_VERSION} du {CGU_DATE}).</>
            : <>La version {CGU_VERSION} des Conditions Générales d&apos;Utilisation s&apos;applique depuis le {CGU_DATE}. Merci de la relire et de l&apos;accepter pour continuer à recevoir les demandes.</>}
        </p>
        <div className="bg-[#FAFAF8] rounded-lg px-4 py-3.5 text-[13px] space-y-2 mb-5">
          <p className="font-semibold">Ce qui vous engage, en résumé</p>
          <ul className="list-disc pl-5 space-y-1 text-[#3A3936]">
            <li><strong>Commission uniquement en cas de succès :</strong> 9 % du prix TTC jusqu&apos;à 2 000 €, 7 % de 2 001 à 5 000 €, 5 % au-delà. Rien n&apos;est dû si le client ne vous choisit pas.</li>
            <li><strong>Due une fois le transport effectué :</strong> la facture est émise le lendemain de la fin du transport, payable à réception. La TVA de 20 % est récupérable.</li>
            <li><strong>Le client vous règle en direct</strong> le prix du transport ; DealBus ne facture que sa commission.</li>
            <li><strong>Droit de suite :</strong> toute prestation issue d&apos;une mise en relation DealBus, même conclue en direct, donne lieu à commission pendant 12 mois (article 14).</li>
          </ul>
          <p><a href="/cgu" target="_blank" className="font-semibold underline underline-offset-2">Lire les CGU complètes ↗</a></p>
        </div>
        <label className="flex gap-3 items-start cursor-pointer mb-5">
          <input type="checkbox" className="mt-1 w-4 h-4 accent-[#F5A524]" checked={lu} onChange={(e) => setLu(e.target.checked)} />
          <span className="text-[13.5px]">J&apos;ai lu et j&apos;accepte les Conditions Générales d&apos;Utilisation de DealBus (version {CGU_VERSION}), y compris le barème de commission et le droit de suite, au nom de {raisonSociale}.</span>
        </label>
        {err && <p className="text-[12.5px] text-[#C2410C] mb-3">{err}</p>}
        <button className="btn btn-primary w-full py-3 disabled:opacity-40" disabled={!lu || busy} onClick={accepter}>{busy ? "Enregistrement…" : "J'accepte et je continue"}</button>
        <p className="text-[11.5px] text-[#9A9893] text-center mt-3">Votre acceptation est horodatée et conservée (date, version, adresse IP).</p>
      </div>
    </div>
  );
}
