import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { exigerAdmin, depuis } from "@/lib/admin-crm";
import { demandeActive } from "@/lib/demandes";
import { eur, aTraiter, TAG_ALERTE, SECTEURS, jour } from "./helpers";
import { TransporteurActions, EnvoyerEmailTransporteur } from "./actions";

export const metadata = { title: "Cockpit — Administration" };

/* eslint-disable @typescript-eslint/no-explicit-any */
type Tache = { priorite: 1 | 2 | 3; titre: string; detail: string; lien: string; action: string };

const ville = (adresse: string) => {
  const parts = adresse.split(",").map((s) => s.trim()).filter(Boolean);
  const avecCp = parts.find((p) => /\d{5}/.test(p));
  return (avecCp ? avecCp.replace(/\d{5}/, "").trim() : parts[0]) || parts[0] || adresse;
};
const heures = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3600000;
const joursAvant = (date: string) => Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86400000);

export default async function CockpitPage() {
  if (!(await exigerAdmin())) return null;
  const admin = createAdminClient();

  const [{ data: transporteurs }, { data: demandes }, { data: missions }, { count: supportNonLus }, { count: nbClients }] = await Promise.all([
    admin.from("transporteurs").select("*, profile:profiles(nom, telephone), zones:transporteur_zones(departement)").order("created_at", { ascending: false }),
    admin.from("demandes").select("id, numero, statut, client_id, depart_adresse, arrivee_adresse, date_aller, date_retour, passagers, created_at, relancee_le, relance_transporteurs_le, annulation_demandee_at, annulation_decision, client:profiles(nom)"),
    admin.from("missions").select("demande_id, statut, facturation, commission_montant, client_confirmation, annulation_demandee_at, annulation_decision"),
    admin.from("support_messages").select("id", { count: "exact", head: true }).eq("auteur", "user").is("lu_le", null),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
  ]);

  const T = (transporteurs ?? []) as any[];
  const D = (demandes ?? []) as any[];
  const M = (missions ?? []) as any[];
  const { data: offres } = D.length
    ? await admin.from("offres").select("demande_id, prix_ttc, created_at").in("demande_id", D.map((d) => d.id))
    : { data: [] as any[] };
  const O = (offres ?? []) as any[];

  const offresDe = (id: string) => O.filter((o) => o.demande_id === id);
  const actives = D.filter(demandeActive);

  // ---------- Pipeline ----------
  const colonnes = [
    { id: "sans", titre: "Sans offre", aide: "En attente des transporteurs", items: actives.filter((d) => d.statut === "ouverte" && offresDe(d.id).length === 0) },
    { id: "offres", titre: "Offres reçues", aide: "Le client doit choisir", items: actives.filter((d) => d.statut === "ouverte" && offresDe(d.id).length > 0) },
    { id: "confirmee", titre: "Confirmées", aide: "Offre acceptée, voyage à venir", items: actives.filter((d) => d.statut === "confirmee") },
  ].map((c) => ({ ...c, items: [...c.items].sort((a, b) => (a.date_aller < b.date_aller ? -1 : 1)) }));

  // ---------- À faire ----------
  const taches: Tache[] = [];
  for (const d of actives.filter((x) => x.statut === "ouverte")) {
    const od = offresDe(d.id);
    const j = joursAvant(d.date_aller);
    if (od.length === 0 && heures(d.created_at) > 48 && (!d.relance_transporteurs_le || heures(d.relance_transporteurs_le) > 72)) {
      taches.push({ priorite: j <= 21 ? 1 : 2, titre: `#${d.numero} sans offre depuis ${Math.floor(heures(d.created_at) / 24)} j`, detail: `${ville(d.depart_adresse)} → ${ville(d.arrivee_adresse)} · départ ${jour(d.date_aller)}`, lien: `/admin/demandes/${d.id}`, action: "Relancer les transporteurs" });
    }
    if (od.length > 0) {
      const derniere = od.map((o) => o.created_at).sort().reverse()[0];
      if (heures(derniere) > 72 && (!d.relancee_le || heures(d.relancee_le) > 120)) {
        taches.push({ priorite: j <= 30 ? 1 : 3, titre: `#${d.numero} : ${od.length} offre${od.length > 1 ? "s" : ""} sans choix du client`, detail: `${d.client?.nom ?? "Client"} · dernière offre ${depuis(derniere)}`, lien: `/admin/demandes/${d.id}`, action: "Relancer le client" });
      }
    }
  }
  const annulDemandes = D.filter((d) => d.annulation_demandee_at && !d.annulation_decision);
  const dossiers = M.filter(aTraiter);
  if (annulDemandes.length + dossiers.length) taches.push({ priorite: 1, titre: `${annulDemandes.length + dossiers.length} annulation(s) ou litige(s) à trancher`, detail: "Le client ou le transporteur attend votre décision", lien: "/admin/litiges", action: "Traiter" });
  if (supportNonLus) taches.push({ priorite: 1, titre: `${supportNonLus} message${supportNonLus > 1 ? "s" : ""} support non lu${supportNonLus > 1 ? "s" : ""}`, detail: "Bulle Aide des clients et transporteurs", lien: "/admin/support", action: "Répondre" });
  taches.sort((a, b) => a.priorite - b.priorite);

  // ---------- Indicateurs ----------
  const facturables = M.filter((m) => m.statut !== "annulee");
  const somme = (f: (m: any) => boolean) => facturables.filter(f).reduce((s, m) => s + Number(m.commission_montant), 0);
  const enAttente = T.filter((t) => t.statut === "en_attente");
  const suppressions = T.filter((t) => !!t.suppression_demandee_at);
  const avecOffre = D.filter((d) => offresDe(d.id).length > 0).length;

  const kpis = [
    { num: eur(Math.round(somme((m) => m.facturation === "payee"))), label: "Commissions encaissées", accent: true },
    { num: eur(Math.round(somme((m) => m.facturation === "a_facturer" || m.facturation === "facturee"))), label: "À facturer / en attente" },
    { num: String(actives.length), label: "Demandes actives" },
    { num: D.length ? `${Math.round((avecOffre / D.length) * 100)} %` : "—", label: "Demandes avec offre" },
    { num: D.length ? `${Math.round((facturables.length / D.length) * 100)} %` : "—", label: "Conversion en mission" },
    { num: String(nbClients ?? 0), label: "Clients" },
    { num: String(T.filter((t) => t.statut === "valide").length), label: "Transporteurs actifs" },
  ];

  const TON = { 1: "bg-[#FCEBE4] text-[#C2410C]", 2: "bg-ambre-dim text-ambre-fort", 3: "bg-asphalte-3 text-blanc-dim" } as const;
  const LIB = { 1: "Urgent", 2: "Aujourd'hui", 3: "À suivre" } as const;

  return (
    <main>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="crm-titre">Cockpit</h1>
          <p className="crm-sous">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · {taches.length} action{taches.length > 1 ? "s" : ""} en attente</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/clients" className="btn-ghost py-2 px-4 text-[13px]">Clients</Link>
          <Link href="/admin/demandes" className="btn-primary py-2 px-4 text-[13px]">Toutes les demandes</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="crm-kpi">
            <p className={`crm-kpi-num ${k.accent ? "text-ambre-fort" : ""}`}>{k.num}</p>
            <p className="crm-kpi-lbl">{k.label}</p>
          </div>
        ))}
      </div>

      {/* À faire */}
      <section className="crm-panel mb-6">
        <div className="crm-panel-h">
          <p className="crm-panel-t">À faire</p>
          <span className="font-mono text-[11px] text-blanc-faint">{taches.length}</span>
        </div>
        {taches.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-blanc-dim">Rien en attente. Tout est à jour.</p>
        ) : (
          <ul>
            {taches.map((t, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-4 py-3 border-b border-ligne last:border-0 hover:bg-asphalte-3/60">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`pill ${TON[t.priorite]}`}>{LIB[t.priorite]}</span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold truncate">{t.titre}</p>
                    <p className="text-[12px] text-blanc-faint truncate">{t.detail}</p>
                  </div>
                </div>
                <Link href={t.lien} className="btn-ghost py-1.5 px-3 text-[12px] whitespace-nowrap">{t.action} →</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pipeline */}
      <div className="flex items-end justify-between gap-4 mb-3">
        <h2 className="font-condensed font-bold uppercase text-xl">Pipeline des demandes actives</h2>
        <span className="font-mono text-[11px] text-blanc-faint">triées par date de départ</span>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {colonnes.map((c) => (
          <section key={c.id} className="crm-panel">
            <div className="crm-panel-h">
              <div>
                <p className="crm-panel-t">{c.titre}</p>
                <p className="text-[11.5px] text-blanc-faint">{c.aide}</p>
              </div>
              <span className="font-mono text-lg font-semibold">{c.items.length}</span>
            </div>
            <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto">
              {c.items.map((d) => {
                const od = offresDe(d.id).map((o) => Number(o.prix_ttc));
                const j = joursAvant(d.date_aller);
                return (
                  <Link key={d.id} href={`/admin/demandes/${d.id}`} className="crm-deal">
                    <div className="flex justify-between gap-2">
                      <span className="font-mono text-[11px] text-blanc-faint">#{d.numero}</span>
                      <span className={`pill ${j <= 14 ? "bg-[#FCEBE4] text-[#C2410C]" : "bg-asphalte-3 text-blanc-dim"}`}>J-{j}</span>
                    </div>
                    <p className="font-semibold mt-1 leading-snug">{ville(d.depart_adresse)} → {ville(d.arrivee_adresse)}</p>
                    <p className="text-[11.5px] text-blanc-faint mt-0.5">{d.client?.nom ?? "Client"} · {d.passagers} pax · {jour(d.date_aller)}</p>
                    {od.length > 0 && (
                      <p className="font-mono text-[11.5px] mt-1.5">{od.length} offre{od.length > 1 ? "s" : ""} · dès <span className="text-vert">{eur(Math.min(...od))}</span></p>
                    )}
                  </Link>
                );
              })}
              {c.items.length === 0 && <p className="text-[12.5px] text-blanc-faint px-1 py-3">Aucune demande.</p>}
            </div>
          </section>
        ))}
      </div>

      {/* Transporteurs à valider */}
      <section className="crm-panel">
        <div className="crm-panel-h">
          <p className="crm-panel-t">Transporteurs à valider</p>
          <span className={`pill ${enAttente.length ? TAG_ALERTE : "bg-asphalte-3 text-blanc-faint"}`}>{enAttente.length}</span>
        </div>
        {enAttente.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-blanc-dim">Aucun transporteur en attente de validation.</p>
        ) : (
          <ul>
            {enAttente.map((t) => (
              <li key={t.id} className="px-4 py-3.5 border-b border-ligne last:border-0 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold">
                    <Link href={`/admin/transporteurs/${t.id}`} className="hover:underline">{t.raison_sociale}</Link>
                    <span className="ml-2.5 pill bg-bleunuit text-bleunuit-fort">{SECTEURS[t.secteur] ?? t.secteur}</span>
                  </p>
                  <p className="font-mono text-[11.5px] text-blanc-faint mt-1">
                    SIREN {t.siren} · Titre {t.licence_transport} · Siège {t.departement_siege} · Zones {t.zones.map((z: { departement: string }) => z.departement).join(", ") || "—"}
                  </p>
                  <p className="font-mono text-[11.5px] text-blanc-faint mt-0.5">{t.profile?.nom ?? "—"} · {t.profile?.telephone ?? "—"} · inscrit le {jour(t.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <EnvoyerEmailTransporteur id={t.id} raisonSociale={t.raison_sociale} />
                  <TransporteurActions id={t.id} statut={t.statut} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {suppressions.length > 0 && (
          <div className="px-4 py-3 border-t border-ligne text-[13px]">
            <span className={`pill ${TAG_ALERTE} mr-2`}>Suppression demandée</span>
            {suppressions.map((t, i) => (
              <span key={t.id}>{i > 0 && ", "}<Link href={`/admin/transporteurs/${t.id}`} className="text-ambre-fort hover:underline">{t.raison_sociale}</Link></span>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
