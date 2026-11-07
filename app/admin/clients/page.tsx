import Link from "next/link";
import { chargerClients, exigerAdmin, depuis, STATUT_CLIENT, type StatutClient } from "@/lib/admin-crm";
import { ORGANISMES } from "@/lib/assistant-demande";
import { eur, jour } from "../helpers";

export const metadata = { title: "Clients — Administration" };

const FILTRES: { id: "tous" | StatutClient; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "en_cours", label: "En cours" },
  { id: "client", label: "Clients" },
  { id: "prospect", label: "Inscrits sans demande" },
  { id: "inactif", label: "Inactifs" },
];

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; statut?: string }> }) {
  if (!(await exigerAdmin())) return null;
  const { q = "", statut = "tous" } = await searchParams;
  const tous = await chargerClients();

  const recherche = q.trim().toLowerCase();
  const liste = tous.filter((c) =>
    (statut === "tous" || c.statut === statut) &&
    (!recherche || [c.nom, c.email, c.telephone].some((v) => v?.toLowerCase().includes(recherche))),
  );

  const n = (s: StatutClient) => tous.filter((c) => c.statut === s).length;
  const avecDemande = tous.filter((c) => c.nbDemandes > 0).length;
  const kpis = [
    { num: String(tous.length), label: "Comptes clients" },
    { num: String(n("en_cours")), label: "Avec demande active", accent: true },
    { num: String(n("client")), label: "Convertis (mission)" },
    { num: avecDemande ? `${Math.round((n("client") / avecDemande) * 100)} %` : "—", label: "Conversion demande → mission" },
    { num: eur(Math.round(tous.reduce((s, c) => s + c.commissions, 0))), label: "Commissions générées" },
  ];
  const lien = (s: string) => `/admin/clients?statut=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <main>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="crm-titre">Clients</h1>
          <p className="crm-sous">Tous les comptes clients, du simple inscrit au client converti.</p>
        </div>
        <form action="/admin/clients" method="get" className="flex gap-2">
          {statut !== "tous" && <input type="hidden" name="statut" value={statut} />}
          <input name="q" defaultValue={q} placeholder="Nom, email, téléphone…" className="input py-2 w-64" />
          <button className="btn-primary py-2 px-4 text-[13px]">Chercher</button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="crm-kpi">
            <p className={`crm-kpi-num ${k.accent ? "text-ambre-fort" : ""}`}>{k.num}</p>
            <p className="crm-kpi-lbl">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {FILTRES.map((f) => (
          <Link key={f.id} href={lien(f.id)} className={`crm-onglet ${statut === f.id ? "crm-onglet-on" : ""}`}>
            {f.label} · {f.id === "tous" ? tous.length : n(f.id)}
          </Link>
        ))}
        {q && <Link href={`/admin/clients?statut=${statut}`} className="crm-onglet">Effacer « {q} » ✕</Link>}
      </div>

      <div className="crm-panel overflow-x-auto">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Client</th><th>Téléphone</th><th>Statut</th><th>Type</th>
              <th className="text-right">Demandes</th><th className="text-right">Offres reçues</th>
              <th className="text-right">Missions</th><th className="text-right">Commissions</th>
              <th>Dernière activité</th><th>Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/clients/${c.id}`} className="font-semibold hover:text-ambre-fort">{c.nom || "Sans nom"}</Link>
                  <p className="font-mono text-[11px] text-blanc-faint">{c.email ?? "—"}</p>
                </td>
                <td className="font-mono text-[12px] whitespace-nowrap">{c.telephone ?? "—"}</td>
                <td><span className={`pill ${STATUT_CLIENT[c.statut].classe}`} title={STATUT_CLIENT[c.statut].aide}>{STATUT_CLIENT[c.statut].label}</span></td>
                <td className="text-blanc-dim">{ORGANISMES.find((o) => o.id === c.organisme)?.label ?? "—"}</td>
                <td className="text-right font-mono">{c.nbDemandes}{c.nbActives > 0 && <span className="text-ambre-fort"> ({c.nbActives} act.)</span>}</td>
                <td className="text-right font-mono">{c.nbOffres || "—"}</td>
                <td className="text-right font-mono">{c.nbMissions || "—"}</td>
                <td className="text-right font-mono">{c.commissions ? eur(Math.round(c.commissions)) : "—"}</td>
                <td className="whitespace-nowrap text-blanc-dim">{depuis(c.derniereActivite)}</td>
                <td className="font-mono text-[12px] text-blanc-faint">{jour(c.inscritLe)}</td>
              </tr>
            ))}
            {liste.length === 0 && (
              <tr><td colSpan={10} className="text-center text-blanc-dim py-10">Aucun client ne correspond.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
