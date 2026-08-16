"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AddressInput } from "@/components/AddressInput";

/* ---------- Déclarer une mission terminée ---------- */
export function DeclarerTerminee({ missionId }: { missionId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!window.confirm("Déclarer cette mission comme effectuée ? Le client pourra alors laisser un avis, et la commission sera facturée.")) return;
    setBusy(true);
    await supabase.from("missions").update({
      statut: "terminee_declaree",
      terminee_declaree_at: new Date().toISOString(),
    }).eq("id", missionId);
    router.refresh();
  }

  return (
    <button className="btn-primary text-xs px-4 py-2 disabled:opacity-50" disabled={busy} onClick={run}>
      Déclarer terminée ✓
    </button>
  );
}

/* ---------- Valider / refuser une réservation de retour à vide ---------- */
export function ReservationActions({
  reservationId,
  retourId,
}: {
  reservationId: string;
  retourId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function run(action: "validee" | "refusee") {
    setBusy(true);
    await supabase.from("reservations_retour").update({ statut: action }).eq("id", reservationId);
    if (action === "validee") {
      // Le trajet est attribué : les autres demandes en attente sont refusées
      await supabase.from("reservations_retour")
        .update({ statut: "refusee" })
        .eq("retour_id", retourId)
        .neq("id", reservationId)
        .eq("statut", "en_attente");
    }
    await supabase.from("retours_vide")
      .update({ statut: action === "validee" ? "confirme" : "publie" })
      .eq("id", retourId);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button className="btn-primary text-xs px-4 py-2 disabled:opacity-50" disabled={busy}
        onClick={() => run("validee")}>Valider ✓</button>
      <button className="btn-ghost text-xs px-4 py-2 disabled:opacity-50" disabled={busy}
        onClick={() => run("refusee")}>Refuser</button>
    </div>
  );
}

/* ---------- Publier un retour à vide ---------- */
export function PublierRetour({ transporteurId }: { transporteurId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    depart: "", depart_dept: "", arrivee: "", arrivee_dept: "",
    date: "", heure: "", places: "", prix: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function publier() {
    setError(null);
    if (!form.depart || !form.arrivee || !form.date || !form.places || !form.prix) {
      setError("Trajet, date, places et prix sont requis.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.from("retours_vide").insert({
      transporteur_id: transporteurId,
      depart_adresse: form.depart,
      depart_departement: form.depart_dept || "00",
      arrivee_adresse: form.arrivee,
      arrivee_departement: form.arrivee_dept || "00",
      date_dispo: form.date,
      heure_apres: form.heure || null,
      places: Number(form.places),
      prix_fixe: Number(form.prix),
    });
    if (err) { setError(err.message); setBusy(false); return; }
    setOpen(false);
    setForm({ depart: "", depart_dept: "", arrivee: "", arrivee_dept: "", date: "", heure: "", places: "", prix: "" });
    setBusy(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn-primary mb-6" onClick={() => setOpen(true)}>
        + Publier un trajet retour à vide
      </button>
    );
  }

  return (
    <div className="card mb-6 space-y-4">
      <p className="font-semibold text-sm">Nouveau trajet retour à vide</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Départ</label>
          <AddressInput value={form.depart} onChange={(v) => set("depart", v)} mode="international"
            onSelect={(s) => { set("depart", s.label); set("depart_dept", s.dept); }} />
        </div>
        <div>
          <label className="label">Arrivée</label>
          <AddressInput value={form.arrivee} onChange={(v) => set("arrivee", v)} mode="international"
            onSelect={(s) => { set("arrivee", s.label); set("arrivee_dept", s.dept); }} />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div>
          <label className="label">Départ après</label>
          <input className="input" type="time" value={form.heure} onChange={(e) => set("heure", e.target.value)} />
        </div>
        <div>
          <label className="label">Capacité (passagers)</label>
          <input className="input font-mono" type="number" min={1} placeholder="55"
            value={form.places} onChange={(e) => set("places", e.target.value)} />
        </div>
        <div>
          <label className="label">Prix fixe (€)</label>
          <input className="input font-mono" type="number" min={1} placeholder="890"
            value={form.prix} onChange={(e) => set("prix", e.target.value)} />
        </div>
      </div>
      <p className="text-[12px] text-blanc-faint">
        Commission réduite sur ce type de trajet. Le car est réservé en entier par un seul groupe — chaque demande devra être validée par vous avant confirmation.
      </p>
      {error && <p className="font-mono text-sm text-[#E8735D]">{error}</p>}
      <div className="flex gap-3">
        <button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
        <button className="btn-primary flex-1 disabled:opacity-50" disabled={busy} onClick={publier}>
          {busy ? "Publication…" : "Publier →"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Annuler une mission (motif obligatoire, tracé) ---------- */
export function AnnulerMission({ missionId }: { missionId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function run() {
    const motif = window.prompt(
      "Motif de l'annulation (obligatoire) :\n\nRappel : les annulations sont tracées. Un trajet déclaré annulé mais réalisé en direct constitue un contournement — commission due rétroactivement et exclusion de la plateforme."
    );
    if (motif === null) return;              // clic Annuler
    if (!motif.trim()) { window.alert("Le motif est obligatoire."); return; }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("missions").update({
      statut: "annulee",
      annulee_par: user!.id,
      annulation_motif: motif.trim(),
      annulee_at: new Date().toISOString(),
    }).eq("id", missionId);
    router.refresh();
  }

  return (
    <button className="btn-ghost text-xs px-4 py-2 disabled:opacity-50" disabled={busy} onClick={run}>
      Annuler la mission
    </button>
  );
}
