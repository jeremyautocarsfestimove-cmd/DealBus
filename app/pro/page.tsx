import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contexteTransporteur, eur, jourCourt, heureFr, ville, dateFuture, joursAvant } from "@/lib/pro";
import { analyser, ORGANISMES, fmtDuree, gabaritPour } from "@/lib/assistant-demande";
import { pointsMarche } from "@/lib/calibration-serveur";
import { fourchetteDepuisDevis } from "@/lib/calibration-prix";
import { InscriptionTransporteur } from "./InscriptionTransporteur";
import { DemanderSuppression } from "./pro-actions";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function ProPage() {
  const ctx = await contexteTransporteur();

  if (!ctx) {
    return (
      <main className="max-w-2xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">Espace transporteur</p>
        <h1 className="h-display text-4xl mb-4">Devenir partenaire.</h1>
        <p className="text-blanc-dim mb-8">Inscription gratuite. Votre titre d&apos;exercice et votre RC Pro sont vérifiés manuellement avant l&apos;accès aux demandes.</p>
        <InscriptionTransporteur />
      </main>
    );
  }
  const { user, transporteur, compteurs } = ctx;
  if (!transporteur) {
    return (
      <main className="max-w-2xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">Espace transporteur</p>
        <h1 className="h-display text-4xl mb-4">Devenir partenaire.</h1>
        <p className="text-blanc-dim mb-8">Inscription gratuite. Votre titre d&apos;exercice et votre RC Pro sont vérifiés manuellement avant l&apos;accès aux demandes.</p>
        <InscriptionTransporteur />
      </main>
    );
  }
  if (transporteur.statut !== "valide") {
    return (
      <main className="max-w-2xl mx-auto px-7 py-14">
        <h1 className="h-display text-4xl mb-4">{transporteur.statut === "suspendu" ? "Compte suspendu." : "Compte en cours de validation."}</h1>
        <p className="text-blanc-dim mb-8">
          {transporteur.statut === "suspendu"
            ? "Votre accès aux demandes est suspendu. Contactez-nous pour en savoir plus."
            : "Nos équipes vérifient votre titre d'exercice et votre RC Pro. Vous recevrez un email dès l'activation de votre accès aux demandes."}
        </p>
        <DemanderSuppression transporteurId={user.id} dejaDemandee={transporteur.suppression_demandee_at ?? null} />
      </main>
    );
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const [{ data: leads }, { data: zones }, { data: mesOffres }, { data: missions }, { data: nonLus }] = await Promise.all([
    supabase.from("demandes").select("*").eq("statut", "ouverte").order("date_aller", { ascending: true }),
    supabase.from("transporteur_zones").select("departement").eq("transporteur_id", user.id),
    supabase.from("offres").select("demande_id, statut").eq("transporteur_id", user.id),
    supabase.from("missions").select("prix_final, commission_montant, statut, facturation, demande:demandes(date_aller)").eq("transporteur_id", user.id),
    supabase.from("messages").select("demande_id").eq("transporteur_id", user.id).neq("auteur_id", user.id).is("lu_le", null),
  ]);
  const mesZones = new Set(((zones ?? []) as any[]).map((z) => z.departement));
  const dejaRepondu = new Set(((mesOffres ?? []) as any[]).map((o) => o.demande_id));
  const nonLusPar = new Map<string, number>();
  for (const m of (nonLus ?? []) as any[]) nonLusPar.set(m.demande_id, (nonLusPar.get(m.demande_id) ?? 0) + 1);

  const now = Date.now();
  const L = ((leads ?? []) as any[]).filter((d) => dateFuture(d.date_aller) && !(d.mode === "enchere" && d.enchere_fin && new Date(d.enchere_fin).getTime() <= now) && !dejaRepondu.has(d.id));

  // Nombre de transporteurs ayant répondu (compte seulement, jamais les prix) + repère de marché
  const { data: offresToutes } = L.length ? await admin.from("offres").select("demande_id").in("demande_id", L.map((d) => d.id)) : { data: [] as any[] };
  const nbOffres = new Map<string, number>();
  for (const o of (offresToutes ?? []) as any[]) nbOffres.set(o.demande_id, (nbOffres.get(o.demande_id) ?? 0) + 1);
  const points = await pointsMarche().catch(() => []);

  const enrichies = L.map((d) => {
    const km = d.distance_km ? Number(d.distance_km) : null;
    const a = analyser({ type_trajet: d.type_trajet, km, date_aller: d.date_aller, heure_aller: d.heure_aller ? String(d.heure_aller).slice(0, 5) : "", date_retour: d.date_retour ?? "", heure_retour: d.heure_retour ? String(d.heure_retour).slice(0, 5) : "", passagers: d.passagers, vehicule_utilise_sur_place: !!d.vehicule_utilise_sur_place });
    const rep = km ? fourchetteDepuisDevis(points, km, d.type_trajet, gabaritPour(d.passagers)?.nbVehicules ?? 1) : null;
    const nature: "simple" | "sejour" | "journee" = d.type_trajet === "aller_simple" ? "simple" : a.nuits > 0 ? "sejour" : "journee";
    return { d, km, a, rep, nature, invitation: !mesZones.has(d.depart_departement ?? ""), nb: nbOffres.get(d.id) ?? 0 };
  });

  const liste = enrichies;

  const M = (missions ?? []) as any[];
  const MF = M.filter((m) => m.statut !== "annulee");
  const ca = MF.reduce((s, m) => s + Number(m.prix_final), 0);
  const dues = MF.filter((m) => m.facturation !== "payee").reduce((s, m) => s + Number(m.commission_montant), 0);
  const prochaine = MF.map((m) => m.demande?.date_aller).filter((x) => x && dateFuture(x)).sort()[0];
  const offresConsultees = ((mesOffres ?? []) as any[]).filter((o) => o.statut === "consultee").length;
  const invitations = enrichies.filter((e) => e.invitation).length;

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="h-display text-4xl">Bonjour, {transporteur.raison_sociale}</h1>
          <p className="text-blanc-dim mt-1.5">
            {compteurs!.demandes > 0
              ? `${compteurs!.demandes} demande${compteurs!.demandes > 1 ? "s" : ""} à chiffrer. Les plus proches de la date de départ sont en haut.`
              : "Aucune demande ouverte pour l'instant dans vos zones."}
            {compteurs!.messages > 0 && <> <Link href="/pro/offres" className="font-semibold text-[#B26A00] hover:underline">{compteurs!.messages} message{compteurs!.messages > 1 ? "s" : ""} client non lu{compteurs!.messages > 1 ? "s" : ""}</Link>.</>}
          </p>
        </div>
        <Link href="/pro/profil" className="btn btn-ghost py-2 px-3.5">Mes zones et véhicules</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="pro-kpi"><p>Demandes à chiffrer</p><b>{compteurs!.demandes}</b><small>{invitations ? `dont ${invitations} sur invitation` : "dans vos zones"}</small></div>
        <div className="pro-kpi"><p>Offres en attente de réponse</p><b>{compteurs!.offres}</b><small>{offresConsultees ? `${offresConsultees} consultée${offresConsultees > 1 ? "s" : ""} par le client` : "aucune consultée pour l'instant"}</small></div>
        <div className="pro-kpi"><p>Missions à venir</p><b>{compteurs!.missions}</b><small>{prochaine ? `prochaine le ${jourCourt(prochaine)}` : "aucune planifiée"}</small></div>
        <div className="pro-kpi"><p>CA signé via DealBus</p><b>{eur(ca)}</b><small>commissions dues : {eur(dues)}</small></div>
      </div>

      <div className="card p-0 overflow-hidden">
        {liste.map(({ d, km, a, rep, nature, invitation, nb }) => {
          const j = joursAvant(d.date_aller);
          const msgs = nonLusPar.get(d.id) ?? 0;
          const badges: { t: string; c: string }[] = [];
          if (nature !== "simple" && d.sur_place_repondu) badges.push({ t: d.vehicule_utilise_sur_place ? "Car sur place" : "Dépose puis reprise", c: "bg-[#F1F0ED] text-[#55534E]" });
          if (d.equipements?.includes("soute")) badges.push({ t: "Bagages en soute", c: "bg-[#F1F0ED] text-[#55534E]" });
          if (d.equipements?.includes("toilettes")) badges.push({ t: "Toilettes", c: "bg-[#F1F0ED] text-[#55534E]" });
          if (a.deuxConducteurs) badges.push({ t: "2 conducteurs probables", c: "bg-[#FDE8E4] text-[#C2410C]" });
          if ((a.gabarit?.nbVehicules ?? 1) > 1) badges.push({ t: `${a.gabarit!.nbVehicules} cars`, c: "bg-[#FDE8E4] text-[#C2410C]" });
          return (
            <div key={d.id} className={`pro-lead ${invitation ? "bg-[#FFFCF5]" : ""}`}>
              <div className="min-w-0">
                <p className="pro-route">
                  <Link href={`/pro/leads/${d.id}`} className="hover:underline">{ville(d.depart_adresse)}<i>→</i>{ville(d.arrivee_adresse)}</Link>
                  {invitation && <span className="tag bg-[#FFF4E0] text-[#B26A00] ml-2 align-middle">Sur invitation</span>}
                  {d.mode === "enchere" && <span className="tag-enchere ml-2 align-middle">Enchère</span>}
                  {msgs > 0 && <span className="tag bg-[#F5A524] text-[#111] ml-2 align-middle">{msgs} message{msgs > 1 ? "s" : ""}</span>}
                </p>
                <div className="pro-meta">
                  <span><b>{jourCourt(d.date_aller)}</b>{d.heure_aller ? ` ${heureFr(d.heure_aller)}` : ""}{nature === "sejour" ? ` → ${jourCourt(d.date_retour)} · ${a.nuits} nuit${a.nuits > 1 ? "s" : ""}` : nature === "journee" ? " · journée" : " · aller simple"}</span>
                  <span><b>{d.passagers}</b> passagers</span>
                  {km && <span>{km} km{a.routeMin ? ` · ${fmtDuree(a.routeMin)}` : ""}</span>}
                  {d.organisme && <span>{ORGANISMES.find((o) => o.id === d.organisme)?.label}</span>}
                </div>
                {badges.length > 0 && <div className="flex gap-1.5 flex-wrap mt-2">{badges.map((b) => <span key={b.t} className={`tag ${b.c}`}>{b.t}</span>)}</div>}
              </div>
              <div className="text-[12px] text-[#77756F]">
                Repère marché
                <b className="block text-[14px] text-[#111] font-semibold">{rep ? `${eur(rep.min)} – ${eur(rep.max)}` : "—"}</b>
                {nb > 0 ? `${nb} transporteur${nb > 1 ? "s ont" : " a"} répondu` : "aucune offre pour l'instant"}
              </div>
              <div className="md:text-right">
                <Link href={`/pro/leads/${d.id}`} className={`btn ${j <= 7 || invitation || nb === 0 ? "btn-primary" : "btn-ghost"} py-2 px-3.5`}>Faire une offre</Link>
                <small className="block text-[11.5px] text-[#9A9893] mt-1.5">{j <= 0 ? "Départ aujourd'hui" : j === 1 ? "Départ demain" : `Départ dans ${j} jours`}{nb === 0 ? " · vous seriez le premier" : ""}</small>
              </div>
            </div>
          );
        })}
        {liste.length === 0 && <p className="px-5 py-10 text-center text-blanc-dim">Aucune demande ouverte pour l&apos;instant.</p>}
      </div>
    </>
  );
}
