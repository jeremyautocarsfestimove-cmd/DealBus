"use client";

import { useCallback, useEffect, useState } from "react";

type Etat = {
  installe: boolean; actif: boolean; par_jour: number;
  dernier_envoi: string | null; dernier_resultat: string | null; restants: number;
};

// Bloc « Envoi automatique » des pages de prospection : active ou coupe la
// vague quotidienne (lundi au vendredi) et règle le nombre d'e-mails par jour.
export function EnvoiAuto({ liste }: { liste: "clients" | "transporteurs" }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [actif, setActif] = useState(false);
  const [parJour, setParJour] = useState(30);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const res = await fetch(`/api/admin/campagnes-auto?liste=${liste}`).then((r) => r.json()).catch(() => null);
    if (!res?.ok) return;
    setEtat(res);
    if (res.installe) { setActif(res.actif); setParJour(res.par_jour); }
  }, [liste]);

  useEffect(() => { charger(); }, [charger]);

  async function enregistrer(nouvelActif: boolean) {
    setOccupe(true); setMessage(null);
    const res = await fetch("/api/admin/campagnes-auto", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liste, actif: nouvelActif, par_jour: parJour }),
    }).then((r) => r.json()).catch(() => ({ error: "réseau indisponible" }));
    setOccupe(false);
    if (res.error) { setMessage(`❌ ${res.error}`); return; }
    setActif(res.actif); setParJour(res.par_jour);
    setMessage(res.actif
      ? `Envoi automatique activé : ${res.par_jour} e-mails par jour, du lundi au vendredi.`
      : "Envoi automatique coupé.");
    charger();
  }

  if (!etat) return null;

  if (!etat.installe) {
    return (
      <div className="card mb-8">
        <p className="label">Envoi automatique, du lundi au vendredi</p>
        <p className="font-mono text-xs text-blanc-dim">
          Pas encore disponible : la migration 0031 (table campagnes_auto) n&apos;est pas appliquée dans Supabase.
        </p>
      </div>
    );
  }

  const jours = etat.restants > 0 ? Math.ceil(etat.restants / Math.max(parJour, 1)) : 0;

  return (
    <div className="card mb-8">
      <div className="flex flex-wrap items-end gap-5">
        <div className="flex-1 min-w-[240px]">
          <p className="label">Envoi automatique, du lundi au vendredi</p>
          <p className="text-sm text-blanc-dim">
            {actif
              ? `Activé. Chaque matin vers 9 h, ${parJour} e-mails partent aux prochains prospects « à contacter ».`
              : "Coupé. Aucun e-mail ne part tout seul."}
          </p>
        </div>
        <div>
          <label className="label">E-mails par jour</label>
          <input type="number" min={1} max={200} step={1} className="input w-28"
            value={parJour}
            onChange={(e) => setParJour(Math.min(Math.max(Number(e.target.value) || 1, 1), 200))} />
        </div>
        {actif ? (
          <>
            <button className="btn-ghost disabled:opacity-50" disabled={occupe} onClick={() => enregistrer(true)}>
              Enregistrer
            </button>
            <button className="btn-ghost disabled:opacity-50" disabled={occupe} onClick={() => enregistrer(false)}>
              Couper
            </button>
          </>
        ) : (
          <button className="btn-primary disabled:opacity-50" disabled={occupe} onClick={() => enregistrer(true)}>
            Activer
          </button>
        )}
      </div>
      <p className="font-mono text-[10.5px] text-blanc-faint border-t border-ligne mt-5 pt-3">
        {etat.restants.toLocaleString("fr-FR")} prospects à contacter
        {jours > 0 ? `, soit environ ${jours.toLocaleString("fr-FR")} jours ouvrés à ce rythme.` : "."}
        {etat.dernier_envoi
          ? ` Dernier envoi automatique : ${new Date(etat.dernier_envoi).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} (${etat.dernier_resultat ?? "sans détail"}).`
          : " Aucun envoi automatique pour l'instant."}
        {" "}Les relances restent manuelles.
      </p>
      {message && <p className="font-mono text-xs text-blanc-dim border-t border-ligne mt-4 pt-3">{message}</p>}
    </div>
  );
}
