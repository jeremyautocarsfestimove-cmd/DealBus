import { envoyer, echap, url } from "@/lib/annulations";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Body = {
  entity: "demande" | "mission" | "avis" | "retour" | "transporteur";
  id: string;
  action: string;
};

export async function POST(req: Request) {
  // Authentification + rôle admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé" }, { status: 403 });
  }

  const { entity, id, action } = (await req.json()) as Body;
  if (!entity || !id || !action) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    if (entity === "demande" && action === "annuler") {
      const { error } = await admin.from("demandes").update({ statut: "annulee" }).eq("id", id);
      if (error) throw error;
    } else if (entity === "demande" && (action === "valider_annulation" || action === "refuser_annulation")) {
      const { data: d } = await admin.from("demandes").select("id, numero, client_id, depart_adresse, arrivee_adresse, annulation_motif").eq("id", id).single();
      if (!d) throw new Error("Demande introuvable");
      const valide = action === "valider_annulation";
      const { error } = await admin.from("demandes")
        .update(valide
          ? { statut: "annulee", annulation_decision: "validee", annulation_decidee_at: new Date().toISOString() }
          : { annulation_decision: "refusee", annulation_decidee_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      if (valide) await admin.from("offres").update({ statut: "non_retenue" }).eq("demande_id", id).in("statut", ["envoyee", "consultee"]);
      const { data: cu } = await admin.auth.admin.getUserById(d.client_id);
      const trajet = `${d.depart_adresse} → ${d.arrivee_adresse}`;
      if (cu?.user?.email) {
        await envoyer(cu.user.email, valide ? `✅ Demande #${d.numero} annulée` : `Annulation refusée — demande #${d.numero}`,
          valide ? "Votre demande est annulée" : "Votre demande d'annulation n'a pas été retenue",
          valide
            ? [`DealBus a validé l'annulation de votre demande <strong>#${d.numero} ${echap(trajet)}</strong>. Les transporteurs ayant répondu en sont informés.`]
            : [`Après examen, DealBus ne valide pas l'annulation de votre demande <strong>#${d.numero} ${echap(trajet)}</strong>. Elle reste ouverte. Pour toute précision, écrivez-nous depuis la bulle Aide.`],
          { label: "Voir ma demande", url: url(`/mes-demandes/${id}`) });
      }
      if (valide) {
        const { data: offres } = await admin.from("offres").select("transporteur_id").eq("demande_id", id);
        for (const o of offres ?? []) {
          const { data: tu } = await admin.auth.admin.getUserById(o.transporteur_id);
          if (tu?.user?.email) await envoyer(tu.user.email, `Demande #${d.numero} annulée par le client`, "Demande annulée",
            [`La demande <strong>#${d.numero} ${echap(trajet)}</strong> sur laquelle vous aviez fait une offre a été annulée par le client, avec validation de DealBus.`, `<strong>Motif :</strong> « ${echap(d.annulation_motif ?? "")} »`]);
        }
      }
    } else if (entity === "mission" && (action === "facturer" || action === "payer")) {
      const { error } = await admin.from("missions")
        .update({ facturation: action === "facturer" ? "facturee" : "payee" })
        .eq("id", id);
      if (error) throw error;
    } else if (entity === "mission" && (action === "valider_annulation" || action === "refuser_annulation")) {
      // Décision sur une demande d'annulation (client ou transporteur).
      const { data: m } = await admin.from("missions")
        .select("id, client_id, transporteur_id, annulation_motif, annulation_demandee_par, annulation_demandee_role, demande:demandes(id, numero, depart_adresse, arrivee_adresse)")
        .eq("id", id).single();
      if (!m) throw new Error("Mission introuvable");
      const valide = action === "valider_annulation";
      const { error } = await admin.from("missions")
        .update(valide
          ? { statut: "annulee", annulee_par: m.annulation_demandee_par, annulee_at: new Date().toISOString(), client_confirmation: "bien_annule", annulation_decision: "validee", annulation_decidee_at: new Date().toISOString() }
          : { annulation_decision: "refusee", annulation_decidee_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const d: any = Array.isArray(m.demande) ? m.demande[0] : m.demande;
      const trajet = d ? `${d.depart_adresse} → ${d.arrivee_adresse}` : "la mission";
      const [{ data: cu }, { data: tu }] = await Promise.all([admin.auth.admin.getUserById(m.client_id), admin.auth.admin.getUserById(m.transporteur_id)]);
      const demandeurRole = m.annulation_demandee_role ?? "transporteur";
      const emailDemandeur = demandeurRole === "client" ? cu?.user?.email : tu?.user?.email;
      const emailAutre = demandeurRole === "client" ? tu?.user?.email : cu?.user?.email;
      if (valide) {
        const paras = [`DealBus a validé l'annulation de la mission <strong>${echap(trajet)}</strong>, demandée par ${demandeurRole === "client" ? "le client" : "le transporteur"}.`, `<strong>Motif :</strong> « ${echap(m.annulation_motif ?? "")} »`];
        if (emailDemandeur) await envoyer(emailDemandeur, `✅ Annulation validée — ${trajet}`, "Annulation validée", paras, { label: "Voir le dossier", url: url(demandeurRole === "client" ? `/mes-demandes/${d?.id ?? ""}` : `/pro/missions/${id}`) });
        if (emailAutre) await envoyer(emailAutre, `🚫 Mission annulée — ${trajet}`, "La mission est annulée", [...paras, demandeurRole === "client" ? "Aucune commission n'est due sur cette mission." : "Votre demande peut être relancée depuis votre espace : les transporteurs de votre zone seront prévenus en priorité."], { label: "Voir le dossier", url: url(demandeurRole === "client" ? `/pro/missions/${id}` : `/mes-demandes/${d?.id ?? ""}`) });
      } else if (emailDemandeur) {
        await envoyer(emailDemandeur, `Annulation refusée — ${trajet}`, "Votre demande d'annulation n'a pas été retenue",
          [`Après examen, DealBus ne valide pas l'annulation de la mission <strong>${echap(trajet)}</strong>. La mission reste prévue aux conditions convenues.`, "Si vous souhaitez apporter des précisions, écrivez-nous depuis la bulle Aide."],
          { label: "Voir le dossier", url: url(demandeurRole === "client" ? `/mes-demandes/${d?.id ?? ""}` : `/pro/missions/${id}`) });
      }
    } else if (entity === "mission" && action === "mettre_litige") {
      // L'annulation est contestée / nécessite un contrôle manuel.
      const { error } = await admin.from("missions")
        .update({ statut: "litige" })
        .eq("id", id);
      if (error) throw error;
    } else if (entity === "mission" && action === "resoudre_annulation") {
      // Résolution d'un litige en faveur de l'annulation.
      const { error } = await admin.from("missions")
        .update({
          statut: "annulee",
          client_confirmation: "bien_annule",
        })
        .eq("id", id);
      if (error) throw error;
    } else if (entity === "mission" && action === "resoudre_realisee") {
      // Le trajet a finalement eu lieu : la commission redevient facturable.
      const { error } = await admin.from("missions")
        .update({
          statut: "terminee_declaree",
          client_confirmation: "a_eu_lieu",
          facturation: "a_facturer",
        })
        .eq("id", id);
      if (error) throw error;
    } else if (entity === "avis" && action === "supprimer") {
      // Suppression + recalcul de la note du transporteur (le trigger ne couvre que l'insert)
      const { data: avis, error: e1 } = await admin
        .from("avis").select("transporteur_id").eq("id", id).single();
      if (e1) throw e1;
      const { error: e2 } = await admin.from("avis").delete().eq("id", id);
      if (e2) throw e2;
      const { data: rest } = await admin
        .from("avis").select("note").eq("transporteur_id", avis.transporteur_id);
      const notes = (rest ?? []).map((a) => a.note);
      await admin.from("transporteurs").update({
        nb_avis: notes.length,
        note_moyenne: notes.length
          ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10
          : null,
      }).eq("id", avis.transporteur_id);
    } else if (entity === "retour" && action === "retirer") {
      const { error } = await admin.from("retours_vide").update({ statut: "annule" }).eq("id", id);
      if (error) throw error;
    } else if (entity === "transporteur" && action === "supprimer") {
      // Suppression définitive : essaie d'abord une suppression complète (compte
      // sans aucun historique). Si des missions/offres/avis/retours existent,
      // ces enregistrements sont protégés (nécessaires à la comptabilité) : on
      // anonymise alors la fiche et on bloque l'accès au compte à la place.
      const { error: deleteErr } = await admin.auth.admin.deleteUser(id);
      if (deleteErr) {
        const { error: anonErr } = await admin.from("transporteurs").update({
          raison_sociale: "Transporteur supprimé",
          siren: "0",
          licence_transport: "—",
          rc_pro_url: null,
          cgv: null,
          statut: "suspendu",
          suppression_demandee_at: null,
        }).eq("id", id);
        if (anonErr) throw anonErr;
        await admin.from("transporteur_zones").delete().eq("transporteur_id", id);
        await admin.from("vehicules").delete().eq("transporteur_id", id);
        const { error: profErr } = await admin.from("profiles").update({
          nom: "Compte supprimé",
          telephone: null,
          email: null,
        }).eq("id", id);
        if (profErr) throw profErr;
        // Bloque définitivement la connexion (l'historique des missions est conservé).
        await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });
      }
    } else {
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}