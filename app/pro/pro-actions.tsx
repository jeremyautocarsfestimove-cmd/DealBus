"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AddressInput } from "@/components/AddressInput";
import { ConfirmModal } from "@/components/ConfirmModal";

/* ---------- Déclarer une mission terminée ---------- */
export function DeclarerTerminee({ missionId }: { missionId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function run() {
    setBusy(true);
    await supabase.from("missions").update({
      statut: "terminee_declaree",
      terminee_declaree_at: new Date().toISOString(),
    }).eq("id", missionId);
    router.refresh();
  }

  return (
    <>
      <button className="btn-primary text-xs px-4 py-2 disabled:opacity-50" disabled={busy} onClick={() => setOpen(true)}>
        Déclarer terminée ✓
      </button>
      <ConfirmModal
        open={open}
        title="Mission effectuée ?"
        message="Le client pourra laisser un avis sur cette prestation, et la commission correspondante sera facturée."
        confirmLabel="Déclarer terminée ✓"
        busy={busy}
        onConfirm={() => { setOpen(false); run(); }}
        onCancel={() => setOpen(false)}
      />
    </>
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
    // La route serveur crée la mission (commission retour à vide) et notifie le client
    await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservation_id: reservationId,
        action: action === "validee" ? "valider" : "refuser",
      }),
    });
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
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [motif, setMotif] = useState("");
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/missions/${missionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motif: motif.trim() }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload.error || "Impossible d'annuler la mission");
      }

      setMotif("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div>
        <button className="btn-ghost text-xs px-4 py-2 disabled:opacity-50" disabled={busy} onClick={() => { setError(""); setOpen(true); }}>
          Annuler la mission
        </button>
        {error && <p className="mt-2 font-mono text-xs text-[#E8735D]">{error}</p>}
      </div>
      <ConfirmModal
        open={open}
        title="Annuler cette mission ?"
        danger
        confirmLabel="Confirmer l'annulation"
        confirmDisabled={!motif.trim()}
        busy={busy}
        onConfirm={() => { setOpen(false); run(); }}
        onCancel={() => { setOpen(false); setMotif(""); }}
      >
        <div>
          <label className="label">Motif de l&apos;annulation (obligatoire)</label>
          <textarea
            className="input min-h-[90px] resize-none"
            placeholder="Ex. le client a annulé son événement…"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
          <p className="mt-3 text-[12px] text-blanc-dim bg-ambre-dim border border-ambre/40 rounded-sm px-3.5 py-2.5">
            Les annulations sont tracées et vérifiées auprès du client. Un trajet déclaré
            annulé mais réalisé en direct constitue un contournement : commission due
            rétroactivement et exclusion de la plateforme.
          </p>
        </div>
      </ConfirmModal>
    </>
  );
}

/* ---------- Types de véhicules (partagé) ---------- */
export const TYPES_VEHICULES: Record<string, string> = {
  autocar_grand_tourisme: "Autocar grand tourisme",
  autocar_standard: "Autocar standard",
  minibus: "Minibus (10-30 places)",
  van: "Van / minivan (≤ 9 places)",
  berline: "Berline",
};

/* ---------- Gestion de la flotte ---------- */
export function GererVehicules({
  transporteurId,
  vehicules,
}: {
  transporteurId: string;
  vehicules: { id: string; type: string; marque_modele: string | null; places: number; annee: number | null }[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "", marque_modele: "", places: "", annee: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function ajouter() {
    setError(null);
    if (!form.type || !form.places) { setError("Type et nombre de places requis."); return; }
    setBusy(true);
    const { error: err } = await supabase.from("vehicules").insert({
      transporteur_id: transporteurId,
      type: form.type,
      marque_modele: form.marque_modele.trim() || null,
      places: Number(form.places),
      annee: form.annee ? Number(form.annee) : null,
    });
    if (err) { setError(err.message); setBusy(false); return; }
    setForm({ type: "", marque_modele: "", places: "", annee: "" });
    setBusy(false);
    router.refresh();
  }

  async function supprimer(id: string) {
    await supabase.from("vehicules").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="card">
      <p className="font-semibold text-sm mb-1.5">Ma flotte</p>
      <p className="text-[12.5px] text-blanc-dim mb-5">
        Renseignez vos véhicules une fois : vous les sélectionnerez en un clic
        dans vos devis, et ils crédibilisent vos offres auprès des clients.
      </p>

      <div className="space-y-2.5 mb-6">
        {vehicules.map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-3 border border-ligne rounded-sm px-4 py-3">
            <p className="text-sm">
              <span className="font-semibold">{TYPES_VEHICULES[v.type] ?? v.type}</span>
              <span className="font-mono text-xs text-blanc-faint ml-2.5">
                {v.marque_modele ? `${v.marque_modele} · ` : ""}{v.places} places{v.annee ? ` · ${v.annee}` : ""}
              </span>
            </p>
            <button className="font-mono text-[11px] text-blanc-faint hover:text-[#E8735D] uppercase tracking-wider"
              onClick={() => supprimer(v.id)}>
              Retirer
            </button>
          </div>
        ))}
        {vehicules.length === 0 && (
          <p className="text-sm text-blanc-faint">Aucun véhicule renseigné.</p>
        )}
      </div>

      <div className="border-t border-ligne pt-5 grid sm:grid-cols-[1fr_1fr_90px_90px] gap-3 items-end">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="">Sélectionner…</option>
            {Object.entries(TYPES_VEHICULES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Marque / modèle</label>
          <input className="input" placeholder="Ex. Setra S 516 HD"
            value={form.marque_modele} onChange={(e) => set("marque_modele", e.target.value)} />
        </div>
        <div>
          <label className="label">Places</label>
          <input className="input font-mono" type="number" min={1} placeholder="59"
            value={form.places} onChange={(e) => set("places", e.target.value)} />
        </div>
        <div>
          <label className="label">Année</label>
          <input className="input font-mono" type="number" placeholder="2022"
            value={form.annee} onChange={(e) => set("annee", e.target.value)} />
        </div>
      </div>
      {error && <p className="font-mono text-xs text-[#E8735D] mt-3">{error}</p>}
      <button className="btn-primary mt-4 disabled:opacity-50" disabled={busy} onClick={ajouter}>
        {busy ? "Ajout…" : "+ Ajouter ce véhicule"}
      </button>
    </div>
  );
}

/* ---------- CGV réduites ---------- */
export function CgvForm({
  transporteurId,
  initial,
}: {
  transporteurId: string;
  initial: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [cgv, setCgv] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    await supabase.from("transporteurs").update({ cgv: cgv.trim() || null }).eq("id", transporteurId);
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  return (
    <div className="card mt-5">
      <p className="font-semibold text-sm mb-1.5">Mes conditions (CGV réduites)</p>
      <p className="text-[12.5px] text-blanc-dim mb-4">
        Affichées aux clients sur chacune de vos offres : acompte, conditions
        d&apos;annulation, ce qui est inclus… L&apos;essentiel en quelques lignes.
      </p>
      <textarea
        className="input min-h-[140px] resize-none mb-3"
        placeholder={"Ex.\n— Acompte de 30 % à la réservation\n— Annulation gratuite jusqu'à 15 jours avant le départ\n— Péages et parking inclus, repas du conducteur non inclus"}
        value={cgv}
        onChange={(e) => setCgv(e.target.value)}
      />
      <p className="text-[12px] text-blanc-dim bg-ambre-dim border border-ambre/40 rounded-sm px-3.5 py-2.5 mb-4">
        N&apos;y mentionnez <strong>ni nom de société, ni coordonnées</strong> : ces conditions
        sont visibles pendant la phase anonyme, avant la sélection.
      </p>
      <button className="btn-primary disabled:opacity-50" disabled={busy} onClick={save}>
        {busy ? "Enregistrement…" : saved ? "Enregistré ✓" : "Enregistrer mes conditions"}
      </button>
    </div>
  );
}

/* ---------- Zones de chalandise ---------- */
export function GererZones({
  transporteurId,
  zones,
}: {
  transporteurId: string;
  zones: { departement: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saisie, setSaisie] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Départements français valides : 01-95 (hors 20), 2A/2B, 971-976
  function valide(d: string): boolean {
    if (/^2[AB]$/.test(d)) return true;
    if (/^97[1-6]$/.test(d)) return true;
    if (/^\d{2}$/.test(d)) { const n = Number(d); return n >= 1 && n <= 95 && d !== "20"; }
    return false;
  }

  async function ajouter() {
    setError(null);
    const deps = saisie.split(/[,\s;]+/).map((d) => d.trim().toUpperCase()).filter(Boolean);
    if (!deps.length) return;
    const invalides = deps.filter((d) => !valide(d));
    if (invalides.length) {
      setError(`Département(s) invalide(s) : ${invalides.join(", ")} — attendu : 01-95, 2A, 2B ou 971-976.`);
      return;
    }
    const existants = new Set(zones.map((z) => z.departement));
    const nouveaux = deps.filter((d) => !existants.has(d));
    if (!nouveaux.length) { setSaisie(""); return; }
    setBusy(true);
    const { error: err } = await supabase.from("transporteur_zones")
      .insert(nouveaux.map((departement) => ({ transporteur_id: transporteurId, departement })));
    if (err) { setError(err.message); setBusy(false); return; }
    setSaisie("");
    setBusy(false);
    router.refresh();
  }

  async function retirer(departement: string) {
    if (zones.length === 1) {
      setError("Gardez au moins une zone — sans zone, vous ne recevez plus aucun lead.");
      return;
    }
    await supabase.from("transporteur_zones").delete()
      .eq("transporteur_id", transporteurId)
      .eq("departement", departement);
    router.refresh();
  }

  return (
    <div className="card mb-5">
      <p className="font-semibold text-sm mb-1.5">Mes zones de chalandise</p>
      <p className="text-[12.5px] text-blanc-dim mb-4">
        Les départements où vous prenez en charge des groupes : vous ne recevez
        que les demandes qui en partent. Modifiable à tout moment, effet immédiat.
      </p>

      <div className="flex gap-2 flex-wrap mb-5">
        {zones.map((z) => (
          <span key={z.departement} className="inline-flex items-center gap-2 border border-ligne-strong rounded-sm px-3 py-1.5 font-mono text-sm">
            {z.departement}
            <button className="text-blanc-faint hover:text-[#E8735D] leading-none" title="Retirer"
              onClick={() => retirer(z.departement)}>×</button>
          </span>
        ))}
        {zones.length === 0 && <span className="text-sm text-blanc-faint">Aucune zone.</span>}
      </div>

      <div className="flex gap-3">
        <input
          className="input flex-1 font-mono"
          placeholder="Ajouter : 78, 95, 2A…"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ajouter()}
        />
        <button className="btn-primary disabled:opacity-50" disabled={busy} onClick={ajouter}>
          Ajouter
        </button>
      </div>
      {error && <p className="font-mono text-xs text-[#E8735D] mt-3">{error}</p>}
    </div>
  );
}