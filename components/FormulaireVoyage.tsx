"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AddressInput } from "./AddressInput";
import { ORGANISMES, type Organisme } from "@/lib/assistant-demande";
import type { Voyage, Formule } from "@/lib/voyages";

// Formulaire de la page thème : pré-réglé pour le type de sortie, il ne
// stocke rien et envoie vers le parcours guidé /demande déjà pré-rempli.
export function FormulaireVoyage({ voyage }: { voyage: Voyage }) {
  const router = useRouter();
  const versInitial = useSearchParams().get("vers") ?? undefined;
  const destinations = [...voyage.exemples.map((e) => e.nom), ...voyage.autres];
  const AUTRE = "__autre__";
  const initVers = versInitial && destinations.includes(versInitial) ? versInitial : versInitial ? AUTRE : destinations[0];

  const [vers, setVers] = useState(initVers);
  const [versLibre, setVersLibre] = useState(versInitial && !destinations.includes(versInitial) ? versInitial : "");
  const [de, setDe] = useState("");
  const [dept, setDept] = useState("");
  const [formule, setFormule] = useState<Formule>(voyage.formules.find((f) => f.id === voyage.formuleDefaut) ?? voyage.formules[0]);
  const [date, setDate] = useState("");
  const [passagers, setPassagers] = useState("");
  const [heureAller, setHeureAller] = useState("");
  const [heureRetour, setHeureRetour] = useState("");
  const [organisme, setOrganisme] = useState<Organisme>(voyage.organismeDefaut);
  const [precisions, setPrecisions] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  // Clic sur une destination de la page (?vers=...) : on suit le lien.
  useEffect(() => {
    if (!versInitial) return;
    if (destinations.includes(versInitial)) { setVers(versInitial); }
    else { setVers(AUTRE); setVersLibre(versInitial); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versInitial]);

  const destination = vers === AUTRE ? versLibre.trim() : vers;
  const jours = formule.jours ?? 1;

  function dateRetour() {
    if (!date || jours <= 1) return "";
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + jours - 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function go() {
    if (!destination) { setErreur("Indiquez la destination."); return; }
    const p = new URLSearchParams();
    p.set("vers", destination);
    if (de) p.set("de", de);
    if (dept) p.set("dept", dept);
    p.set("type", formule.id === "aller_simple" ? "aller_simple" : jours > 1 ? "circuit" : "aller_retour");
    if (date) p.set("date_aller", date);
    const dr = dateRetour();
    if (dr) p.set("date_retour", dr); else if (date && jours <= 1) p.set("date_retour", date);
    if (heureAller) p.set("heure_aller", heureAller);
    if (heureRetour) p.set("heure_retour", heureRetour);
    if (passagers) p.set("passagers", passagers);
    p.set("organisme", organisme);
    const lignes = [`${voyage.titreCourt} · ${formule.label}`, ...precisions];
    p.set("message", lignes.join("\n"));
    router.push(`/demande?${p.toString()}`);
  }

  const lab = "block font-mono text-[10px] uppercase tracking-[.12em] text-blanc-faint mb-1.5";
  const champ = "w-full bg-white/[.06] border border-white/15 rounded text-blanc text-sm px-3 py-2.5 focus:outline-none focus:border-ambre";
  const chip = (on: boolean) => `rounded-full px-3 py-1.5 text-[12.5px] border transition ${on ? "bg-ambre text-encre border-ambre font-semibold" : "border-white/20 text-blanc-dim hover:border-white/40"}`;

  return (
    <div className="sombre bg-asphalte text-blanc rounded-xl p-6 shadow-[0_20px_50px_rgba(0,0,0,.25)]">
      <span className="eyebrow">Demande de devis</span>
      <h2 className="h-display text-2xl mt-2 mb-1">{voyage.titreCourt}</h2>
      <p className="text-[13px] text-blanc-dim mb-4">Pré-réglé pour ce type de sortie. 2 minutes, gratuit, sans engagement.</p>

      <div className="mb-3">
        <label className={lab}>Destination</label>
        <select className={champ} value={vers} onChange={(e) => setVers(e.target.value)}>
          {destinations.map((d) => <option key={d} value={d}>{d}</option>)}
          <option value={AUTRE}>Autre destination (à préciser)…</option>
        </select>
        {vers === AUTRE && (
          <input className={`${champ} mt-2`} placeholder="Ville, site ou adresse" value={versLibre} onChange={(e) => setVersLibre(e.target.value)} />
        )}
      </div>

      <div className="mb-3">
        <label className={lab}>Départ (ville ou adresse)</label>
        <AddressInput value={de} onChange={setDe} onSelect={(s) => { setDe(s.label); setDept(s.dept); }} placeholder="Votre point de départ" />
      </div>

      <div className="mb-3">
        <label className={lab}>Formule</label>
        <div className="flex flex-wrap gap-1.5">
          {voyage.formules.map((f) => (
            <button key={`${f.id}-${f.jours}`} type="button" className={chip(f === formule)} onClick={() => setFormule(f)}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div><label className={lab}>{jours > 1 ? "Date de départ" : "Date"}</label><input type="date" className={champ} value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><label className={lab}>Passagers</label><input type="number" min={1} className={champ} placeholder="52" value={passagers} onChange={(e) => setPassagers(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div><label className={lab}>Départ souhaité</label><input type="time" className={champ} value={heureAller} onChange={(e) => setHeureAller(e.target.value)} /></div>
        <div><label className={lab}>{jours > 1 ? "Retour (dernier jour)" : "Reprise sur place"}</label><input type="time" className={champ} value={heureRetour} onChange={(e) => setHeureRetour(e.target.value)} /></div>
      </div>

      {voyage.assistant && jours <= 1 && (
        <div className="bg-vert-dim border border-vert/30 text-[12.5px] text-blanc rounded px-3 py-2 mb-3">
          🤖 <b className="text-vert">Assistant :</b> {voyage.assistant}
        </div>
      )}

      <div className="mb-3">
        <label className={lab}>Vous êtes</label>
        <div className="flex flex-wrap gap-1.5">
          {ORGANISMES.map((o) => (
            <button key={o.id} type="button" className={chip(o.id === organisme)} onClick={() => setOrganisme(o.id)}>{o.label.replace(/^Un(e)? /, "").replace(/^établissement scolaire$/, "École")}</button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className={lab}>Précisions utiles pour les transporteurs</label>
        {voyage.precisions.map((t) => {
          const on = precisions.includes(t);
          return (
            <label key={t} className="flex items-start gap-2.5 text-[13px] text-blanc-dim py-1 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-[#E8A63D]" checked={on} onChange={() => setPrecisions((p) => on ? p.filter((x) => x !== t) : [...p, t])} />
              {t}
            </label>
          );
        })}
        <p className="text-[12px] text-blanc-faint mt-1">Vous pourrez ajouter un message libre à l&apos;étape suivante.</p>
      </div>

      {erreur && <p className="font-mono text-sm text-[#E8735D] mb-2">{erreur}</p>}
      <button type="button" onClick={go} className="btn-primary w-full justify-center">Recevoir des offres →</button>
      <p className="text-[11.5px] text-blanc-faint text-center mt-2.5">Vous finalisez en 1 écran (vérification + e-mail). Les transporteurs répondent en général sous 24 h.</p>
    </div>
  );
}
