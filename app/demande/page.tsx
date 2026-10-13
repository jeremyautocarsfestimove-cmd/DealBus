"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { AddressInput } from "@/components/AddressInput";
import { createClient } from "@/lib/supabase/client";
import type { DemandeMode } from "@/lib/types";
import { FEATURES } from "@/lib/features";
import {
  ORGANISMES, MOTIFS, EQUIPEMENTS, BUDGETS,
  analyser, completude, fmtDuree, fmtHeure, eur,
} from "@/lib/assistant-demande";

const STEPS = ["Le trajet", "Votre groupe", "Vérification", "Envoi"];

// ---------- Petits composants de saisie ----------
function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] transition
        ${on ? "bg-blanc text-asphalte border-blanc" : "border-ligne-strong text-blanc-dim hover:border-blanc-dim"}`}>
      {children}
    </button>
  );
}

function Check({ on, label, aide, onClick }: { on: boolean; label: string; aide: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex gap-3 items-start text-left border rounded-sm px-3 py-2.5 transition
        ${on ? "border-ambre bg-ambre-dim" : "border-ligne hover:border-ligne-strong"}`}>
      <span className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center text-[11px] flex-none
        ${on ? "bg-ambre border-ambre text-encre" : "border-ligne-strong"}`}>{on ? "✓" : ""}</span>
      <span><span className="block text-sm">{label}</span><span className="block text-xs text-blanc-faint">{aide}</span></span>
    </button>
  );
}

function DemandeWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const modifierId = params.get("modifier");
  const [chargement, setChargement] = useState(!!modifierId);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentification en fin de parcours (email + mot de passe, inline)
  const [needAuth, setNeedAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomClient, setNomClient] = useState("");

  // Enchère (module en suspens, conservé derrière FEATURES.enchere)
  const [enchereFin, setEnchereFin] = useState("");
  const enchereFinManuelle = useRef(false);
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    type_trajet: params.get("type") ?? "aller_retour",
    depart_adresse: params.get("de") ?? "",
    depart_departement: params.get("dept") ?? "",
    arrivee_adresse: params.get("vers") ?? "",
    date_aller: params.get("date_aller") ?? "",
    heure_aller: params.get("heure_aller") ?? "",
    heure_arrivee: "",
    date_retour: params.get("date_retour") ?? "",
    heure_retour: params.get("heure_retour") ?? "",
    passagers: params.get("passagers") ?? "",
    vehicule_utilise_sur_place: false,
    sur_place_repondu: false,
    organisme: "",
    motif: "",
    equipements: [] as string[],
    budget: "",
    precisions: params.get("message") ?? "",
    mode: "devis" as DemandeMode,
  });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // Mode modification : pré-remplir depuis la demande existante (RLS : seul son client y accède)
  useEffect(() => {
    if (!modifierId) return;
    let actif = true;
    (async () => {
      const { data: d } = await supabase.from("demandes").select("*").eq("id", modifierId).maybeSingle();
      if (!actif) return;
      if (!d) { setError("Demande introuvable ou non modifiable."); setChargement(false); return; }
      if (d.statut !== "ouverte") { setError("Cette demande n'est plus ouverte."); setChargement(false); return; }
      setForm((f) => ({
        ...f,
        type_trajet: d.type_trajet,
        depart_adresse: d.depart_adresse,
        depart_departement: d.depart_departement ?? "",
        arrivee_adresse: d.arrivee_adresse,
        date_aller: String(d.date_aller),
        heure_aller: d.heure_aller ? String(d.heure_aller).slice(0, 5) : "",
        heure_arrivee: d.heure_arrivee ? String(d.heure_arrivee).slice(0, 5) : "",
        date_retour: d.date_retour ? String(d.date_retour) : "",
        heure_retour: d.heure_retour ? String(d.heure_retour).slice(0, 5) : "",
        passagers: String(d.passagers),
        vehicule_utilise_sur_place: !!d.vehicule_utilise_sur_place,
        sur_place_repondu: !!d.sur_place_repondu,
        organisme: d.organisme ?? "",
        motif: d.motif ?? "",
        equipements: d.equipements ?? [],
        budget: d.budget ?? "",
        precisions: d.precisions ?? "",
        mode: d.mode,
      }));
      setChargement(false);
    })();
    return () => { actif = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modifierId]);

  const toggleEquipement = (id: string) =>
    set("equipements", form.equipements.includes(id) ? form.equipements.filter((e) => e !== id) : [...form.equipements, id]);

  // ---------- Kilométrage : calculé dès que les deux adresses sont posées ----------
  const [km, setKm] = useState<number | null>(null);
  const [routeMin, setRouteMin] = useState<number | null>(null);
  const [kmEtat, setKmEtat] = useState<"idle" | "calcul" | "ok" | "ko">("idle");
  useEffect(() => {
    const de = form.depart_adresse.trim(), vers = form.arrivee_adresse.trim();
    if (de.length < 4 || vers.length < 4) { setKm(null); setKmEtat("idle"); return; }
    let actif = true;
    setKmEtat("calcul");
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/itineraire?depart=${encodeURIComponent(de)}&arrivee=${encodeURIComponent(vers)}`);
        const j = await r.json();
        if (!actif) return;
        if (r.ok && j.km) { setKm(Number(j.km)); setRouteMin(j.minutes ? Number(j.minutes) : null); setKmEtat("ok"); }
        else { setKm(null); setRouteMin(null); setKmEtat("ko"); }
      } catch { if (actif) { setKm(null); setRouteMin(null); setKmEtat("ko"); } }
    }, 700);
    return () => { actif = false; clearTimeout(t); };
  }, [form.depart_adresse, form.arrivee_adresse]);

  const analyse = analyser({
    type_trajet: form.type_trajet, km, routeMin,
    date_aller: form.date_aller, heure_aller: form.heure_aller,
    date_retour: form.date_retour, heure_retour: form.heure_retour,
    passagers: Number(form.passagers) || 0,
    vehicule_utilise_sur_place: form.vehicule_utilise_sur_place,
  });
  const { score, criteres } = completude(form);

  // ---------- Validation par étape ----------
  function erreurEtape(n: number): string | null {
    if (n === 1) {
      if (!form.depart_adresse || !form.arrivee_adresse) return "Indiquez le départ et la destination.";
      if (!form.date_aller) return "Indiquez la date de départ.";
      if (form.type_trajet !== "aller_simple" && !form.date_retour) return "Indiquez la date de retour (ou de fin du circuit).";
      if (form.date_retour && form.date_retour < form.date_aller) return "La date de retour est avant la date d'aller.";
      if (form.type_trajet !== "aller_simple" && form.date_retour === form.date_aller && form.heure_aller && form.heure_retour && form.heure_retour <= form.heure_aller) {
        return "Le retour part avant l'aller : vérifiez l'heure du retour, ou la date s'il y a une nuit sur place.";
      }
      if (analyse.horairesIncoherents) return "Le retour part avant l'arrivée estimée à destination : vérifiez l'heure du retour, ou la date s'il y a une nuit sur place.";
      if (!(Number(form.passagers) > 0)) return "Indiquez le nombre de passagers.";
    }
    if (n === 2) {
      if (!form.organisme) return "Dites-nous pour qui vous organisez ce déplacement.";
    }
    return null;
  }
  function suivant() {
    const e = erreurEtape(step);
    if (e) { setError(e); return; }
    setError(null);
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Enchère : clôture ----------
  const clotureMax = (): Date | null => {
    if (!form.date_aller) return null;
    if (form.heure_aller) return new Date(new Date(`${form.date_aller}T${form.heure_aller}`).getTime() - 3 * 3600 * 1000);
    return new Date(`${form.date_aller}T23:59:59`);
  };
  function validerEnchereFin(): string | null {
    if (form.mode !== "enchere") return null;
    if (!enchereFin) return "Choisissez la date et l'heure de clôture de votre enchère.";
    const fin = new Date(enchereFin);
    if (fin.getTime() < Date.now() + 30 * 60 * 1000) return "La clôture doit être au moins 30 minutes dans le futur.";
    const max = clotureMax();
    if (max && fin > max) return "La clôture doit avoir lieu au plus tard 3 h avant le départ.";
    return null;
  }

  // ---------- Enregistrement ----------
  async function insertDemande(userId: string) {
    const { data: { user: u } } = await supabase.auth.getUser();
    await supabase.from("profiles").upsert({
      id: userId,
      role: "client",
      ...(u?.email && { email: u.email }),
      ...(nomClient.trim() && { nom: nomClient.trim() }),
    }, { onConflict: "id", ignoreDuplicates: true });

    const { data: nouvelle, error: err } = await supabase.from("demandes").insert({
      client_id: userId,
      mode: form.mode,
      type_trajet: form.type_trajet,
      depart_adresse: form.depart_adresse,
      depart_departement: form.depart_departement,
      arrivee_adresse: form.arrivee_adresse,
      date_aller: form.date_aller,
      heure_aller: form.heure_aller || null,
      heure_arrivee: form.heure_arrivee || null,
      date_retour: form.date_retour || null,
      heure_retour: form.heure_retour || null,
      passagers: Number(form.passagers),
      vehicule_utilise_sur_place: form.vehicule_utilise_sur_place,
      sur_place_repondu: form.sur_place_repondu,
      organisme: form.organisme || null,
      motif: form.motif || null,
      equipements: form.equipements,
      budget: form.budget || null,
      precisions: form.precisions || null,
      completude: score,
      ...(km && { distance_km: km }),
      ...(form.mode === "enchere" && { enchere_fin: new Date(enchereFin).toISOString() }),
    }).select("id").single();

    if (err) { setError(err.message); setSaving(false); return; }

    if (nouvelle?.id) {
      if (!km) {
        fetch("/api/itineraire", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ demande_id: nouvelle.id }) }).catch(() => {});
      }
      fetch("/api/notify-demande", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ demande_id: nouvelle.id }) }).catch(() => {});
    }
    router.push("/mes-demandes");
  }

  async function submit() {
    setSaving(true);
    setError(null);
    const e1 = erreurEtape(1) ?? erreurEtape(2) ?? validerEnchereFin();
    if (e1) { setError(e1); setSaving(false); return; }
    if (modifierId) {
      const res = await fetch("/api/demandes/modifier", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "modifier", demande_id: modifierId, champs: {
          type_trajet: form.type_trajet, depart_adresse: form.depart_adresse, depart_departement: form.depart_departement,
          arrivee_adresse: form.arrivee_adresse, date_aller: form.date_aller, heure_aller: form.heure_aller || null,
          heure_arrivee: form.heure_arrivee || null, date_retour: form.date_retour || null, heure_retour: form.heure_retour || null,
          passagers: Number(form.passagers), vehicule_utilise_sur_place: form.vehicule_utilise_sur_place, sur_place_repondu: form.sur_place_repondu,
          organisme: form.organisme || null, motif: form.motif || null, equipements: form.equipements, budget: form.budget || null,
          precisions: form.precisions || null, completude: score,
        } }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error ?? "Erreur"); setSaving(false); return; }
      router.push(`/mes-demandes/${modifierId}`);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { await insertDemande(user.id); return; }
    setNeedAuth(true);
    setSaving(false);
  }

  async function authAndSubmit() {
    setSaving(true);
    setError(null);
    if (!email || password.length < 6) { setError("Email requis et mot de passe d'au moins 6 caractères."); setSaving(false); return; }
    if (authMode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        if (err.message.toLowerCase().includes("already registered")) { setAuthMode("login"); setError("Un compte existe déjà avec cet email — connectez-vous."); }
        else setError(err.message);
        setSaving(false);
        return;
      }
      if (!data.session) { setError("Confirmez votre email (lien envoyé), puis revenez envoyer votre demande."); setSaving(false); return; }
      await insertDemande(data.session.user.id);
      return;
    }
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError("Identifiants incorrects."); setSaving(false); return; }
    await insertDemande(data.user.id);
  }

  const dateFr = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—");
  const hFr = (h: string) => (h ? h.slice(0, 5).replace(":", "h") : "");

  // ---------- Panneau assistant ----------
  const Assistant = (
    <aside className="sombre rounded p-5 lg:sticky lg:top-24">
      <p className="font-mono text-[10.5px] uppercase tracking-[.14em] text-ambre mb-3">L&apos;assistant DealBus</p>
      {step === 1 ? (
        <>
          <dl className="text-[13px]">
            {analyse.km && (
              <div className="py-2 border-b border-ligne text-[12px] text-blanc-faint leading-snug">
                Itinéraire calculé : <span className="text-blanc">{form.depart_adresse}</span> → <span className="text-blanc">{form.arrivee_adresse}</span>. Si ce n&apos;est pas le bon lieu, choisissez-le dans la liste de suggestions.
              </div>
            )}
            <div className="flex justify-between gap-3 py-2 border-b border-ligne"><dt className="text-blanc-faint">Distance aller</dt>
              <dd className="font-mono font-semibold">{kmEtat === "calcul" ? "calcul…" : analyse.km ? `${analyse.km} km` : kmEtat === "ko" ? "introuvable" : "—"}</dd></div>
            <div className="flex justify-between gap-3 py-2 border-b border-ligne"><dt className="text-blanc-faint">Temps de route estimé</dt>
              <dd className="font-mono font-semibold">{analyse.routeMin ? `${fmtDuree(analyse.routeMin)}${analyse.pauseMin ? ` + ${fmtDuree(analyse.pauseMin)} de pauses` : ""}` : "—"}</dd></div>
            <div className="flex justify-between gap-3 py-2 border-b border-ligne"><dt className="text-blanc-faint">Gabarit conseillé</dt>
              <dd className="font-mono font-semibold text-right">{analyse.gabarit?.label ?? "—"}</dd></div>
            <div className="flex justify-between gap-3 py-2 border-b border-ligne"><dt className="text-blanc-faint">Arrivée estimée</dt>
              <dd className="font-mono font-semibold">{analyse.arriveeMin !== null ? fmtHeure(analyse.arriveeMin) : "—"}</dd></div>
          </dl>
          {analyse.alertes.map((a) => (
            <div key={a.titre} className={`mt-3 border-l-[3px] px-3 py-2.5 rounded-r-sm text-[12.5px]
              ${a.niveau === "attention" ? "border-ambre bg-ambre-dim" : a.niveau === "ok" ? "border-vert bg-vert-dim" : "border-blanc-faint bg-asphalte-2"}`}>
              <p className={`font-semibold text-xs mb-0.5 ${a.niveau === "attention" ? "text-ambre" : a.niveau === "ok" ? "text-vert" : "text-blanc"}`}>{a.titre}</p>
              <p className="text-blanc-dim leading-snug">{a.texte}</p>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-ligne">
            <p className="h-display text-3xl text-ambre">{analyse.fourchette ? `${eur(analyse.fourchette.min)} à ${eur(analyse.fourchette.max)}` : "—"}</p>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint mt-1">
              {analyse.fourchette ? "Fourchette indicative TTC, hors offres réelles" : "Fourchette indicative dès que trajet, horaires et passagers sont renseignés"}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between text-[13px]"><span>Demande complète</span><b className="font-mono">{score} %</b></div>
          <div className="h-1.5 bg-asphalte-3 rounded-full overflow-hidden my-2"><div className="h-full bg-vert transition-all" style={{ width: `${score}%` }} /></div>
          <ul className="text-[12.5px] space-y-1 mt-3">
            {criteres.map((c) => (
              <li key={c.label} className={`flex gap-2 ${c.ok ? "text-blanc" : "text-blanc-faint"}`}>
                <span className={c.ok ? "text-vert" : "text-ambre"}>{c.ok ? "✓" : "○"}</span>{c.label}
              </li>
            ))}
          </ul>
          <div className="mt-4 border-l-[3px] border-vert bg-vert-dim px-3 py-2.5 rounded-r-sm text-[12.5px]">
            <p className="font-semibold text-xs text-vert mb-0.5">Pourquoi ça compte</p>
            <p className="text-blanc-dim leading-snug">Une demande complète reçoit plus d&apos;offres, et des prix plus serrés : le transporteur n&apos;a pas à prévoir de marge d&apos;incertitude.</p>
          </div>
          {form.equipements.includes("ceintures") && (
            <div className="mt-3 border-l-[3px] border-ambre bg-ambre-dim px-3 py-2.5 rounded-r-sm text-[12.5px]">
              <p className="font-semibold text-xs text-ambre mb-0.5">Transport d&apos;enfants</p>
              <p className="text-blanc-dim leading-snug">Votre demande n&apos;est diffusée qu&apos;à des transporteurs dont la licence et l&apos;assurance ont été contrôlées.</p>
            </div>
          )}
        </>
      )}
    </aside>
  );

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-7 py-12">
        <p className="eyebrow mb-3">{modifierId ? "Modification" : "Demande de devis"}</p>
        <h1 className="h-display text-4xl mb-8">{modifierId ? "Modifiez votre demande." : "Décrivez votre déplacement."}</h1>
        {modifierId && (
          <p className="text-[13px] text-blanc-dim bg-ambre-dim border border-ambre/40 rounded-sm px-4 py-3 mb-6 max-w-2xl">
            Possible tant qu&apos;aucune offre n&apos;a été reçue. Les transporteurs de votre zone verront la version mise à jour.
          </p>
        )}
        {chargement && <p className="text-sm text-blanc-faint mb-6">Chargement de votre demande…</p>}

        {/* Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-ligne rounded-sm overflow-hidden mb-7 bg-asphalte-2">
          {STEPS.map((label, i) => (
            <div key={label} className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] border-r border-ligne last:border-r-0
              ${step === i + 1 ? "bg-ambre-dim text-blanc font-semibold" : step > i + 1 ? "text-vert" : "text-blanc-faint"}`}>
              <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-mono text-[11px] font-semibold border
                ${step === i + 1 ? "bg-ambre border-ambre text-encre" : step > i + 1 ? "bg-vert border-vert text-white" : "border-ligne-strong"}`}>
                {step > i + 1 ? "✓" : i + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)] gap-6 items-start">
          <div className="card">
            {/* ================= 1. TRAJET ================= */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex gap-6 border-b border-ligne-strong">
                  {(["aller_retour", "aller_simple", "circuit"] as const).map((t) => (
                    <button key={t} type="button"
                      onClick={() => { set("type_trajet", t); if (t === "aller_simple") { set("date_retour", ""); set("heure_retour", ""); } }}
                      className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition
                        ${form.type_trajet === t ? "text-ambre border-ambre" : "text-blanc-faint border-transparent"}`}>
                      {t === "aller_retour" ? "Aller-retour" : t === "aller_simple" ? "Aller simple" : "Circuit"}
                    </button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Départ</label>
                    <AddressInput value={form.depart_adresse} onChange={(v) => set("depart_adresse", v)}
                      onSelect={(s) => { set("depart_adresse", s.label); set("depart_departement", s.dept); }} />
                  </div>
                  <div>
                    <label className="label">Destination</label>
                    <AddressInput value={form.arrivee_adresse} onChange={(v) => set("arrivee_adresse", v)}
                      placeholder="Destination (France ou étranger)" mode="international" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div><label className="label">Aller</label>
                    <input className="input" type="date" value={form.date_aller} onChange={(e) => set("date_aller", e.target.value)} /></div>
                  <div><label className="label">Départ à</label>
                    <input className="input" type="time" value={form.heure_aller} onChange={(e) => set("heure_aller", e.target.value)} /></div>
                  <div><label className="label">Arrivée souhaitée</label>
                    <input className="input" type="time" value={form.heure_arrivee} onChange={(e) => set("heure_arrivee", e.target.value)} /></div>
                </div>
                {form.type_trajet !== "aller_simple" && (
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div><label className="label">{form.type_trajet === "circuit" ? "Fin du circuit" : "Retour"}</label>
                      <input className="input" type="date" min={form.date_aller || undefined} value={form.date_retour} onChange={(e) => set("date_retour", e.target.value)} /></div>
                    <div><label className="label">{form.type_trajet === "circuit" ? "Retour vers" : "Départ du retour"}</label>
                      <input className="input" type="time" value={form.heure_retour} onChange={(e) => set("heure_retour", e.target.value)} /></div>
                    <div><label className="label">Passagers</label>
                      <input className="input" type="number" min={1} placeholder="Ex. 53" value={form.passagers} onChange={(e) => set("passagers", e.target.value)} /></div>
                  </div>
                )}
                {form.type_trajet === "aller_simple" && (
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div><label className="label">Passagers</label>
                      <input className="input" type="number" min={1} placeholder="Ex. 53" value={form.passagers} onChange={(e) => set("passagers", e.target.value)} /></div>
                  </div>
                )}
                {form.type_trajet !== "aller_simple" && (
                  <div>
                    <label className="label">Le car reste-t-il sur place entre l&apos;aller et le retour ?</label>
                    <div className="flex flex-wrap gap-2">
                      <Chip on={form.sur_place_repondu && form.vehicule_utilise_sur_place} onClick={() => { set("vehicule_utilise_sur_place", true); set("sur_place_repondu", true); }}>Oui, le car et le chauffeur restent</Chip>
                      <Chip on={form.sur_place_repondu && !form.vehicule_utilise_sur_place} onClick={() => { set("vehicule_utilise_sur_place", false); set("sur_place_repondu", true); }}>Non, dépose puis reprise</Chip>
                      <Chip on={!form.sur_place_repondu} onClick={() => { set("sur_place_repondu", false); set("vehicule_utilise_sur_place", false); }}>Je ne sais pas</Chip>
                    </div>
                    <p className="text-xs text-blanc-faint mt-2">Sur un aller-retour dans la journée, « oui » est la réponse la plus courante : le car vous attend. Sur plusieurs jours, cela change nettement le prix.</p>
                  </div>
                )}
                <p className="text-xs text-blanc-faint">Sans coordonnées personnelles à cette étape.</p>
              </div>
            )}

            {/* ================= 2. GROUPE ================= */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="label">Vous organisez pour</label>
                  <div className="flex flex-wrap gap-2">
                    {ORGANISMES.map((o) => <Chip key={o.id} on={form.organisme === o.id} onClick={() => set("organisme", o.id)}>{o.label}</Chip>)}
                  </div>
                </div>
                <div>
                  <label className="label">Le motif</label>
                  <div className="flex flex-wrap gap-2">
                    {MOTIFS.map((m) => <Chip key={m} on={form.motif === m} onClick={() => set("motif", m)}>{m}</Chip>)}
                  </div>
                </div>
                <div>
                  <label className="label">Ce qu&apos;il faut prévoir</label>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {EQUIPEMENTS.map((e) => <Check key={e.id} on={form.equipements.includes(e.id)} label={e.label} aide={e.aide} onClick={() => toggleEquipement(e.id)} />)}
                  </div>
                </div>
                <div>
                  <label className="label">Précisions pour les transporteurs</label>
                  <textarea className="input min-h-[96px] resize-none"
                    placeholder="Arrêts, pauses, parking, hôtel du groupe, horaires souples, matériel…"
                    value={form.precisions} onChange={(e) => set("precisions", e.target.value)} />
                  <p className="text-xs text-blanc-faint mt-1.5">Sans nom, email ni téléphone : votre demande est diffusée anonymement.</p>
                </div>
                <div>
                  <label className="label">Votre budget, si vous en avez un (facultatif, jamais transmis tel quel)</label>
                  <div className="flex flex-wrap gap-2">
                    {BUDGETS.map((b) => <Chip key={b.id} on={form.budget === b.id} onClick={() => set("budget", form.budget === b.id ? "" : b.id)}>{b.label}</Chip>)}
                  </div>
                </div>
              </div>
            )}

            {/* ================= 3. VÉRIFICATION ================= */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mb-3">Votre trajet</p>
                  <p className="font-semibold text-lg">{form.depart_adresse} <span className="text-blanc-faint font-normal">→</span> {form.arrivee_adresse}</p>
                  <p className="font-mono text-sm text-blanc-dim mt-1">
                    {form.type_trajet === "aller_simple" ? "Aller simple" : form.type_trajet === "circuit" ? "Circuit" : "Aller-retour"} · {dateFr(form.date_aller)}{form.heure_aller ? ` à ${hFr(form.heure_aller)}` : ""}
                    {form.date_retour ? ` → ${dateFr(form.date_retour)}${form.heure_retour ? ` à ${hFr(form.heure_retour)}` : ""}` : ""}
                  </p>
                  <p className="font-mono text-sm text-blanc-dim">
                    {form.passagers} passagers{analyse.gabarit ? ` · ${analyse.gabarit.label}` : ""}{analyse.km ? ` · ${analyse.km} km` : ""}
                    {form.type_trajet !== "aller_simple" && form.sur_place_repondu ? (form.vehicule_utilise_sur_place ? " · car sur place" : " · dépose puis reprise") : ""}
                  </p>
                </div>
                <div className="border-t border-ligne pt-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-blanc-faint mb-3">Votre groupe</p>
                  <p className="text-sm">{ORGANISMES.find((o) => o.id === form.organisme)?.label ?? "—"}{form.motif ? ` · ${form.motif}` : ""}</p>
                  <p className="text-sm text-blanc-dim mt-1">
                    {form.equipements.length ? form.equipements.map((id) => EQUIPEMENTS.find((e) => e.id === id)?.label).join(" · ") : "Aucun équipement particulier"}
                  </p>
                  {form.precisions && <p className="text-sm text-blanc-dim mt-2 whitespace-pre-line">« {form.precisions} »</p>}
                </div>
                <div className="border-t border-ligne pt-4 text-[13.5px] text-blanc-dim bg-vert-dim border border-vert/30 rounded-sm px-5 py-4 leading-relaxed">
                  Vos prix seront de <strong className="text-blanc">vraies offres fermes</strong>, établies par des transporteurs vérifiés
                  qui connaissent leurs coûts. Vous comparez, vous choisissez, ou vous ne donnez pas suite.
                </div>
                {FEATURES.enchere && (
                  <div className="border-t border-ligne pt-4">
                    <label className="label">Comment recevoir vos offres ?</label>
                    <div className="flex gap-2.5">
                      <button type="button" onClick={() => set("mode", "devis")}
                        className={`flex-1 border rounded-sm py-4 text-sm font-semibold transition ${form.mode === "devis" ? "border-[#9DB3DE] bg-bleunuit text-[#9DB3DE]" : "border-ligne-strong text-blanc-dim"}`}>
                        Devis multiples</button>
                      <button type="button" onClick={() => {
                          set("mode", "enchere");
                          if (!enchereFinManuelle.current) {
                            const dansUnJour = new Date(Date.now() + 24 * 3600 * 1000);
                            const max = clotureMax();
                            setEnchereFin(toLocalInput(max && dansUnJour > max ? max : dansUnJour));
                          }
                        }}
                        className={`flex-1 border rounded-sm py-4 text-sm font-semibold transition ${form.mode === "enchere" ? "border-vert bg-vert-dim text-vert" : "border-ligne-strong text-blanc-dim"}`}>
                        Enchère en direct</button>
                    </div>
                    {form.mode === "enchere" && (
                      <div className="mt-4">
                        <label className="label">Clôture de l&apos;enchère</label>
                        <input className="input" type="datetime-local" value={enchereFin}
                          min={toLocalInput(new Date(Date.now() + 30 * 60 * 1000))}
                          max={clotureMax() ? toLocalInput(clotureMax()!) : undefined}
                          onChange={(e) => { enchereFinManuelle.current = true; setEnchereFin(e.target.value); }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================= 4. ENVOI ================= */}
            {step === 4 && (
              <div className="space-y-5">
                <p className="text-sm text-blanc-dim leading-relaxed">
                  {modifierId ? "Votre demande mise à jour remplace la précédente. Elle reste diffusée, anonymement, aux transporteurs vérifiés" : "Votre demande est prête. Elle sera diffusée, anonymement, aux transporteurs vérifiés"}
                  {form.depart_departement ? ` qui desservent le ${form.depart_departement}` : " de votre région"}.
                  Les premières offres arrivent généralement dans la journée.
                </p>
                <ul className="text-[13.5px] text-blanc-dim space-y-1.5">
                  <li>— Votre identité reste masquée jusqu&apos;à ce que vous retenez une offre</li>
                  <li>— Gratuit, sans engagement : vous pouvez clore la demande à tout moment</li>
                  <li>— Vous payez directement le transporteur retenu, selon ses conditions</li>
                </ul>
                {!needAuth && error && <p className="font-mono text-sm text-[#E8735D]">{error}</p>}
              </div>
            )}

            {step < 4 && error && <p className="font-mono text-sm text-[#E8735D] mt-5">{error}</p>}
          </div>

          {Assistant}
        </div>

        {needAuth && (
          <div className="card mt-5 max-w-2xl">
            <p className="font-semibold text-sm mb-1.5">
              {authMode === "signup" ? "Créez votre compte pour envoyer la demande" : "Connectez-vous pour envoyer la demande"}
            </p>
            <p className="text-[12.5px] text-blanc-dim mb-5">
              Il ne manque qu&apos;un accès pour suivre vos offres. Votre email n&apos;est jamais transmis aux transporteurs.
            </p>
            {authMode === "signup" && (
              <div className="mb-4">
                <label className="label">Prénom et nom</label>
                <input className="input" placeholder="Ex. Claire Martin" value={nomClient} onChange={(e) => setNomClient(e.target.value)} />
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div><label className="label">Email</label>
                <input className="input" type="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><label className="label">Mot de passe</label>
                <input className="input" type="password" placeholder="6 caractères minimum" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            </div>
            {error && <p className="font-mono text-sm text-[#E8735D] mb-4">{error}</p>}
            <button className="btn-primary w-full disabled:opacity-50" disabled={saving} onClick={authAndSubmit}>
              {saving ? "Envoi…" : authMode === "signup" ? "Créer mon compte et envoyer →" : "Me connecter et envoyer →"}
            </button>
            <button className="mt-3.5 font-mono text-xs text-blanc-faint hover:text-blanc-dim w-full text-center"
              onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setError(null); }}>
              {authMode === "signup" ? "J'ai déjà un compte → me connecter" : "Pas encore de compte → en créer un"}
            </button>
          </div>
        )}

        {!needAuth && (
          <div className="flex justify-between mt-5 lg:max-w-[61.5%]">
            <button className="btn-ghost disabled:opacity-35" disabled={step === 1} onClick={() => { setError(null); setStep((s) => s - 1); }}>← Précédent</button>
            {step < 4 ? (
              <button className="btn-primary" onClick={suivant}>
                {step === 1 ? "Continuer, votre groupe →" : step === 2 ? "Vérifier ma demande →" : "Dernière étape →"}
              </button>
            ) : (
              <button className="btn-primary disabled:opacity-50" disabled={saving} onClick={submit}>
                {saving ? "Envoi…" : modifierId ? "Enregistrer les modifications →" : "Envoyer ma demande →"}
              </button>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default function DemandePage() {
  return (
    <Suspense>
      <DemandeWizard />
    </Suspense>
  );
}
