// Envoi d'une vague de prospection, partagé entre l'admin (bouton « Envoyer
// une vague ») et l'envoi automatique du lundi au vendredi (cron).
import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CAMPAGNE_FROM, REPLY_TO } from "@/lib/expediteur";
import { enTetesDesinscription, lienDesinscription, TABLE, type Liste } from "@/lib/desinscription";
import { sujetProspection, texteProspection, htmlProspection } from "@/lib/prospection";
import { sujetProspectionClient, texteProspectionClient, htmlProspectionClient } from "@/lib/prospection-clients";

export type ResultatVague = { envoyes: number; erreurs: number; note?: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function envoyerVague(admin: SupabaseClient<any, any, any>, liste: Liste, limite: number): Promise<ResultatVague> {
  if (!process.env.RESEND_API_KEY) return { envoyes: 0, erreurs: 0, note: "RESEND_API_KEY non configurée" };
  const table = TABLE[liste];
  const colonnes = liste === "clients" ? "id, email, nom, departement" : "id, email, societe, departement";
  const { data: cibles } = await admin
    .from(table).select(colonnes)
    .eq("statut", "a_contacter")
    .order("created_at", { ascending: true })
    .limit(limite);

  if (!cibles?.length) return { envoyes: 0, erreurs: 0, note: "aucun prospect à contacter" };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const contenu = (p: any) => liste === "clients"
    ? { subject: sujetProspectionClient(p), text: texteProspectionClient(p), html: htmlProspectionClient(p) }
    : { subject: sujetProspection(p), text: texteProspection(p), html: htmlProspection(p) };

  let envoyes = 0, erreurs = 0;
  // Lots de 50 via l'API batch (évite les timeouts serverless)
  for (let i = 0; i < cibles.length; i += 50) {
    const lot = cibles.slice(i, i + 50) as any[];
    const ids = lot.map((p) => p.id);
    try {
      const { data, error } = await resend.batch.send(
        lot.map((p) => ({
          from: CAMPAGNE_FROM,
          to: p.email,
          replyTo: REPLY_TO,
          ...contenu({ ...p, lien: lienDesinscription(liste, p.id) }),
          headers: enTetesDesinscription(liste, p.id),
        }))
      );
      if (error) throw new Error(error.message);
      await admin.from(table).update({ statut: "envoye", envoye_le: new Date().toISOString() }).in("id", ids);
      envoyes += data?.data?.length ?? lot.length;
    } catch (e) {
      await admin.from(table).update({ statut: "erreur", erreur: (e as Error).message }).in("id", ids);
      erreurs += lot.length;
    }
  }
  return { envoyes, erreurs };
}
