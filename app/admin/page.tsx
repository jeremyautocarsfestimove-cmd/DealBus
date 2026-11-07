import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exigerAdmin, depuis, ville, chargerClients, STATUT_CLIENT } from "@/lib/admin-crm";
import { demandeActive } from "@/lib/demandes";
import { ORGANISMES } from "@/lib/assistant-demande";
import { eur, aTraiter, SECTEURS, jour } from "./helpers";
import { TransporteurActions, EnvoyerEmailTransporteur } from "./actions";

export const metadata = { title: "Cockpit — Administration" };

/* eslint-disable @typescript-eslint/no-explicit-any */
type Tache = { priorite: 1 | 2 | 3; titre: string; detail: string; lien: string; action: string };

const heures = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3600000;
const joursAvant = (date: string) => Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86400000);
const SEMAINES = 8;
const indexSemaine = (iso: string) => SEMAINES - 1 - Math.floor((Date.now() - new Date(iso).getTime()) / (7 * 86400000));

// Répartit des valeurs datées sur les 8 dernières semaines
function parSemaine<T>(items: T[], date: (x: T) => string, valeur: (x: T) => number = () => 1): number[] {
  const s = Array(SEMAINES).fill(0);
  for (const x of items) { const i = indexSemaine(date(x)); if (i >= 0 && i < SEMAINES) s[i] += valeur(x); }
  return s;
}

function Sparkline({ valeurs }: { valeurs: number[] }) {
  const max = Math.max(...valeurs, 1);
  return (
    <div className="flex items-end gap-[3px] h-[30px] mt-3" aria-hidden="true">
      {valeurs.map((v, i) => (
        <span key={i} className="flex-1 rounded-[2px]" style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: i === valeurs.length - 1 ? "#F5A524" : "#F0EFEC" }} />
      ))}
    </div>
  );
}

const TEINTES = [["#FFF1DC", "#B26A00"], ["#E8EEFF", "#3451B2"], ["#F3E8FF", "#7A3FB8"], ["#E6F6EE", "#1A7F52"], ["#FDE8E4", "#C2410C"], ["#F1F0ED", "#55534E"]];
const teinte = (s: string) => TEINTES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TEINTES.length];
const initiales = (n: string | null) => (n ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]?.toUpperCase()).join("") || "?";

export default async function CockpitPage() {
  if (!(await exigerAdmin())) return null;
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: moi }, { data: transporteurs }, { data: demandes }, { data: missions }, { count: supportNonLus }, clients] = await Promise.all([
    admin.from("profiles").select("nom").eq("id", user?.id ?? "").maybeSingle(),
    admin.from("transporteurs").select("*, profile:profiles(nom, telephone), zones:transporteur_zones(departement)").order("created_at", { ascending: false }),
    admin.from("demandes").select("id, numero, statut, client_id, depart_adresse, arrivee_adresse, date_aller, date_retour, passagers, created_at, relancee_le, relance_transporteurs_le, annulation_demandee_at, annulation_decision, client:profiles(nom)"),
    admin.from("missions").select("demande_id, statut, facturation, commission_montant, created_at, client_confirmation, annulation_demandee_at, annulation_decision, transporteur:transporteurs(raison_sociale)"),
    admin.from("support_messages").select("id", { count: "exact", head: true }).eq("auteur", "user").is("lu_le", null),
    chargerClients(),
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
  const MF = M.filter((m) => m.statut !== "annulee");

  // ---------- Indicateurs + évolution sur 8 semaines ----------
  const commSemaines = parSemaine(MF, (m) => m.created_at, (m) => Number(m.commission_montant));
  const demSemaines = parSemaine(D, (d) => d.created_at);
  const offSemaines = parSemaine(O, (o) => o.created_at);
  const misSemaines = parSemaine(MF, (m) => m.created_at);
  const debutMois = new Date(); debutMois.setDate(1); debutMois.setHours(0, 0, 0, 0);
  const commMois = MF.filter((m) => new Date(m.created_at) >= debutMois).reduce((s, m) => s + Number(m.commission_montant), 0);
  const commTotal = MF.reduce((s, m) => s + Number(m.commission_montant), 0);
  const demSemaine = D.filter((d) => heures(d.created_at) < 168).length;
  const avecOffre = D.filter((d) => offresDe(d.id).length > 0);

  const kpis = [
    { label: "Commissions générées", valeur: eur(Math.round(commTotal)), delta: `${eur(Math.round(commMois))} ce mois-ci`, spark: commSemaines },
    { label: "Demandes actives", valeur: String(actives.length), delta: `${demSemaine} déposée${demSemaine > 1 ? "s" : ""} cette semaine`, spark: demSemaines },
    { label: "Conversion demande → mission", valeur: D.length ? `${Math.round((MF.length / D.length) * 100)} %` : "—", delta: `${MF.length} mission${MF.length > 1 ? "s" : ""} sur ${D.length} demandes`, spark: misSemaines },
    { label: "Offres par demande", valeur: avecOffre.length ? (O.length / avecOffre.length).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "—", delta: `${Math.round((avecOffre.length / Math.max(D.length, 1)) * 100)} % des demandes ont une offre`, spark: offSemaines },
  ];

  // ---------- À faire ----------
  const taches: Tache[] = [];
  for (const d of actives.filter((x) => x.statut === "ouverte")) {
    const od = offresDe(d.id);
    const j = joursAvant(d.date_aller);
    if (od.length === 0 && heures(d.created_at) > 48 && (!d.relance_transporteurs_le || heures(d.relance_transporteurs_le) > 72)) {
      taches.push({ priorite: j <= 21 ? 1 : 2, titre: `#${d.numero} ${ville(d.depart_adresse)} → ${ville(d.arrivee_adresse)}, aucune offre depuis ${Math.floor(heures(d.created_at) / 24)} jours`, detail: `Départ le ${jour(d.date_aller)} · ${d.passagers} passagers`, lien: `/admin/demandes/${d.id}`, action: "Relancer les transporteurs" });
    }
    if (od.length > 0) {
      const derniere = od.map((o) => o.created_at).sort().reverse()[0];
      if (heures(derniere) > 72 && (!d.relancee_le || heures(d.relancee_le) > 120)) {
        taches.push({ priorite: j <= 30 ? 1 : 3, titre: `#${d.numero} ${ville(d.depart_adresse)} → ${ville(d.arrivee_adresse)}, ${od.length} offre${od.length > 1 ? "s" : ""} sans choix`, detail: `${d.client?.nom ?? "Client"} · dernière offre ${depuis(derniere)}`, lien: `/admin/demandes/${d.id}`, action: "Relancer le client" });
      }
    }
  }
  const annulDemandes = D.filter((d) => d.annulation_demandee_at && !d.annulation_decision);
  const dossiers = M.filter(aTraiter);
  const enAttente = T.filter((t) => t.statut === "en_attente");
  const suppressions = T.filter((t) => !!t.suppression_demandee_at);
  if (annulDemandes.length + dossiers.length) taches.push({ priorite: 1, titre: `${annulDemandes.length + dossiers.length} annulation(s) ou litige(s) à trancher`, detail: "Le client ou le transporteur attend votre décision", lien: "/admin/litiges", action: "Traiter" });
  if (supportNonLus) taches.push({ priorite: 1, titre: `${supportNonLus} message${supportNonLus > 1 ? "s" : ""} support non lu${supportNonLus > 1 ? "s" : ""}`, detail: "Bulle Aide des clients et transporteurs", lien: "/admin/support", action: "Répondre" });
  if (enAttente.length) taches.push({ priorite: 2, titre: `${enAttente.length} transporteur${enAttente.length > 1 ? "s" : ""} à valider`, detail: "Inscriptions en attente de vérification", lien: "#transporteurs", action: "Vérifier" });
  taches.sort((a, b) => a.priorite - b.priorite);
  const POINT = { 1: "#E5484D", 2: "#F5A524", 3: "#C9C7C2" } as const;

  // ---------- Pipeline ----------
  const colonnes = [
    { id: "sans", titre: "Sans offre", items: actives.filter((d) => d.statut === "ouverte" && offresDe(d.id).length === 0) },
    { id: "offres", titre: "Offres reçues", items: actives.filter((d) => d.statut === "ouverte" && offresDe(d.id).length > 0) },
    { id: "confirmee", titre: "Confirmées", items: actives.filter((d) => d.statut === "confirmee") },
  ].map((c) => ({ ...c, items: [...c.items].sort((a, b) => (a.date_aller < b.date_aller ? -1 : 1)) }));

  const prenom = ((moi?.nom as string | null) ?? "").split(/\s+/)[0] || "";
  const derniersClients = clients.slice(0, 6);

  return (
    <main>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="text-[12.5px] text-[#9A9893] first-letter:uppercase">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="crm-titre mt-0.5">Bonjour{prenom ? ` ${prenom}` : ""}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/facturation" className="btn btn-ghost py-2 px-3.5">Facturation</Link>
          <Link href="/admin/demandes" className="btn btn-primary py-2 px-3.5">Toutes les demandes</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4">
        {kpis.map((k) => (
          <div key={k.label} className="crm-kpi">
            <p className="text-[12px] text-[#77756F] font-medium">{k.label}</p>
            <p className="crm-kpi-num mt-1.5">{k.valeur}</p>
            <p className="text-[11.5px] text-[#77756F] mt-1.5">{k.delta}</p>
            <Sparkline valeurs={k.spark} />
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1.3fr_1fr] gap-3.5 mb-4">
        <section className="crm-panel">
          <div className="crm-panel-h">
            <p className="crm-panel-t">À faire aujourd&apos;hui</p>
            <span className="text-[12px] text-[#9A9893]">{taches.length} action{taches.length > 1 ? "s" : ""}</span>
          </div>
          {taches.length === 0 ? (
            <p className="px-[18px] py-6 text-[13px] text-[#77756F]">Rien en attente, tout est à jour.</p>
          ) : (
            <ul>
              {taches.map((t, i) => (
                <li key={i} className="flex items-center gap-3 px-[18px] py-3 border-b border-[#F4F3F0] last:border-0">
                  <span className="w-2 h-2 rounded-full flex-none" style={{ background: POINT[t.priorite] }} />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold truncate">{t.titre}</p>
                    <p className="text-[12px] text-[#8A8882] truncate">{t.detail}</p>
                  </div>
                  <Link href={t.lien} className="ml-auto btn btn-ghost py-1.5 px-2.5 text-[12px] whitespace-nowrap">{t.action}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="crm-panel">
          <div className="crm-panel-h">
            <p className="crm-panel-t">Derniers clients actifs</p>
            <Link href="/admin/clients" className="text-[12px] text-[#77756F] hover:text-[#111]">Voir tout →</Link>
          </div>
          <ul>
            {derniersClients.map((c) => {
              const [bg, fg] = teinte(c.nom ?? c.id);
              return (
                <li key={c.id} className="border-b border-[#F4F3F0] last:border-0">
                  <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-3 px-[18px] py-2.5 hover:bg-[#FAFAF8]">
                    <span className="w-8 h-8 rounded-lg grid place-items-center text-[11px] font-bold flex-none" style={{ background: bg, color: fg }}>{initiales(c.nom)}</span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold truncate">{c.nom || "Sans nom"}</span>
                      <span className="block text-[11.5px] text-[#9A9893] truncate">{ORGANISMES.find((o) => o.id === c.organisme)?.label ?? "Type non précisé"} · {depuis(c.derniereActivite)}</span>
                    </span>
                    <span className={`pill ml-auto ${STATUT_CLIENT[c.statut].classe}`}>{STATUT_CLIENT[c.statut].label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="crm-panel mb-4">
        <div className="crm-panel-h">
          <p className="crm-panel-t">Pipeline des demandes</p>
          <span className="text-[12px] text-[#9A9893]">triées par date de départ</span>
        </div>
        <div className="grid md:grid-cols-3 gap-3 p-3.5">
          {colonnes.map((c) => (
            <div key={c.id} className="min-w-0">
              <p className="flex justify-between text-[12px] font-semibold text-[#77756F] mb-2 px-0.5">{c.titre}<span className="font-normal">{c.items.length}</span></p>
              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-0.5">
                {c.items.map((d) => {
                  const od = offresDe(d.id).map((o) => Number(o.prix_ttc));
                  const j = joursAvant(d.date_aller);
                  const mis = M.find((m) => m.demande_id === d.id);
                  return (
                    <Link key={d.id} href={`/admin/demandes/${d.id}`} className="crm-deal block">
                      <div className="flex justify-between gap-2">
                        <p className="font-semibold text-[12.5px] truncate">{ville(d.depart_adresse)} → {ville(d.arrivee_adresse)}</p>
                        <span className={`pill ${j <= 14 ? "bg-[#FDE8E4] text-[#C2410C]" : "bg-[#F1F0ED] text-[#55534E]"}`}>J-{j}</span>
                      </div>
                      <p className="text-[11.5px] text-[#8A8882] mt-0.5 truncate">
                        #{d.numero} · {d.client?.nom ?? "Client"} · {d.passagers} pax · {jour(d.date_aller)}
                      </p>
                      {mis ? (
                        <p className="text-[11.5px] mt-1">{mis.transporteur?.raison_sociale ?? "Transporteur"}</p>
                      ) : od.length > 0 ? (
                        <p className="text-[11.5px] mt-1">{od.length} offre{od.length > 1 ? "s" : ""} · dès <span className="text-[#1A7F52] font-semibold">{eur(Math.min(...od))}</span></p>
                      ) : null}
                    </Link>
                  );
                })}
                {c.items.length === 0 && <p className="text-[12.5px] text-[#9A9893] px-1 py-3">Aucune demande.</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="transporteurs" className="crm-panel">
        <div className="crm-panel-h">
          <p className="crm-panel-t">Transporteurs à valider</p>
          <span className={`pill ${enAttente.length ? "bg-[#FDE8E4] text-[#C2410C]" : "bg-[#F1F0ED] text-[#55534E]"}`}>{enAttente.length}</span>
        </div>
        {enAttente.length === 0 ? (
          <p className="px-[18px] py-6 text-[13px] text-[#77756F]">Aucun transporteur en attente de validation.</p>
        ) : (
          <ul>
            {enAttente.map((t) => (
              <li key={t.id} className="px-[18px] py-3.5 border-b border-[#F4F3F0] last:border-0 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold">
                    <Link href={`/admin/transporteurs/${t.id}`} className="hover:underline">{t.raison_sociale}</Link>
                    <span className="ml-2 pill bg-[#E8EEFF] text-[#3451B2]">{SECTEURS[t.secteur] ?? t.secteur}</span>
                  </p>
                  <p className="text-[12px] text-[#8A8882] mt-1">
                    SIREN {t.siren} · Titre {t.licence_transport} · Siège {t.departement_siege} · Zones {t.zones.map((z: { departement: string }) => z.departement).join(", ") || "—"}
                  </p>
                  <p className="text-[12px] text-[#8A8882] mt-0.5">{t.profile?.nom ?? "—"} · {t.profile?.telephone ?? "—"} · inscrit le {jour(t.created_at)}</p>
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
          <div className="px-[18px] py-3 border-t border-[#F0EFEC] text-[13px]">
            <span className="pill bg-[#FDE8E4] text-[#C2410C] mr-2">Suppression demandée</span>
            {suppressions.map((t, i) => (
              <span key={t.id}>{i > 0 && ", "}<Link href={`/admin/transporteurs/${t.id}`} className="font-semibold hover:underline">{t.raison_sociale}</Link></span>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
