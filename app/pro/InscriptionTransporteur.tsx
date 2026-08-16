"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEPARTEMENTS_HINT = "Ex. 76, 27, 14";

export function InscriptionTransporteur() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const [form, setForm] = useState({
    // Étape 1
    secteur: "",
    departement_siege: "",
    // Étape 3 — société
    raison_sociale: "",
    adresse: "",
    code_postal: "",
    ville: "",
    siren: "",
    licence_transport: "",
    zones: "", // départements de prise en charge, séparés par des virgules
    // Étape 3 — contact
    prenom: "",
    nom: "",
    telephone: "",
    email: "",
    password: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError(null);
    const required = ["raison_sociale", "adresse", "code_postal", "ville", "siren", "licence_transport", "prenom", "nom", "telephone", "email"] as const;
    for (const k of required) {
      if (!form[k].trim()) { setError("Tous les champs sont requis (sauf mention contraire)."); return; }
    }
    if (!/^\d{9}(\d{5})?$/.test(form.siren.replace(/\s/g, ""))) {
      setError("SIREN (9 chiffres) ou SIRET (14 chiffres) invalide.");
      return;
    }
    const zones = form.zones.split(",").map((z) => z.trim()).filter(Boolean);
    if (zones.length === 0) { setError("Indiquez au moins un département de prise en charge."); return; }
    if (form.password.length < 6) { setError("Mot de passe : 6 caractères minimum."); return; }

    setSaving(true);

    // Compte : réutilise la session existante, sinon création
    let userId: string;
    const { data: { user: existing } } = await supabase.auth.getUser();
    if (existing) {
      userId = existing.id;
    } else {
      const { data, error: err } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (err) {
        setError(err.message.toLowerCase().includes("already registered")
          ? "Un compte existe déjà avec cet email — connectez-vous d'abord depuis la page Connexion."
          : err.message);
        setSaving(false);
        return;
      }
      if (!data.session) {
        setError("Confirmez votre email (lien envoyé), puis revenez terminer l'inscription.");
        setSaving(false);
        return;
      }
      userId = data.session.user.id;
    }

    // Profil (rôle transporteur) + fiche transporteur en attente de validation
    const { error: pErr } = await supabase.from("profiles").upsert({
      id: userId,
      role: "transporteur",
      nom: `${form.prenom} ${form.nom}`,
      telephone: form.telephone,
      email: existing?.email ?? form.email,
    });
    if (pErr) { setError(pErr.message); setSaving(false); return; }

    const { error: tErr } = await supabase.from("transporteurs").insert({
      id: userId,
      secteur: form.secteur,
      raison_sociale: form.raison_sociale,
      siren: form.siren.replace(/\s/g, ""),
      licence_transport: form.licence_transport,
      departement_siege: form.departement_siege || form.code_postal.slice(0, 2),
    });
    if (tErr) { setError(tErr.message); setSaving(false); return; }

    await supabase.from("transporteur_zones").insert(
      zones.map((departement) => ({ transporteur_id: userId, departement }))
    );

    router.refresh(); // la page /pro affichera "compte en cours de validation"
  }

  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs text-blanc-faint mb-8">Étape {step} / 3</p>

      {/* ---------- ÉTAPE 1 : activité + siège ---------- */}
      {step === 1 && (
        <div className="card space-y-5">
          <div>
            <label className="label">Votre secteur d&apos;activité</label>
            <select className="input" value={form.secteur} onChange={(e) => set("secteur", e.target.value)}>
              <option value="">Sélectionnez…</option>
              <option value="autocariste">Autocariste (licence de transport communautaire)</option>
              <option value="vtc">VTC (carte professionnelle)</option>
              <option value="taxi">Taxi (autorisation de stationnement)</option>
              <option value="loti">Transport léger de voyageurs — LOTI</option>
            </select>
          </div>
          <div>
            <label className="label">Département du siège social</label>
            <input className="input font-mono" placeholder="Ex. 76" maxLength={3}
              value={form.departement_siege} onChange={(e) => set("departement_siege", e.target.value)} />
          </div>
          <button
            className="btn-primary w-full disabled:opacity-40"
            disabled={!form.secteur || !form.departement_siege.trim()}
            onClick={() => setStep(2)}
          >
            Inscription gratuite →
          </button>
        </div>
      )}

      {/* ---------- ÉTAPE 2 : conditions + engagement ---------- */}
      {step === 2 && (
        <div className="card space-y-5">
          <div>
            <h2 className="font-semibold text-lg mb-2">Comment ça marche pour vous</h2>
            <p className="text-sm text-blanc-dim">
              Vous devez être un professionnel du transport de voyageurs avec une société
              française (SIREN) et un titre d&apos;exercice valide (licence communautaire,
              carte VTC, autorisation taxi ou attestation LOTI). Votre compte est
              <strong> vérifié manuellement</strong> (titre + RC Pro) avant l&apos;accès aux demandes.
            </p>
          </div>

          <div className="border-t border-ligne pt-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-blanc-faint mb-3">Commission</p>
            <ul className="text-sm text-blanc-dim space-y-1.5">
              <li>— <strong className="text-blanc">9 %</strong> jusqu&apos;à 2 000 € TTC · <strong className="text-blanc">7 %</strong> jusqu&apos;à 5 000 € · <strong className="text-blanc">5 %</strong> au-delà</li>
              <li>— Taux <strong className="text-blanc">réduit en enchère</strong>, encore réduit sur vos trajets retour à vide</li>
              <li>— Même taux partout en France, <strong className="text-blanc">sans majoration géographique</strong></li>
              <li>— Uniquement sur les missions gagnées, facturée après la prestation</li>
            </ul>
          </div>

          <div className="border-t border-ligne pt-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-blanc-faint mb-3">Vos avantages</p>
            <ul className="text-sm text-blanc-dim space-y-1.5">
              <li>— Des leads filtrés par les zones que vous choisissez</li>
              <li>— Vous fixez vos prix librement, en devis comme en enchère</li>
              <li>— Vous facturez le client 100 % en direct, aucun paiement ne passe par DealBus</li>
              <li>— Publiez vos retours à vide et rentabilisez vos kilomètres perdus</li>
            </ul>
          </div>

          <label className="flex items-start gap-3 text-sm text-blanc-dim border-t border-ligne pt-5 cursor-pointer">
            <input type="checkbox" className="mt-1 accent-[#E8A63D]"
              checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span><strong className="text-blanc">J&apos;ai lu et j&apos;accepte les informations indiquées</strong> et je veux continuer mon inscription.</span>
          </label>

          <div className="flex gap-3">
            <button className="btn-ghost" onClick={() => setStep(1)}>← Retour</button>
            <button className="btn-primary flex-1 disabled:opacity-40" disabled={!accepted} onClick={() => setStep(3)}>
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ---------- ÉTAPE 3 : société + contact + compte ---------- */}
      {step === 3 && (
        <div className="card space-y-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-blanc-faint mb-4">Votre société</p>
            <div className="space-y-4">
              <div>
                <label className="label">Nom / dénomination sociale</label>
                <input className="input" value={form.raison_sociale} onChange={(e) => set("raison_sociale", e.target.value)} />
              </div>
              <div>
                <label className="label">Adresse</label>
                <input className="input" value={form.adresse} onChange={(e) => set("adresse", e.target.value)} />
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-4">
                <div>
                  <label className="label">Code postal</label>
                  <input className="input font-mono" maxLength={5} value={form.code_postal} onChange={(e) => set("code_postal", e.target.value)} />
                </div>
                <div>
                  <label className="label">Ville</label>
                  <input className="input" value={form.ville} onChange={(e) => set("ville", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Numéro SIREN ou SIRET</label>
                <input className="input font-mono" placeholder="9 ou 14 chiffres" value={form.siren} onChange={(e) => set("siren", e.target.value)} />
              </div>
              <div>
                <label className="label">
                  {form.secteur === "vtc" ? "N° de carte professionnelle VTC"
                    : form.secteur === "taxi" ? "N° d'autorisation de stationnement (taxi)"
                    : form.secteur === "loti" ? "N° d'attestation LOTI"
                    : "N° de licence de transport communautaire"}
                </label>
                <input className="input font-mono" value={form.licence_transport} onChange={(e) => set("licence_transport", e.target.value)} />
              </div>
              <div>
                <label className="label">Départements de prise en charge (séparés par des virgules)</label>
                <input className="input font-mono" placeholder={DEPARTEMENTS_HINT} value={form.zones} onChange={(e) => set("zones", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-ligne pt-6">
            <p className="font-mono text-[11px] uppercase tracking-widest text-blanc-faint mb-1.5">Vos coordonnées</p>
            <p className="text-xs text-blanc-faint mb-4">Contact principal de DealBus — jamais transmis aux clients avant qu&apos;ils ne retiennent votre offre.</p>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Prénom</label>
                  <input className="input" value={form.prenom} onChange={(e) => set("prenom", e.target.value)} />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input className="input" value={form.nom} onChange={(e) => set("nom", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Téléphone (portable de préférence)</label>
                <input className="input font-mono" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </div>
                <div>
                  <label className="label">Mot de passe</label>
                  <input className="input" type="password" placeholder="6 caractères minimum" value={form.password} onChange={(e) => set("password", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {error && <p className="font-mono text-sm text-[#E8735D]">{error}</p>}

          <div className="flex gap-3">
            <button className="btn-ghost" onClick={() => setStep(2)}>← Retour</button>
            <button className="btn-primary flex-1 disabled:opacity-50" disabled={saving} onClick={submit}>
              {saving ? "Création…" : "Créer mon compte →"}
            </button>
          </div>
          <p className="font-mono text-[11px] text-blanc-faint">
            Votre compte passe ensuite en vérification manuelle (licence + RC Pro). Vous êtes averti par email dès l&apos;activation.
          </p>
        </div>
      )}
    </div>
  );
}
