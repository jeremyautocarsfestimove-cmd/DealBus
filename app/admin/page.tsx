import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { exigerAdmin, depuis, ville } from "@/lib/admin-crm";
import { demandeActive } from "@/lib/demandes";
import { eur, aTraiter, SECTEURS, jour } from "./helpers";
import { TransporteurActions, EnvoyerEmailTransporteur } from "./actions";
import { ActionRapide } from "./action-rapide";

export const metadata = { title: "Aujourd'hui — Administration" };

/* eslint-disable @typescript-eslint/no-explicit-any */
type Tache = {
  priorite: 1 | 2 | 3; titre: string; detail: string; etiquette: string;
  lien: string; action?: string; rapide?: { type: "transporteurs" | "client"; demandeId: string };
};

const heures = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3600000;
const joursAvant = (date: string) => Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86400000);
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export default async function AujourdhuiPage() {
  if (!(await exigerAdmin())) return null;
  const admin = createAdminClient();

  const [{ data: transporteurs }, { data: demandes }, { data: missions }, { count: supportNonLus }, { data: factures }] = await Promise.all([
    admin.from("transporteurs").select("*, profile:profiles(nom, telephone), zones:transporteur_zones(departement)").order("created_at", { ascending: false }),
    admin.from("demandes").select("id, numero, statut, depart_adresse, arrivee_adresse, date_aller, date_retour, passagers, created_at, relancee_le, relance_transporteurs_le, annulation_demandee_at, annulation_decision, client:profiles(nom)"),
    admin.from("missions").select("demande_id, statut, commission_montant, created_at, client_confirmation, annulation_demandee_at, annulation_decision"),
    admin.from("support_messages").select("id", { count: "exact", head: true }).eq("auteur", "user").is("lu_le", null),
    admin.from("factures").select("statut, emise_le, montant_ttc"),
  ]);

  const T = (transporteurs ?? []) as any[];
  const D = (demandes ?? []) as any[];
  const M = (missions ?? []) as any[];
  const F = (factures ?? []) as any[];
  const { data: offres } = D.length
    ? await admin.from("offres").select("demande_id, created_at").in("demande_id", D.map((d) => d.id))
    : { data: [] as any[] };
  const O = (offres ?? []) as any[];
  const offresDe = (id: string) => O.filter((o) => o.demande_id === id);
  const actives = D.filter(demandeActive);
  const ouvertes = actives.filter((d) => d.statut === "ouverte");

  // ---------- Quatre chiffres ----------
  const sansOffre48 = ouvertes.filter((d) => offresDe(d.id).length === 0 && heures(d.created_at) > 48);
  const debutMois = new Date(); debutMois.setDate(1); debutMois.setHours(0, 0, 0, 0);
  const commMois = M.filter((m) => m.statut !== "annulee" && new Date(m.created_at) >= debutMois).reduce((s, m) => s + Number(m.commission_montant), 0);
  const enRetard = F.filter((f) => f.statut === "emise" && Date.now() - new Date(f.emise_le).getTime() > 15 * 86400000);
  const montantRetard = enRetard.reduce((s, f) => s + Number(f.montant_ttc), 0);

  const kpis = [
    { label: "Demandes actives", valeur: String(actives.length), alerte: false, lien: "/admin/demandes" },
    { label: "Sans offre depuis 48 h", valeur: String(sansOffre48.length), alerte: sansOffre48.length > 0, lien: "/admin/demandes" },
    { label: "Commissions du mois", valeur: eur(Math.round(commMois)), alerte: false, lien: "/admin/missions" },
    { label: "Impayées depuis plus de 15 j", valeur: enRetard.length ? `${enRetard.length} · ${eur(Math.round(montantRetard))}` : "0", alerte: enRetard.length > 0, lien: "/admin/facturation" },
  ];

  // ---------- À traiter : une action par ligne ----------
  const taches: Tache[] = [];
  for (const d of ouvertes) {
    const od = offresDe(d.id);
    const j = joursAvant(d.date_aller);
    const trajet = `${ville(d.depart_adresse)} → ${ville(d.arrivee_adresse)}`;
    if (od.length === 0 && heures(d.created_at) > 48 && (!d.relance_transporteurs_le || heures(d.relance_transporteurs_le) > 72)) {
      taches.push({ priorite: j <= 21 ? 1 : 2, titre: `${trajet}, ${d.passagers} passagers`, etiquette: "Sans offre", detail: `#${d.numero} · départ le ${jour(d.date_aller)} · demande reçue ${depuis(d.created_at)}`, lien: `/admin/demandes/${d.id}`, rapide: { type: "transporteurs", demandeId: d.id } });
    }
    if (od.length > 0) {
      const derniere = od.map((o) => o.created_at).sort().reverse()[0];
      if (heures(derniere) > 72 && (!d.relancee_le || heures(d.relancee_le) > 120)) {
        taches.push({ priorite: j <= 30 ? 1 : 3, titre: `${trajet}, ${pluriel(od.length, "offre")} sans choix`, etiquette: "Client silencieux", detail: `#${d.numero} · ${d.client?.nom ?? "Client"} · dernière offre ${depuis(derniere)}`, lien: `/admin/demandes/${d.id}`, rapide: { type: "client", demandeId: d.id } });
      }
    }
  }
  const nbLitiges = D.filter((d) => d.annulation_demandee_at && !d.annulation_decision).length + M.filter(aTraiter).length;
  if (nbLitiges) taches.push({ priorite: 1, titre: `${pluriel(nbLitiges, "annulation")} ou litige à trancher`, etiquette: "Décision attendue", detail: "Le client ou le transporteur attend votre réponse", lien: "/admin/litiges", action: "Traiter" });
  if (supportNonLus) taches.push({ priorite: 1, titre: `${pluriel(supportNonLus, "message")} support à lire`, etiquette: "Support", detail: "Bulle Aide des clients et transporteurs", lien: "/admin/support", action: "Répondre" });
  if (enRetard.length) taches.push({ priorite: 2, titre: `${pluriel(enRetard.length, "facture")} en retard, ${eur(Math.round(montantRetard))}`, etiquette: "Impayée", detail: "Émises depuis plus de 15 jours", lien: "/admin/facturation", action: "Relancer" });
  taches.sort((a, b) => a.priorite - b.priorite);

  const enAttente = T.filter((t) => t.statut === "en_attente");
  const suppressions = T.filter((t) => !!t.suppression_demandee_at);
  const total = taches.length + enAttente.length;
  const TEINTE = { 1: "bg-[#FDE8E4] text-[#C2410C]", 2: "bg-[#FFF1DC] text-[#B26A00]", 3: "bg-[#F1F0ED] text-[#55534E]" } as const;

  return (
    <main>
      <div className="mb-5">
        <p className="text-[12.5px] text-[#9A9893] first-letter:uppercase">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="crm-titre mt-0.5">{total === 0 ? "Aujourd'hui, rien à traiter." : `Aujourd'hui, ${pluriel(total, "chose")} à traiter.`}</h1>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.lien} className="crm-kpi block min-w-0">
            <p className="text-[12px] text-[#77756F] font-medium leading-tight">{k.label}</p>
            <p className={`crm-kpi-num mt-1.5 truncate ${k.alerte ? "!text-[#C2410C]" : ""}`}>{k.valeur}</p>
          </Link>
        ))}
      </div>

      <section className="crm-panel mb-4">
        <div className="crm-panel-h">
          <p className="crm-panel-t">À traiter</p>
        </div>
        {taches.length === 0 ? (
          <p className="px-[18px] py-6 text-[13px] text-[#77756F]">Rien en attente, tout est à jour.</p>
        ) : (
          <ul>
            {taches.map((t, i) => (
              <li key={i} className="adm-ligne">
                <Link href={t.lien} className="min-w-0 block">
                  <p className="text-[14px] font-semibold leading-snug">
                    {t.titre}
                    <span className={`pill ml-2 align-middle whitespace-nowrap ${TEINTE[t.priorite]}`}>{t.etiquette}</span>
                  </p>
                  <p className="text-[12.5px] text-[#8A8882] mt-0.5">{t.detail}</p>
                </Link>
                {t.rapide
                  ? <ActionRapide type={t.rapide.type} demandeId={t.rapide.demandeId} />
                  : <Link href={t.lien} className="btn btn-primary py-2 px-3.5 inline-flex">{t.action}</Link>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {enAttente.length > 0 && (
        <section id="transporteurs" className="crm-panel mb-4">
          <div className="crm-panel-h flex items-center justify-between">
            <p className="crm-panel-t">Transporteurs à vérifier</p>
            <span className="pill bg-[#FDE8E4] text-[#C2410C]">{enAttente.length}</span>
          </div>
          <ul>
            {enAttente.map((t) => (
              <li key={t.id} className="px-[18px] py-3.5 border-b border-[#F4F3F0] last:border-0 flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
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
        </section>
      )}

      {suppressions.length > 0 && (
        <p className="text-[13px] px-1">
          <span className="pill bg-[#FDE8E4] text-[#C2410C] mr-2">Suppression demandée</span>
          {suppressions.map((t, i) => (
            <span key={t.id}>{i > 0 && ", "}<Link href={`/admin/transporteurs/${t.id}`} className="font-semibold hover:underline">{t.raison_sociale}</Link></span>
          ))}
        </p>
      )}
    </main>
  );
}
