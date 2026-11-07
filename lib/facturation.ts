// Facturation des commissions — pourcentages DealBus inchangés :
// • la commission est due quand l'offre est acceptée ET que le transport est effectué ;
// • une facture par mission, émise le lendemain de la fin du transport (automatique, cron quotidien) ;
// • la commission est un montant TTC (taux × prix TTC de la mission), TVA 20 % récupérable.
// SERVEUR UNIQUEMENT.

import { createAdminClient } from "./supabase/admin";
import { creerClient, creerFacture, envoyerFacture } from "./qonto";

export type MissionAFacturer = {
  id: string;
  transporteurId: string;
  transporteur: string;
  numero: number | null;
  trajet: string;
  dateTransport: string;     // fin du transport (YYYY-MM-DD)
  prixTtc: number;
  taux: number;
  commissionTtc: number;
  erreur: string | null;     // dernière erreur d'émission
};

export const TVA = 0.2;
export const arrondi2 = (n: number) => Math.round(n * 100) / 100;
export const ht = (ttc: number) => arrondi2(ttc / (1 + TVA));

const aujourdhui = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }); // YYYY-MM-DD, heure de Paris

/* eslint-disable @typescript-eslint/no-explicit-any */
// Missions dont le transport est terminé (au plus tard hier) et pas encore facturées
export async function missionsAFacturer(): Promise<MissionAFacturer[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("missions")
    .select("id, transporteur_id, prix_final, commission_taux, commission_montant, statut, facture_id, facturation_erreur, demande:demandes(numero, depart_adresse, arrivee_adresse, date_aller, date_retour), retour:retours_vide(depart_adresse, arrivee_adresse, date_dispo), transporteur:transporteurs(raison_sociale)")
    .is("facture_id", null)
    .in("statut", ["a_venir", "terminee_declaree"]);

  const today = aujourdhui();
  return ((data ?? []) as any[])
    .map((m) => ({
      id: m.id,
      transporteurId: m.transporteur_id,
      transporteur: m.transporteur?.raison_sociale ?? "Transporteur",
      numero: m.demande?.numero ?? null,
      trajet: `${m.demande?.depart_adresse ?? m.retour?.depart_adresse ?? "?"} → ${m.demande?.arrivee_adresse ?? m.retour?.arrivee_adresse ?? "?"}`,
      dateTransport: m.demande ? (m.demande.date_retour || m.demande.date_aller) : m.retour?.date_dispo,
      prixTtc: Number(m.prix_final),
      taux: Number(m.commission_taux),
      commissionTtc: Number(m.commission_montant),
      erreur: m.facturation_erreur ?? null,
    } as MissionAFacturer))
    .filter((m) => m.dateTransport && m.dateTransport < today)
    .sort((a, b) => (a.dateTransport < b.dateTransport ? -1 : 1));
}

// Prochaines factures : transport en cours ou à venir (pour information)
export async function prochainesFactures(jours = 14): Promise<{ id: string; transporteur: string; numero: number | null; dateTransport: string; commissionTtc: number }[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("missions")
    .select("id, commission_montant, demande:demandes(numero, date_aller, date_retour), transporteur:transporteurs(raison_sociale)")
    .is("facture_id", null).in("statut", ["a_venir", "terminee_declaree"]);
  const today = aujourdhui();
  const limite = new Date(Date.now() + jours * 86400000).toISOString().slice(0, 10);
  return ((data ?? []) as any[])
    .map((m) => ({ id: m.id, transporteur: m.transporteur?.raison_sociale ?? "", numero: m.demande?.numero ?? null, dateTransport: m.demande ? (m.demande.date_retour || m.demande.date_aller) : "", commissionTtc: Number(m.commission_montant) }))
    .filter((m) => m.dateTransport >= today && m.dateTransport <= limite)
    .sort((a, b) => (a.dateTransport < b.dateTransport ? -1 : 1));
}

// Émet la facture d'une mission dans Qonto et l'envoie au transporteur.
export async function emettreFacture(m: MissionAFacturer): Promise<{ numero: string | null }> {
  const admin = createAdminClient();
  try {
    const { data: t } = await admin.from("transporteurs")
      .select("id, raison_sociale, siren, depot_adresse, qonto_client_id, profile:profiles(email)")
      .eq("id", m.transporteurId).single();
    const tr = t as any;
    const email = tr?.profile?.email ?? null;
    if (!email) throw new Error("pas d'email sur le compte transporteur");

    let clientId = tr.qonto_client_id as string | null;
    if (!clientId) {
      clientId = await creerClient({ raison_sociale: tr.raison_sociale, siren: tr.siren, email, depot_adresse: tr.depot_adresse });
      await admin.from("transporteurs").update({ qonto_client_id: clientId }).eq("id", tr.id);
    }

    const montantHt = ht(m.commissionTtc);
    const tva = arrondi2(montantHt * TVA);
    const dateFr = new Date(m.dateTransport).toLocaleDateString("fr-FR");
    const fq = await creerFacture({
      clientId, dateEmission: aujourdhui(), debut: m.dateTransport, fin: m.dateTransport,
      intitule: m.numero ? `mission #${m.numero} du ${dateFr}` : `retour à vide du ${dateFr}`,
      lignes: [{
        title: m.numero ? `Commission mission #${m.numero}` : "Commission retour à vide",
        description: `${m.trajet}\nTransport réalisé le ${dateFr}\nPrix de la mission ${m.prixTtc.toLocaleString("fr-FR")} € TTC, commission ${m.taux} % = ${m.commissionTtc.toLocaleString("fr-FR")} € TTC`,
        ht: montantHt,
      }],
    });

    const { data: f, error } = await admin.from("factures").insert({
      mission_id: m.id, transporteur_id: m.transporteurId, date_transport: m.dateTransport, numero: fq.number,
      montant_ht: montantHt, montant_tva: tva, montant_ttc: arrondi2(montantHt + tva), qonto_invoice_id: fq.id,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await admin.from("missions").update({ facture_id: f.id, facturation: "facturee", facturation_erreur: null }).eq("id", m.id);

    await envoyerFacture(fq.id, email, `Facture de commission DealBus${fq.number ? ` ${fq.number}` : ""}`,
      `Bonjour,\n\nVotre transport du ${dateFr}${m.numero ? ` (mission #${m.numero})` : ""} est terminé : veuillez trouver ci-jointe la facture de commission DealBus correspondante.\n\nElle est payable à réception. Merci pour votre confiance.\n\nL'équipe DealBus\ncontact@dealbus.fr`);
    await admin.from("factures").update({ envoyee_le: new Date().toISOString() }).eq("id", f.id);
    return { numero: fq.number };
  } catch (e) {
    await admin.from("missions").update({ facturation_erreur: (e as Error).message.slice(0, 500) }).eq("id", m.id);
    throw e;
  }
}

// Émet toutes les factures dues (utilisé par le cron et le bouton « Tout émettre »)
export async function emettreFacturesDues(): Promise<{ ok: number; erreurs: { mission: string; erreur: string }[] }> {
  const dues = await missionsAFacturer();
  let ok = 0;
  const erreurs: { mission: string; erreur: string }[] = [];
  for (const m of dues) {
    try { await emettreFacture(m); ok++; }
    catch (e) { erreurs.push({ mission: m.numero ? `#${m.numero} (${m.transporteur})` : m.transporteur, erreur: (e as Error).message }); }
  }
  return { ok, erreurs };
}
