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

/* ---------- Modification des informations légales et de contact ---------- */
export function ModifierProfilTransporteur({
  transporteurId,
  initial,
}: {
  transporteurId: string;
  initial: {
    raison_sociale: string;
    siren: string;
    licence_transport: string;
    departement_siege: string;
    secteur: string;
    nom: string | null;
    telephone: string | null;
    email: string | null;
  };
}) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    raison_sociale: initial.raison_sociale ?? "",
    siren: initial.siren ?? "",
    licence_transport: initial.licence_transport ?? "",
    departement_siege: initial.departement_siege ?? "",
    secteur: initial.secteur ?? "autocariste",
    nom: initial.nom ?? "",
    telephone: initial.telephone ?? "",
    email: initial.email ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function enregistrer() {
    setError(null);
    setOk(null);

    const siren = form.siren.replace(/\s/g, "").slice(0, 9);
    if (!/^\d{9}$/.test(siren)) { setError("SIREN invalide (9 chiffres). Un SIRET saisi est ramené à ses 9 premiers chiffres."); return; }
    const dept = form.departement_siege.trim().toUpperCase();
    if (!/^(\d{2,3}|2A|2B)$/.test(dept)) { setError("Département du siège invalide (ex. 76, 2A, 974)."); return; }
    if (!form.raison_sociale.trim()) { setError("La raison sociale est obligatoire."); return; }
    if (!form.licence_transport.trim()) { setError("Le titre d'exercice est obligatoire."); return; }
    if (!form.nom.trim()) { setError("Le nom du contact est obligatoire."); return; }
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError("Adresse email invalide."); return; }

    setBusy(true);
    const { error: e1 } = await supabase.from("transporteurs").update({
      raison_sociale: form.raison_sociale.trim(),
      siren,
      licence_transport: form.licence_transport.trim(),
      departement_siege: dept,
      secteur: form.secteur,
    }).eq("id", transporteurId);
    if (e1) { setError(e1.message); setBusy(false); return; }

    const { error: e2 } = await supabase.from("profiles").update({
      nom: form.nom.trim(),
      telephone: form.telephone.trim() || null,
      email,
    }).eq("id", transporteurId);
    if (e2) { setError(e2.message); setBusy(false); return; }

    let noteEmail = "";
    if (email !== (initial.email ?? "").toLowerCase()) {
      // L'email de connexion suit : Supabase envoie un lien de confirmation.
      const { error: e3 } = await supabase.auth.updateUser({ email });
      noteEmail = e3
        ? " Votre email de notifications est à jour, mais l'email de connexion n'a pas pu être modifié : " + e3.message
        : " Un lien de confirmation vient d'être envoyé à votre nouvelle adresse pour valider l'email de connexion.";
    }

    setBusy(false);
    setOk("Informations enregistrées." + noteEmail);
    router.refresh();
  }

  return (
    <div className="card mb-5">
      <p className="font-semibold text-sm mb-1.5">Mes informations</p>
      <p className="text-[12.5px] text-blanc-dim mb-5">
        Informations légales de votre société et coordonnées de contact.
        Elles sont utilisées pour la facturation, les notifications et la mise en relation.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Raison sociale</label>
          <input className="input w-full" value={form.raison_sociale} onChange={(e) => set("raison_sociale", e.target.value)} />
        </div>
        <div>
          <label className="label">SIREN</label>
          <input className="input w-full font-mono" placeholder="9 chiffres" value={form.siren} onChange={(e) => set("siren", e.target.value)} />
        </div>
        <div>
          <label className="label">Titre d&apos;exercice (licence)</label>
          <input className="input w-full font-mono" value={form.licence_transport} onChange={(e) => set("licence_transport", e.target.value)} />
        </div>
        <div>
          <label className="label">Département du siège</label>
          <input className="input w-full font-mono" placeholder="ex. 76, 2A, 974" value={form.departement_siege} onChange={(e) => set("departement_siege", e.target.value)} />
        </div>
        <div>
          <label className="label">Secteur</label>
          <select className="input w-full" value={form.secteur} onChange={(e) => set("secteur", e.target.value)}>
            <option value="autocariste">Autocariste</option>
            <option value="vtc">VTC</option>
            <option value="taxi">Taxi</option>
            <option value="loti">LOTI</option>
          </select>
        </div>
        <div>
          <label className="label">Nom du contact</label>
          <input className="input w-full" value={form.nom} onChange={(e) => set("nom", e.target.value)} />
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input className="input w-full font-mono" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Email</label>
          <input className="input w-full font-mono" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <p className="font-mono text-[10.5px] text-blanc-faint mt-1.5">
            En cas de changement, un lien de confirmation est envoyé à la nouvelle adresse pour l&apos;email de connexion.
          </p>
        </div>
      </div>
      {error && <p className="font-mono text-xs text-[#E8735D] mt-4">{error}</p>}
      {ok && <p className="font-mono text-xs text-vert mt-4">✓ {ok}</p>}
      <div className="flex justify-end mt-5">
        <button className="btn-primary disabled:opacity-50" disabled={busy} onClick={enregistrer}>
          {busy ? "Enregistrement…" : "Enregistrer mes informations"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Demande de suppression de compte ---------- */
export function DemanderSuppression({
  transporteurId,
  dejaDemandee,
}: {
  transporteurId: string;
  dejaDemandee: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function demander() {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase
      .from("transporteurs")
      .update({ suppression_demandee_at: new Date().toISOString() })
      .eq("id", transporteurId);
    setBusy(false);
    setConfirmOpen(false);
    if (err) { setError(err.message); return; }
    fetch("/api/notify-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "suppression_transporteur", id: transporteurId }),
    }).catch(() => {});
    router.refresh();
  }

  async function annuler() {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase
      .from("transporteurs")
      .update({ suppression_demandee_at: null })
      .eq("id", transporteurId);
    setBusy(false);
    if (err) { setError(err.message); return; }
    router.refresh();
  }

  return (
    <div className="card border-[#E8735D]/30">
      <p className="font-semibold text-sm mb-1.5">Supprimer mon compte</p>
      {dejaDemandee ? (
        <>
          <p className="text-[12.5px] text-blanc-dim mb-4">
            Votre demande de suppression du {new Date(dejaDemandee).toLocaleDateString("fr-FR")} est en cours
            de traitement par notre équipe.
          </p>
          <button className="btn-ghost text-xs px-4 py-2 disabled:opacity-50" disabled={busy} onClick={annuler}>
            Annuler ma demande
          </button>
        </>
      ) : (
        <>
          <p className="text-[12.5px] text-blanc-dim mb-4">
            Votre compte, vos coordonnées et vos justificatifs seront supprimés (l&apos;historique de vos
            missions facturées est conservé à des fins comptables). Cette action est traitée manuellement
            par notre équipe.
          </p>
          <button
            className="btn text-xs px-4 py-2 bg-[#AE2A22] text-blanc hover:-translate-y-px disabled:opacity-50"
            disabled={busy}
            onClick={() => setConfirmOpen(true)}
          >
            Demander la suppression de mon compte
          </button>
        </>
      )}
      {error && <p className="font-mono text-xs text-[#E8735D] mt-3">{error}</p>}
      <ConfirmModal
        open={confirmOpen}
        title="Supprimer mon compte"
        message="Confirmer la demande de suppression de votre compte transporteur ? Notre équipe traitera votre demande sous peu."
        confirmLabel="Confirmer la demande"
        danger
        busy={busy}
        onConfirm={demander}
        onCancel={() => setConfirmOpen(false)}
      />
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
    const deps = saisie.split(/[,\s;/|]+/).map((d) => d.trim().toUpperCase()).filter(Boolean);
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