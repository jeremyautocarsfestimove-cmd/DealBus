"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Prospect = {
  id: string; email: string; societe: string | null; departement: string | null;
  statut: string; envoye_le: string | null; erreur: string | null;
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
  const [filtre, setFiltre] = useState<string>("tous");
  const [recherche, setRecherche] = useState("");
  const [limite, setLimite] = useState(40);
  const [occupied, setOccupied] = useState<string | null>(null);
  const [emailTest, setEmailTest] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const { data } = await supabase
      .from("prospects").select("*")
      .order("created_at", { ascending: true });
    setProspects((data ?? []) as Prospect[]);
  }, [supabase]);

  useEffect(() => { charger(); }, [charger]);

  const stats = useMemo(() => {
    const s: Record<string, number> = { a_contacter: 0, envoye: 0, stop: 0, erreur: 0, inscrit: 0 };
    prospects.forEach((p) => { s[p.statut] = (s[p.statut] ?? 0) + 1; });
    return s;
  }, [prospects]);

  const visibles = useMemo(() => {
    let liste = prospects;
    if (filtre !== "tous") liste = liste.filter((p) => p.statut === filtre);
    if (recherche.trim()) {
      const q = recherche.trim().toLowerCase();
      liste = liste.filter((p) =>
        p.email.includes(q) || (p.societe ?? "").toLowerCase().includes(q) || (p.departement ?? "").includes(q));
    }
    return liste.slice(0, 200);
  }, [prospects, filtre, recherche]);

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
      const r = await fetch("/api/admin/prospection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", contacts }),
      });
      const res = await r.json();
      if (!r.ok) throw new Error(res.error ?? "import impossible");
      setMessage(`Import : ${res.valides} adresses valides · ${res.nouveaux} nouvelles · ${res.deja_connus} déjà connues.`);
      await charger();
    } catch (e) {
      setMessage(`❌ ${(e as Error).message}`);
    } finally {
      setOccupied(null);
    }
  }

  // ---------- Envoi d'une vague ----------
  async function envoyerVague() {
    if (!confirm(`Envoyer l'email de prospection aux ${Math.min(limite, stats.a_contacter)} prochains prospects « À contacter » ?`)) return;
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

  // ---------- Envoi de test ----------
  async function envoyerTest() {
    if (!emailTest.trim()) return;
    setOccupied("test");
    setMessage(null);
    try {
      const r = await fetch("/api/admin/prospection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", email: emailTest }),
      });
      const res = await r.json();
      if (!r.ok) throw new Error(res.error ?? "envoi impossible");
      setMessage(`✉️ Email de test envoyé à ${res.envoye_a} (objet préfixé [TEST]) — vérifiez la boîte de réception.`);
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
        <Link href="/admin" className="btn-ghost">← Back-office</Link>
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
          <div className="ml-auto flex items-end gap-3">
            <a href="/api/admin/prospection?preview=1" target="_blank" className="btn-ghost">
              Prévisualiser l&apos;email
            </a>
            <div>
              <label className="label">Taille de vague</label>
              <select className="input" value={limite} onChange={(e) => setLimite(Number(e.target.value))}>
                {[20, 30, 40, 50].map((n) => <option key={n} value={n}>{n} emails</option>)}
              </select>
            </div>
            <button className="btn-primary disabled:opacity-50"
              disabled={occupied !== null || !stats.a_contacter}
              onClick={envoyerVague}>
              {occupied === "envoi" ? "Envoi en cours…" : `Envoyer une vague →`}
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
            onClick={envoyerTest}>
            {occupied === "test" ? "Envoi…" : "Envoyer le test"}
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
                </td>
                <td className="px-5 py-2.5 text-right">
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
    </main>
  );
}
