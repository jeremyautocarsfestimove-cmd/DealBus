import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { AdminMenu } from "./AdminMenu";
import { aTraiter } from "./helpers";

export const metadata = { title: "Administration — DealBus" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  if (me?.role !== "admin") {
    return (
      <>
        <Nav />
        <main className="max-w-2xl mx-auto px-7 py-24 text-center">
          <h1 className="h-display text-4xl mb-4">Accès réservé.</h1>
          <p className="text-blanc-dim">Cette page est réservée à l&apos;administration DealBus.</p>
        </main>
      </>
    );
  }

  const [{ count: aValider }, { data: dossiers }, { count: supportNonLus }, { count: demandesAnnul }] = await Promise.all([
    supabase.from("transporteurs").select("id", { count: "exact", head: true }).eq("statut", "en_attente"),
    supabase.from("missions").select("statut, client_confirmation, annulation_demandee_at, annulation_decision").or("statut.in.(annulee,litige),and(annulation_demandee_at.not.is.null,annulation_decision.is.null)"),
    supabase.from("support_messages").select("id", { count: "exact", head: true }).eq("auteur", "user").is("lu_le", null),
    supabase.from("demandes").select("id", { count: "exact", head: true }).not("annulation_demandee_at", "is", null).is("annulation_decision", null),
  ]);

  return (
    <>
      <Nav />
      <div className="max-w-[1400px] mx-auto px-5 lg:px-8 pt-8 pb-16 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
        <AdminMenu
          alertes={{
            transporteurs: aValider ?? 0,
            litiges: (dossiers ?? []).filter(aTraiter).length + (demandesAnnul ?? 0),
            support: supportNonLus ?? 0,
          }}
        />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
