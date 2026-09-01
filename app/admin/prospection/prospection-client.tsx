"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Prospect = {
  id: string; email: string; societe: string | null; departement: string | null;
  statut: string; envoye_le: string | null; erreur: string | null;
  relance_le: string | null; nb_relances: number | null;
};

const STATUTS: Record<string, { label: string; classe: string }> = {
  a_contacter: { label: "À contacter", classe: "bg-bleunuit text-[#9DB3DE]" },
  envoye: { label: "Envoyé", classe: "bg-vert-dim text-vert" },
  stop: { label: "STOP", classe: "bg-rouge-dim text-rouge" },
  erreur: { label: "Erreur", classe: "bg-ambre-dim text-ambre" },
  inscrit: { label: "Inscrit ✓", classe: "bg-vert-dim text-vert" },
};

export function ProspectionClient() {
  const supabase = useMemo(() => createClient(), []);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({ a_contacter: 0, envoye: 0, stop: 0, erreur: 0, inscrit: 0 });
  const [filtre, setFiltre] = useState<string>("tous");
  const [recherche, setRecherche] = useState("");
  const [limite, setLimite] = useState(40);
  const [occupied, setOccupied] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<{ titre: string; lignes: string[]; action: () => void } | null>(null);
  const [emailTest, setEmailTest] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  // Compteurs calculés côté serveur : le chargement complet dans le navigateur
  // est plafonné à 1000 lignes, ce qui faussait les statistiques.
  const chargerStats = useCallback(async () => {
    const statuts = ["a_contacter", "envoye", "stop", "erreur", "inscrit"] as const;
    const counts = await Promise.all(
      statuts.map((s) =>
        supabase.from("prospects").select("*", { count: "exact", head: true }).eq("statut", s)
      )
    );
    const s: Record<string, number> = {};
    statuts.forEach((k, i) => { s[k] = counts[i].count ?? 0; });
    setStats(s);
  }, [supabase]);

  // Liste filtrée côté serveur (200 lignes maximum affichées).
  const chargerListe = useCallback(async () => {
    let q = supabase.from("prospects").select("*");
    if (filtre !== "tous") q = q.eq("statut", filtre);
    const terme = recherche.trim();
    if (terme) {
      const t = terme.replaceAll("%", "").replaceAll(",", " ");
      q = q.or(`email.ilike.%${t}%,societe.ilike.%${t}%,departement.ilike.%${t}%`);
    }
    const { data } = await q.order("created_at", { ascending: true }).limit(200);
    setProspects((data ?? []) as Prospect[]);
  }, [supabase, filtre, recherche]);

  const charger = useCallback(async () => {
    await Promise.all([chargerStats(), chargerListe()]);
  }, [chargerStats, chargerListe]);

  useEffect(() => { chargerStats(); }, [chargerStats]);
  useEffect(() => {
    const t = setTimeout(chargerListe, 300);
    return () => clearTimeout(t);
  }, [chargerListe]);

  const visibles = prospects;

  // ---------- Import CSV ----------
  async function importer(file: File) {
    setOccupied("import");
    setMessage(null);
    try {
      const raw = (await file.text()).replace(/^\uFEFF/, "");
      const sep = raw.split("\n")[0].includes(";") ? ";" : ",";
      const lignes = raw.split(/\r?\n/).filter((l) => l.trim());
      const entetes = lignes[0].split(sep).map((h) => h.trim().toLowerCase());
      const idx = {
        email: entetes.findIndex((h) => h.includes("mail")),
        societe: entetes.findIndex((h) => h.includes("societe") || h.includes("société") || h.includes("nom") || h.includes("raison")),
        dept: entetes.findIndex((h) => h.includes("dep") || h.includes("dpt") || h.includes("cp")),
      };
      if (idx.email < 0) throw new Error(`Colonne email introuvable (en-têtes : ${entetes.join(", ")})`);
      const contacts = lignes.slice(1).map((l) => {
        const c = l.split(sep);
        return {
          email: c[idx.email] ?? "",
          societe: idx.societe >= 0 ? c[idx.societe] : "",
          departement: idx.dept >= 0 ? c[idx.dept] : "",
        };
      });
      // Envoi par lots de 2000 : les gros fichiers dépassent la limite de
      // taille de requête du serveur (Request Entity Too Large).
      const totaux = { valides: 0, nouveaux: 0, deja_connus: 0 };
      for (let i = 0; i < contacts.length; i += 2000) {
        const lot = contacts.slice(i, i + 2000);
        setMessage(`Import en cours… ${Math.min(i + 2000, contacts.length)} / ${contacts.length} lignes envoyées.`);
        const r = await fetch("/api/admin/prospection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "import", contacts: lot }),
        });
        const res = await r.json();
        if (!r.ok) throw new Error(res.error ?? "import impossible");
        totaux.valides += res.valides ?? 0;
        totaux.nouveaux += res.nouveaux ?? 0;
        totaux.deja_connus += res.deja_connus ?? 0;
      }
      setMessage(`Import : ${totaux.valides} adresses valides · ${totaux.nouveaux} nouvelles · ${totaux.deja_connus} déjà connues.`);
      await charger();
    } catch (e) {
      setMessage(`❌ ${(e as Error).message}`);
    } finally {
      setOccupied(null);
    }
  }

  // ---------- Envoi d'une vague ----------
  function demanderVague() {
    setDialogue({
      titre: "Envoyer une vague ?",
      lignes: [`L'email de prospection partira aux ${Math.min(limite, stats.a_contacter)} prochains prospects « À contacter ».`],
      action: envoyerVague,
    });
  }

  async function envoyerVague() {
    setOccupied("envoi");
    setMessage(null);
    try {
      const r = await fetch("/api/admin/prospection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "envoyer", limite }),
      });
      const res = await r.json();
      if (!r.ok) throw new Error(res.error ?? "envoi impossible");
      setMessage(`Vague terminée : ${res.envoyes} envoyé${res.envoyes > 1 ? "s" : ""}${res.erreurs ? ` · ${res.erreurs} erreur(s)` : ""}.`);
      await charger();
    } catch (e) {
      setMessage(`❌ ${(e as Error).message}`);
    } finally {
      setOccupied(null);
    }
  }

  // ---------- Relance en masse ----------
  function demanderRelanceMasse() {
    setDialogue({
      titre: "Relancer une vague ?",
      lignes: [
        `L'email de relance (argument : 100 000 organisateurs contactés) partira aux ${limite} prospects « Envoyé » les plus anciens.`,
        "Garde-fous : contactés il y a plus de 7 jours, 2 relances maximum par prospect, 14 jours minimum entre deux relances.",
      ],
      action: envoyerRelanceMasse,
    });
  }

  async function envoyerRelanceMasse() {
    setOccupied("relance_masse");
    setMessage(null);
    try {
      const r = await fetch("/api/admin/prospection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "relance_masse", limite }),
      });
      const res = await r.json();
      if (!r.ok) throw new Error(res.error ?? "relance impossible");
      setMessage(res.envoyes
        ? `Relances envoyées : ${res.envoyes}${res.erreurs ? ` · ${res.erreurs} erreur(s)` : ""}.`
        : `Aucune relance envoyée : ${res.note ?? "aucun prospect éligible"}.`);
      await charger();
    } catch (e) {
      setMessage(`❌ ${(e as Error).message}`);
    } finally {
      setOccupied(null);
    }
  }

  // ---------- Envoi de test ----------
  async function envoyerTest(relance = false) {
    if (!emailTest.trim()) return;
    setOccupied("test");
    setMessage(null);
    try {
      const r = await fetch("/api/admin/prospection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: relance ? "test_relance" : "test", email: emailTest }),
      });
      const res = await r.json();
      if (!r.ok) throw new Error(res.error ?? "envoi impossible");
      setMessage(`✉️ Email de test ${relance ? "(relance) " : ""}envoyé à ${res.envoye_a} (objet préfixé [TEST]) — vérifiez la boîte de réception.`);
    } catch (e) {
      setMessage(`❌ ${(e as Error).message}`);
    } finally {
      setOccupied(null);
    }
  }

  // ---------- Relance individuelle ----------
  function demanderRelance(p: Prospect) {
    const dernier = p.relance_le ?? p.envoye_le;
    const quand = dernier ? new Date(dernier).toLocaleDateString("fr-FR") : "—";
    setDialogue({
      titre: `Relancer ${p.societe ?? p.email} ?`,
      lignes: [
        `Un email de relance (version courte, angle pionnier) partira à ${p.email}.`,
        `Dernier contact : ${quand}${p.nb_relances ? ` · déjà ${p.nb_relances} relance(s)` : ""}.`,
      ],
      action: () => relancer(p),
    });
  }

  async function relancer(p: Prospect) {
    setOccupied(p.id);
    try {
      const r = await fetch("/api/admin/prospection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "relance", email: p.email }),
      });
      const res = await r.json();
      if (!r.ok) throw new Error(res.error ?? "relance impossible");
      setMessage(`↻ Relance envoyée à ${p.email} (n°${res.relances}).`);
      await charger();
    } catch (e) {
      setMessage(`❌ ${(e as Error).message}`);
    } finally {
      setOccupied(null);
    }
  }

  // ---------- STOP / réarmer ----------
  async function basculerStop(p: Prospect) {
    const retour = p.statut === "stop";
    await fetch("/api/admin/prospection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop", email: p.email, retour }),
    });
    await charger();
  }

  return (
    <main className="max-w-6xl mx-auto px-7 py-12">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="eyebrow mb-3">Administration</p>
          <h1 className="h-display text-4xl">Prospection transporteurs.</h1>
        </div>
        <div className="flex gap-2.5">
          <Link href="/admin" className="btn-ghost">← Back-office</Link>
          <Link href="/admin/prospection-clients" className="btn-ghost">Prospection clients →</Link>
        </div>
      </div>

      {/* ---------- Stats ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {Object.entries(STATUTS).map(([k, v]) => (
          <button key={k} onClick={() => setFiltre(filtre === k ? "tous" : k)}
            className={`card text-left transition-opacity ${filtre !== "tous" && filtre !== k ? "opacity-40" : ""}`}>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint mb-1">{v.label}</p>
            <p className="h-display text-3xl">{stats[k] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* ---------- Actions ---------- */}
      <div className="card mb-8">
        <div className="flex flex-wrap items-end gap-5">
          <div>
            <label className="label">Importer un fichier CSV</label>
            <input type="file" accept=".csv,text/csv" disabled={occupied !== null}
              onChange={(e) => e.target.files?.[0] && importer(e.target.files[0])}
              className="block text-sm text-blanc-dim file:mr-4 file:btn-ghost file:cursor-pointer" />
            <p className="font-mono text-[10.5px] text-blanc-faint mt-1.5">
              Colonnes détectées automatiquement : email (obligatoire), société, département.
            </p>
          </div>
          <div className="ml-auto flex items-end gap-3 flex-wrap">
            <a href="/api/admin/prospection?preview=1" target="_blank" className="btn-ghost">
              Prévisualiser l&apos;email
            </a>
            <a href="/api/admin/prospection?preview=relance" target="_blank" className="btn-ghost">
              Prévisualiser la relance
            </a>
            <div>
              <label className="label">Taille de vague</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={1} max={1000} step={1}
                  className="input w-28"
                  value={limite}
                  onChange={(e) => setLimite(Math.min(Math.max(Number(e.target.value) || 1, 1), 1000))}
                />
                <div className="flex gap-1">
                  {[30, 50, 100, 250, 500].map((n) => (
                    <button key={n} type="button"
                      onClick={() => setLimite(n)}
                      className={`font-mono text-[11px] px-2 py-1 rounded-sm border transition
                        ${limite === n ? "border-ambre text-ambre" : "border-ligne text-blanc-faint hover:text-blanc-dim"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button className="btn-primary disabled:opacity-50"
              disabled={occupied !== null || !stats.a_contacter}
              onClick={demanderVague}>
              {occupied === "envoi" ? "Envoi en cours…" : `Envoyer une vague →`}
            </button>
            <button className="btn-ghost disabled:opacity-50"
              disabled={occupied !== null || !stats.envoye}
              onClick={demanderRelanceMasse}>
              {occupied === "relance_masse" ? "Relance en cours…" : `Relancer une vague ↻`}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3 border-t border-ligne mt-5 pt-5">
          <div className="flex-1 min-w-[240px]">
            <label className="label">Envoyer un email de test à une adresse</label>
            <input className="input w-full" type="email" placeholder="votre@adresse.fr"
              value={emailTest} onChange={(e) => setEmailTest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && envoyerTest()} />
          </div>
          <button className="btn-ghost disabled:opacity-50"
            disabled={occupied !== null || !emailTest.trim()}
            onClick={() => envoyerTest(false)}>
            {occupied === "test" ? "Envoi…" : "Tester l'email"}
          </button>
          <button className="btn-ghost disabled:opacity-50"
            disabled={occupied !== null || !emailTest.trim()}
            onClick={() => envoyerTest(true)}>
            {occupied === "test" ? "Envoi…" : "Tester la relance"}
          </button>
        </div>
        {message && (
          <p className="font-mono text-xs text-blanc-dim border-t border-ligne mt-5 pt-4">{message}</p>
        )}
        <p className="font-mono text-[10.5px] text-blanc-faint border-t border-ligne mt-4 pt-3">
          Cadence conseillée : 30/jour les 3 premiers jours, puis 40-50/jour maximum.
          Une adresse déjà contactée ne peut jamais recevoir deux fois l&apos;email.
          Quand quelqu&apos;un répond « STOP » sur contact@dealbus.fr : bouton STOP sur sa ligne ci-dessous.
        </p>
      </div>

      {/* ---------- Liste ---------- */}
      <div className="flex items-center gap-4 mb-4">
        <input className="input flex-1" placeholder="Rechercher (email, société, département…)"
          value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        {filtre !== "tous" && (
          <button className="btn-ghost" onClick={() => setFiltre("tous")}>Tout afficher</button>
        )}
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ligne font-mono text-[10.5px] uppercase tracking-wider text-blanc-faint">
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Société</th>
              <th className="text-left px-5 py-3">Dépt</th>
              <th className="text-left px-5 py-3">Statut</th>
              <th className="text-left px-5 py-3">Envoyé le</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((p) => (
              <tr key={p.id} className="border-b border-ligne/50 last:border-0">
                <td className="px-5 py-2.5 font-mono text-[12.5px]">{p.email}</td>
                <td className="px-5 py-2.5 text-blanc-dim">{p.societe ?? "—"}</td>
                <td className="px-5 py-2.5 font-mono text-[12.5px]">{p.departement ?? "—"}</td>
                <td className="px-5 py-2.5">
                  <span className={`inline-block rounded-sm px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wide ${STATUTS[p.statut]?.classe ?? ""}`}
                    title={p.erreur ?? undefined}>
                    {STATUTS[p.statut]?.label ?? p.statut}
                  </span>
                </td>
                <td className="px-5 py-2.5 font-mono text-[12px] text-blanc-faint">
                  {p.envoye_le ? new Date(p.envoye_le).toLocaleDateString("fr-FR") : "—"}
                  {p.nb_relances ? (
                    <span className="text-ambre" title={p.relance_le ? `Dernière relance le ${new Date(p.relance_le).toLocaleDateString("fr-FR")}` : undefined}>
                      {" "}· ↻{p.nb_relances}
                    </span>
                  ) : null}
                </td>
                <td className="px-5 py-2.5 text-right whitespace-nowrap">
                  {p.statut === "envoye" && (
                    <button className="btn-ghost text-[12px] py-1 px-2.5 mr-2 disabled:opacity-50"
                      disabled={occupied !== null}
                      onClick={() => demanderRelance(p)}>
                      {occupied === p.id ? "…" : "Relancer"}
                    </button>
                  )}
                  <button className="btn-ghost text-[12px] py-1 px-2.5" onClick={() => basculerStop(p)}>
                    {p.statut === "stop" ? "Réarmer" : "STOP"}
                  </button>
                </td>
              </tr>
            ))}
            {!visibles.length && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-blanc-faint">
                Aucun prospect{filtre !== "tous" ? " dans ce statut" : " — importez votre premier fichier CSV ci-dessus"}.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {visibles.length === 200 && (
        <p className="font-mono text-[10.5px] text-blanc-faint mt-3">Affichage limité aux 200 premières lignes — utilisez la recherche ou les filtres.</p>
      )}

      {/* ---------- Dialogue de confirmation interne ---------- */}
      {dialogue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={() => setDialogue(null)}>
          <div className="absolute inset-0 bg-asphalte/80 backdrop-blur-sm" />
          <div className="relative card max-w-md w-full border-ligne-strong shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow mb-4">Confirmation</p>
            <h2 className="h-display text-2xl mb-3">{dialogue.titre}</h2>
            {dialogue.lignes.map((l) => (
              <p key={l} className="text-[14px] text-blanc-dim leading-relaxed mb-2">{l}</p>
            ))}
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-ghost" onClick={() => setDialogue(null)}>Annuler</button>
              <button className="btn-primary"
                onClick={() => { const a = dialogue.action; setDialogue(null); a(); }}>
                Confirmer →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
