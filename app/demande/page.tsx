"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { AddressInput } from "@/components/AddressInput";
import { createClient } from "@/lib/supabase/client";
import type { DemandeMode } from "@/lib/types";

const STEPS = ["Trajet", "Estimation", "Détails", "Réception"];

function DemandeWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  // Pré-rempli depuis le formulaire rapide de la page d'accueil → départ à l'étape 2
  const prefilled = params.has("de") || params.has("vers");
  const [step, setStep] = useState(prefilled ? 2 : 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Authentification en fin de parcours (email + mot de passe, inline)
  const [needAuth, setNeedAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomClient, setNomClient] = useState("");

  const [form, setForm] = useState({
    type_trajet: params.get("type") ?? "aller_retour",
    depart_adresse: params.get("de") ?? "",
    depart_departement: params.get("dept") ?? "",
    arrivee_adresse: params.get("vers") ?? "",
    date_aller: params.get("date_aller") ?? "",
    heure_aller: params.get("heure_aller") ?? "",
    date_retour: params.get("date_retour") ?? "",
    heure_retour: params.get("heure_retour") ?? "",
    passagers: params.get("passagers") ?? "",
    vehicule_utilise_sur_place: false,
    precisions: params.get("message") ?? "",
    motif: "",
    mode: "devis" as DemandeMode,
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // Estimation simple côté client — TODO: affiner (distance réelle via API)
  const estimation = form.passagers
    ? Math.round(900 + Number(form.passagers) * 28)
    : null;

  async function insertDemande(userId: string) {
    // Le profil doit exister (FK demandes.client_id → profiles.id)
    await supabase.from("profiles").upsert({
      id: userId,
      role: "client",
      ...(nomClient.trim() && { nom: nomClient.trim() }),
    });

    const { error: err } = await supabase.from("demandes").insert({
      client_id: userId,
      mode: form.mode,
      type_trajet: form.type_trajet,
      depart_adresse: form.depart_adresse,
      depart_departement: form.depart_departement,
      arrivee_adresse: form.arrivee_adresse,
      date_aller: form.date_aller,
      heure_aller: form.heure_aller || null,
      date_retour: form.date_retour || null,
      heure_retour: form.heure_retour || null,
      passagers: Number(form.passagers),
      vehicule_utilise_sur_place: form.vehicule_utilise_sur_place,
      precisions: form.precisions || null,
      motif: form.motif || null,
      prix_estime: estimation,
      // Enchère : fenêtre de 2h par défaut, prix de départ = estimation
      ...(form.mode === "enchere" && {
        enchere_fin: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        enchere_prix_depart: estimation,
      }),
    });

    if (err) { setError(err.message); setSaving(false); return; }
    router.push("/mes-demandes");
  }

  async function submit() {
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { await insertDemande(user.id); return; }
    // Pas connecté : on affiche le panneau email + mot de passe, la demande reste en mémoire
    setNeedAuth(true);
    setSaving(false);
  }

  async function authAndSubmit() {
    setSaving(true);
    setError(null);
    if (!email || password.length < 6) {
      setError("Email requis et mot de passe d'au moins 6 caractères.");
      setSaving(false);
      return;
    }

    if (authMode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        if (err.message.toLowerCase().includes("already registered")) {
          setAuthMode("login");
          setError("Un compte existe déjà avec cet email — connectez-vous.");
        } else {
          setError(err.message);
        }
        setSaving(false);
        return;
      }
      if (!data.session) {
        setError("Confirmez votre email (lien envoyé), puis revenez envoyer votre demande.");
        setSaving(false);
        return;
      }
      await insertDemande(data.session.user.id);
      return;
    }

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError("Identifiants incorrects."); setSaving(false); return; }
    await insertDemande(data.user.id);
  }

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">Nouvelle demande</p>
        <h1 className="h-display text-4xl mb-10">Une demande, quatre étapes.</h1>

        {/* Stepper */}
        <div className="flex items-center mb-9">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-semibold border transition
                  ${step === i + 1 ? "bg-ambre border-ambre text-asphalte"
                    : step > i + 1 ? "bg-vert-dim border-vert text-vert"
                    : "bg-asphalte-2 border-ligne-strong text-blanc-faint"}`}>
                  {i + 1}
                </span>
                <span className="hidden sm:block font-mono text-[11px] uppercase tracking-wider text-blanc-faint">{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-ligne-strong mx-2 mb-5" />}
            </div>
          ))}
        </div>

        <div className="card min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-6 border-b border-ligne-strong mb-6">
                {(["aller_retour", "aller_simple", "circuit"] as const).map((t) => (
                  <button key={t} onClick={() => set("type_trajet", t)}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition
                      ${form.type_trajet === t ? "text-ambre border-ambre" : "text-blanc-faint border-transparent"}`}>
                    {t === "aller_retour" ? "Aller-retour" : t === "aller_simple" ? "Aller simple" : "Circuit"}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-[1fr_120px] gap-4">
                <div>
                  <label className="label">De</label>
                  <AddressInput
                    value={form.depart_adresse}
                    onChange={(v) => set("depart_adresse", v)}
                    onSelect={(s) => { set("depart_adresse", s.label); set("depart_departement", s.dept); }}
                  />
                </div>
                <div>
                  <label className="label">Dépt. (auto)</label>
                  <input className="input font-mono" placeholder="—" maxLength={3}
                    value={form.depart_departement} onChange={(e) => set("depart_departement", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Vers</label>
                <AddressInput
                  value={form.arrivee_adresse}
                  onChange={(v) => set("arrivee_adresse", v)}
                  placeholder="Destination (France ou étranger)"
                  mode="international"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Aller — date</label>
                  <input className="input" type="date"
                    value={form.date_aller} onChange={(e) => set("date_aller", e.target.value)} />
                </div>
                <div>
                  <label className="label">Départ à</label>
                  <input className="input" type="time"
                    value={form.heure_aller} onChange={(e) => set("heure_aller", e.target.value)} />
                </div>
              </div>
              {form.type_trajet === "aller_retour" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Retour — date</label>
                    <input className="input" type="date"
                      value={form.date_retour} onChange={(e) => set("date_retour", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Départ à</label>
                    <input className="input" type="time"
                      value={form.heure_retour} onChange={(e) => set("heure_retour", e.target.value)} />
                  </div>
                </div>
              )}
              <div>
                <label className="label">Passagers</label>
                <input className="input" type="number" min={1} placeholder="57"
                  value={form.passagers} onChange={(e) => set("passagers", e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-blanc-dim mb-1.5">Prix estimé à partir de</p>
              <p className="font-mono text-4xl font-semibold text-ambre mb-6">
                {estimation ? `${estimation.toLocaleString("fr-FR")} €` : "—"}
                <span className="text-sm text-blanc-faint font-normal ml-2">TTC indicatif</span>
              </p>
              <div className="border-t border-ligne pt-4 space-y-2 font-mono text-sm">
                <p className="flex justify-between"><span className="text-blanc-faint">Trajet</span><span>{form.depart_adresse || "—"} → {form.arrivee_adresse || "—"}</span></p>
                <p className="flex justify-between"><span className="text-blanc-faint">Passagers</span><span>{form.passagers || "—"}</span></p>
              </div>
              <p className="mt-5 text-[13px] text-blanc-dim bg-vert-dim border border-vert/30 rounded-sm px-4 py-3">
                Cette estimation est calculée automatiquement, sans transmettre votre trajet à un transporteur.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="label">Besoin d&apos;utiliser le véhicule sur place ?</label>
                <div className="flex gap-2.5">
                  {[false, true].map((v) => (
                    <button key={String(v)} onClick={() => set("vehicule_utilise_sur_place", v)}
                      className={`flex-1 border rounded-sm py-3.5 text-sm font-semibold transition
                        ${form.vehicule_utilise_sur_place === v ? "border-ambre bg-ambre-dim text-ambre" : "border-ligne-strong text-blanc-dim"}`}>
                      {v ? "Oui" : "Non"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Étapes, arrêts, précisions</label>
                <textarea className="input min-h-[110px] resize-none"
                  placeholder="Pauses, horaires, kilométrage…"
                  value={form.precisions} onChange={(e) => set("precisions", e.target.value)} />
              </div>
              <p className="text-[13px] text-blanc-dim bg-ambre-dim border border-ambre/40 rounded-sm px-4 py-3">
                <strong>Ne mentionnez aucune coordonnée personnelle</strong> (nom, email, téléphone) :
                votre demande est diffusée sous profil anonyme, quel que soit le mode choisi.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="label">Motif du voyage</label>
                <input className="input" placeholder="Scolaire, entreprise, mariage…"
                  value={form.motif} onChange={(e) => set("motif", e.target.value)} />
              </div>
              <div>
                <label className="label">Comment recevoir vos offres ?</label>
                <div className="flex gap-2.5">
                  <button onClick={() => set("mode", "devis")}
                    className={`flex-1 border rounded-sm py-4 text-sm font-semibold transition
                      ${form.mode === "devis" ? "border-[#9DB3DE] bg-bleunuit text-[#9DB3DE]" : "border-ligne-strong text-blanc-dim"}`}>
                    Devis multiples
                    <span className="block font-mono text-[10.5px] font-normal opacity-75 mt-1">Jusqu&apos;à 6 offres, à votre rythme</span>
                  </button>
                  <button onClick={() => set("mode", "enchere")}
                    className={`flex-1 border rounded-sm py-4 text-sm font-semibold transition
                      ${form.mode === "enchere" ? "border-vert bg-vert-dim text-vert" : "border-ligne-strong text-blanc-dim"}`}>
                    Enchère en direct
                    <span className="block font-mono text-[10.5px] font-normal opacity-75 mt-1">Prix en baisse, fenêtre 2h</span>
                  </button>
                </div>
              </div>
              <p className="text-[13px] text-blanc-dim bg-vert-dim border border-vert/30 rounded-sm px-4 py-3">
                Client et transporteurs restent mutuellement anonymes jusqu&apos;à votre sélection —
                gratuit pour vous, commission au succès pour le transporteur retenu.
              </p>
              {error && <p className="font-mono text-sm text-[#E8735D]">{error}</p>}
            </div>
          )}
        </div>

        {needAuth && (
          <div className="card mt-5">
            <p className="font-semibold text-sm mb-1.5">
              {authMode === "signup" ? "Créez votre compte pour envoyer la demande" : "Connectez-vous pour envoyer la demande"}
            </p>
            <p className="text-[12.5px] text-blanc-dim mb-5">
              Votre demande est prête — il ne manque qu&apos;un accès pour suivre vos offres.
              Votre email n&apos;est jamais transmis aux transporteurs.
            </p>
            {authMode === "signup" && (
              <div className="mb-4">
                <label className="label">Prénom et nom</label>
                <input className="input" placeholder="Ex. Jeremy Peloso"
                  value={nomClient} onChange={(e) => setNomClient(e.target.value)} />
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="vous@exemple.fr"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">Mot de passe</label>
                <input className="input" type="password" placeholder="6 caractères minimum"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            {error && <p className="font-mono text-sm text-[#E8735D] mb-4">{error}</p>}
            <button className="btn-primary w-full disabled:opacity-50" disabled={saving} onClick={authAndSubmit}>
              {saving ? "Envoi…" : authMode === "signup" ? "Créer mon compte et envoyer →" : "Me connecter et envoyer →"}
            </button>
            <button
              className="mt-3.5 font-mono text-xs text-blanc-faint hover:text-blanc-dim w-full text-center"
              onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setError(null); }}
            >
              {authMode === "signup" ? "J'ai déjà un compte → me connecter" : "Pas encore de compte → en créer un"}
            </button>
          </div>
        )}

        {!needAuth && (
          <div className="flex justify-between mt-5">
            <button className="btn-ghost disabled:opacity-35" disabled={step === 1}
              onClick={() => setStep((s) => s - 1)}>← Étape précédente</button>
            {step < 4 ? (
              <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>Étape suivante →</button>
            ) : (
              <button className="btn-primary disabled:opacity-50" disabled={saving} onClick={submit}>
                {saving ? "Envoi…" : "Envoyer ma demande →"}
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
