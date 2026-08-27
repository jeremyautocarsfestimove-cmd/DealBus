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
    } else if (entity === "mission" && (action === "facturer" || action === "payer")) {
      const { error } = await admin.from("missions")
        .update({ facturation: action === "facturer" ? "facturee" : "payee" })
        .eq("id", id);
      if (error) throw error;
    } else if (entity === "mission" && action === "valider_annulation") {
      // Annulation considérée comme légitime par l'administration.
      // La mission reste annulée et n'est plus traitée comme une commission à facturer.
      const { error } = await admin.from("missions")
        .update({
          statut: "annulee",
          client_confirmation: "bien_annule",
        })
        .eq("id", id);
      if (error) throw error;
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