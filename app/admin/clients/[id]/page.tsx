import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { createAdminClient } from "@/lib/supabase/admin";
import { exigerAdmin, depuis, STATUT_CLIENT, type StatutClient } from "@/lib/admin-crm";
import { demandeActive, libelleStatut } from "@/lib/demandes";
import { ORGANISMES } from "@/lib/assistant-demande";
import { EcrireMessage } from "../../ecrire-message";
import { eur, jour } from "../../helpers";

export const metadata = { title: "Fiche client — Administration" };

const BUDGETS: Record<string, string> = {
  moins_1000: "Moins de 1 000 €", "1000_2000": "1 000 à 2 000 €", "2000_3000": "2 000 à 3 000 €",
  plus_3000: "Plus de 3 000 €", inconnu: "Ne sait pas",
};

type Evenement = { date: string; titre: string; detail?: string; lien?: string; ton?: "ok" | "alerte" | "neutre" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function FicheClientPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await exigerAdmin())) return null;
  const { id } = await params;
  const admin = createAdminClient();

  const { data: profil } = await admin.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!profil) notFound();

  const [{ data: auth }, { data: demandes }, { data: missions }, { data: avis }, { data: convs }] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from("demandes").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    admin.from("missions").select("*, transporteur:transporteurs(raison_sociale)").eq("client_id", id).order("created_at", { ascending: false }),
    admin.from("avis").select("*, transporteur:transporteurs(raison_sociale)").eq("client_id", id),
    admin.from("support_conversations").select("*, messages:support_messages(auteur, contenu, created_at)").eq("user_id", id).order("updated_at", { ascending: false }),
  ]);

  const D = (demandes ?? []) as any[];
  const M = (missions ?? []) as any[];
  const A = (avis ?? []) as any[];
  const C = (convs ?? []) as any[];

  const [{ data: offres }, { data: msgs }] = D.length
    ? await Promise.all([
        admin.from("offres").select("demande_id, prix_ttc, created_at, statut").in("demande_id", D.map((d) => d.id)),
        admin.from("messages").select("demande_id, auteur_role, created_at").in("demande_id", D.map((d) => d.id)),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];
  const O = (offres ?? []) as any[];
  const offresDe = (dId: string) => O.filter((o) => o.demande_id === dId).map((o) => Number(o.prix_ttc));

  const MA = M.filter((m) => m.statut !== "annulee");
  const actives = D.filter(demandeActive).length;
  const statut: StatutClient = MA.length ? "client" : actives ? "en_cours" : D.length ? "inactif" : "prospect";
  const derniereConnexion = auth?.user?.last_sign_in_at ?? null;
  const organismes = [...new Set(D.map((d) => d.organisme).filter(Boolean))];
  const budgets = [...new Set(D.map((d) => d.budget).filter((b) => b && b !== "inconnu"))];

  // ---------- Historique ----------
  const ev: Evenement[] = [{ date: profil.created_at, titre: "Création du compte", ton: "neutre" }];
  for (const d of D) {
    ev.push({ date: d.created_at, titre: `Demande #${d.numero} déposée`, detail: `${d.depart_adresse} → ${d.arrivee_adresse}`, lien: `/admin/demandes/${d.id}` });
    const od = O.filter((o) => o.demande_id === d.id).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    if (od.length) ev.push({ date: od[0].created_at, titre: `Première offre reçue sur #${d.numero}`, detail: `${od.length} offre${od.length > 1 ? "s" : ""} au total` });
    if (d.relancee_le) ev.push({ date: d.relancee_le, titre: `Relance client sur #${d.numero}`, detail: `${d.nb_relances} relance${d.nb_relances > 1 ? "s" : ""}` });
    if (d.annulation_demandee_at) ev.push({ date: d.annulation_demandee_at, titre: `Annulation demandée sur #${d.numero}`, detail: d.annulation_motif ?? undefined, ton: "alerte" });
  }
  for (const m of M) ev.push({ date: m.created_at, titre: `Offre acceptée · ${m.transporteur?.raison_sociale ?? "transporteur"}`, detail: eur(Number(m.prix_final)), ton: "ok" });
  for (const a of A) ev.push({ date: a.created_at, titre: `Avis ${a.note}/5 · ${a.transporteur?.raison_sociale ?? ""}`, detail: a.commentaire ?? undefined, ton: "ok" });
  for (const c of C) ev.push({ date: c.created_at, titre: c.ouverte_par === "admin" ? "Message de DealBus" : "Demande d'aide du client", detail: c.sujet ?? c.messages?.[0]?.contenu?.slice(0, 90) });
  ev.sort((a, b) => (a.date < b.date ? 1 : -1));

  const nbMsgs = (msgs ?? []).length;
  const kpis = [
    { num: String(D.length), label: `Demande${D.length > 1 ? "s" : ""} · ${actives} active${actives > 1 ? "s" : ""}` },
    { num: String(O.length), label: "Offres reçues" },
    { num: String(MA.length), label: "Missions" },
    { num: MA.length ? eur(MA.reduce((s, m) => s + Number(m.prix_final), 0)) : "—", label: "Volume transport" },
    { num: MA.length ? eur(Math.round(MA.reduce((s, m) => s + Number(m.commission_montant), 0))) : "—", label: "Commissions" },
    { num: String(nbMsgs), label: "Messages transporteurs" },
  ];

  return (
    <main>
      <BackButton href="/admin/clients" className="mb-5" />

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="crm-titre">{profil.nom || "Client sans nom"}</h1>
            <span className={`pill ${STATUT_CLIENT[statut].classe}`}>{STATUT_CLIENT[statut].label}</span>
          </div>
          <p className="font-mono text-[12.5px] text-blanc-dim mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span>{profil.email ?? auth?.user?.email ?? "—"}</span>
            <span>{profil.telephone ?? "pas de téléphone"}</span>
            <span className="text-blanc-faint">client depuis le {jour(profil.created_at)}</span>
          </p>
        </div>
        <EcrireMessage userId={id} label="Écrire au client" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="crm-kpi">
            <p className="crm-kpi-num">{k.num}</p>
            <p className="crm-kpi-lbl">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          {/* Demandes */}
          <section className="crm-panel">
            <div className="crm-panel-h"><p className="crm-panel-t">Demandes</p><span className="font-mono text-[11px] text-blanc-faint">{D.length}</span></div>
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead><tr><th>#</th><th>Trajet</th><th>Départ</th><th className="text-right">Pax</th><th>Statut</th><th className="text-right">Offres</th><th></th></tr></thead>
                <tbody>
                  {D.map((d) => {
                    const p = offresDe(d.id);
                    return (
                      <tr key={d.id}>
                        <td className="font-mono text-blanc-faint">#{d.numero}</td>
                        <td className="max-w-[340px]">
                          <p className="truncate">{d.depart_adresse} → {d.arrivee_adresse}</p>
                          <p className="font-mono text-[11px] text-blanc-faint">
                            {d.type_trajet === "aller_simple" ? "aller simple" : d.type_trajet === "circuit" ? "circuit" : "aller-retour"}
                            {d.distance_km ? ` · ${Number(d.distance_km)} km` : ""}
                            {d.organisme ? ` · ${ORGANISMES.find((o) => o.id === d.organisme)?.label ?? d.organisme}` : ""}
                          </p>
                        </td>
                        <td className="font-mono text-[12px] whitespace-nowrap">{jour(d.date_aller)}</td>
                        <td className="text-right font-mono">{d.passagers}</td>
                        <td><span className={`pill ${demandeActive(d) ? "bg-ambre-dim text-ambre-fort" : d.statut === "confirmee" ? "bg-vert-dim text-vert" : "bg-asphalte-3 text-blanc-faint"}`}>{libelleStatut(d)}</span></td>
                        <td className="text-right font-mono whitespace-nowrap">
                          {p.length ? <>{p.length} · <span className="text-vert">{eur(Math.min(...p))}</span></> : <span className="text-blanc-faint">aucune</span>}
                        </td>
                        <td className="text-right"><Link href={`/admin/demandes/${d.id}`} className="font-mono text-[11px] uppercase tracking-wider text-ambre-fort hover:underline">Ouvrir →</Link></td>
                      </tr>
                    );
                  })}
                  {D.length === 0 && <tr><td colSpan={7} className="text-center text-blanc-dim py-8">Aucune demande pour l&apos;instant : compte créé sans dépôt.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          {/* Missions */}
          {M.length > 0 && (
            <section className="crm-panel">
              <div className="crm-panel-h"><p className="crm-panel-t">Missions</p><span className="font-mono text-[11px] text-blanc-faint">{M.length}</span></div>
              <div className="overflow-x-auto">
                <table className="crm-table">
                  <thead><tr><th>Transporteur</th><th>Demande</th><th className="text-right">Prix</th><th className="text-right">Commission</th><th>Statut</th><th>Facturation</th></tr></thead>
                  <tbody>
                    {M.map((m) => {
                      const d = D.find((x) => x.id === m.demande_id);
                      return (
                        <tr key={m.id}>
                          <td><Link href={`/admin/transporteurs/${m.transporteur_id}`} className="font-semibold hover:text-ambre-fort">{m.transporteur?.raison_sociale ?? "—"}</Link></td>
                          <td className="font-mono text-[12px]">{d ? <Link href={`/admin/demandes/${d.id}`} className="hover:underline">#{d.numero} · {jour(d.date_aller)}</Link> : "—"}</td>
                          <td className="text-right font-mono">{eur(Number(m.prix_final))}</td>
                          <td className="text-right font-mono">{eur(Number(m.commission_montant))}</td>
                          <td><span className={`pill ${m.statut === "annulee" || m.statut === "litige" ? "bg-[#FCEBE4] text-[#C2410C]" : "bg-vert-dim text-vert"}`}>{m.statut}</span></td>
                          <td className="font-mono text-[12px] text-blanc-dim">{m.facturation ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Support */}
          {C.length > 0 && (
            <section className="crm-panel">
              <div className="crm-panel-h"><p className="crm-panel-t">Échanges avec DealBus</p><Link href="/admin/support" className="font-mono text-[11px] uppercase tracking-wider text-ambre-fort hover:underline">Support →</Link></div>
              <ul>
                {C.map((c) => {
                  const dernier = [...(c.messages ?? [])].sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1))[0];
                  return (
                    <li key={c.id} className="px-4 py-3 border-b border-ligne last:border-0 text-[13px]">
                      <div className="flex justify-between gap-3">
                        <p className="font-semibold">{c.sujet ?? (c.ouverte_par === "admin" ? "Message de DealBus" : "Demande d'aide")}</p>
                        <span className={`pill ${c.statut === "ouverte" ? "bg-ambre-dim text-ambre-fort" : "bg-asphalte-3 text-blanc-faint"}`}>{c.statut}</span>
                      </div>
                      {dernier && <p className="text-blanc-dim mt-1 line-clamp-2">{dernier.auteur === "admin" ? "Vous : " : "Client : "}{dernier.contenu}</p>}
                      <p className="font-mono text-[11px] text-blanc-faint mt-1">{c.messages?.length ?? 0} message{(c.messages?.length ?? 0) > 1 ? "s" : ""} · {depuis(c.updated_at)}</p>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="crm-panel">
            <div className="crm-panel-h"><p className="crm-panel-t">Profil</p></div>
            <dl className="px-4 py-3 text-[13px] grid grid-cols-[120px_1fr] gap-x-3 gap-y-2.5">
              <dt className="text-blanc-faint">Email</dt><dd className="break-all">{profil.email ?? auth?.user?.email ?? "—"}</dd>
              <dt className="text-blanc-faint">Email vérifié</dt><dd>{auth?.user?.email_confirmed_at ? `oui, le ${jour(auth.user.email_confirmed_at)}` : "non"}</dd>
              <dt className="text-blanc-faint">Téléphone</dt><dd>{profil.telephone ?? "—"}</dd>
              <dt className="text-blanc-faint">Inscription</dt><dd>{jour(profil.created_at)}</dd>
              <dt className="text-blanc-faint">Dernière connexion</dt><dd>{derniereConnexion ? `${jour(derniereConnexion)} (${depuis(derniereConnexion)})` : "—"}</dd>
              <dt className="text-blanc-faint">Type de groupe</dt><dd>{organismes.length ? organismes.map((o) => ORGANISMES.find((x) => x.id === o)?.label ?? o).join(", ") : "—"}</dd>
              <dt className="text-blanc-faint">Budget indiqué</dt><dd>{budgets.length ? budgets.map((b) => BUDGETS[b] ?? b).join(", ") : "—"}</dd>
              <dt className="text-blanc-faint">Avis laissés</dt><dd>{A.length ? A.map((a) => `${a.note}/5`).join(", ") : "—"}</dd>
            </dl>
          </section>

          <section className="crm-panel">
            <div className="crm-panel-h"><p className="crm-panel-t">Historique</p><span className="font-mono text-[11px] text-blanc-faint">{ev.length}</span></div>
            <ol className="px-4 py-4 relative">
              {ev.map((e, i) => (
                <li key={i} className="relative pl-5 pb-4 last:pb-0 text-[12.5px]">
                  <span className={`absolute left-0 top-1 w-2 h-2 rounded-full ${e.ton === "ok" ? "bg-vert" : e.ton === "alerte" ? "bg-[#C2410C]" : e.ton === "neutre" ? "bg-blanc-faint" : "bg-ambre"}`} />
                  {i < ev.length - 1 && <span className="absolute left-[3.5px] top-3 bottom-0 w-px bg-ligne" />}
                  <p className="font-semibold leading-snug">{e.lien ? <Link href={e.lien} className="hover:underline">{e.titre}</Link> : e.titre}</p>
                  {e.detail && <p className="text-blanc-dim leading-snug mt-0.5 line-clamp-2">{e.detail}</p>}
                  <p className="font-mono text-[10.5px] text-blanc-faint mt-0.5">{new Date(e.date).toLocaleDateString("fr-FR")} · {depuis(e.date)}</p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
