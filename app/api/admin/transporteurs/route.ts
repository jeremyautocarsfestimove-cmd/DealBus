import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHtml } from "@/lib/email";

const ACTIONS = {
  valider: "valide",
  refuser: "suspendu",
  suspendre: "suspendu",
  reactiver: "valide",
} as const;

export async function POST(req: Request) {
  // 1. Le demandeur doit être connecté ET admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé" }, { status: 403 });
  }

  // 2. Action demandée
  const { id, action } = (await req.json()) as { id: string; action: keyof typeof ACTIONS };
  if (!id || !ACTIONS[action]) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // 3. Mise à jour via service role
  const admin = createAdminClient();
  const { data: transporteur, error } = await admin
    .from("transporteurs")
    .update({
      statut: ACTIONS[action],
      ...(action === "valider" && { valide_at: new Date().toISOString() }),
    })
    .eq("id", id)
    .select("raison_sociale")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 4. Email d'activation (validation uniquement) — non bloquant si Resend absent
  if (action === "valider" && process.env.RESEND_API_KEY) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(id);
      const email = authUser?.user?.email;
      if (email) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM ?? "DealBus <onboarding@resend.dev>",
          to: email,
          subject: "Votre compte transporteur DealBus est activé",
          text: `Le compte de ${transporteur.raison_sociale} est vérifié et activé. Accédez aux demandes : ${process.env.NEXT_PUBLIC_SITE_URL}/pro`,
          html: emailHtml({
            titre: "Votre compte est activé 🎉",
            paragraphes: [
              `Bonne nouvelle : le compte transporteur de <strong>${transporteur.raison_sociale}</strong> vient d'être vérifié par notre équipe.`,
              `Vous avez désormais accès aux demandes de transport de vos zones de chalandise, et vous pouvez publier vos trajets retour à vide.`,
            ],
            cta: { label: "Accéder à mon espace", url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro` },
            note: "Rappel : commission uniquement sur les missions gagnées (9/7/5 % selon le montant, réduite en enchère et sur vos retours à vide), facturée après la prestation. Aucun abonnement, aucun frais d'accès.",
          }),
        });
      }
    } catch {
      // l'échec d'email ne doit pas faire échouer la validation
    }
  }

  return NextResponse.json({ ok: true });
}
