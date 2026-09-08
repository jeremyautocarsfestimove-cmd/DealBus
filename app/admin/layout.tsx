import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { AdminBar } from "./AdminBar";
import { aTraiter } from "./helpers";

export const metadata = { title: "Administration — DealBus" };

// Le contrôle d'accès et la navigation vivent ici : les pages enfants n'ont
// plus à les répéter, et n'ont plus qu'à charger leurs propres données.
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

  // Deux requêtes légères, juste pour les pastilles d'alerte de la barre.
  const [{ count: aValider }, { data: dossiers }] = await Promise.all([
    supabase.from("transporteurs").select("id", { count: "exact", head: true }).eq("statut", "en_attente"),
    supabase.from("missions").select("statut, client_confirmation").in("statut", ["annulee", "litige"]),
  ]);

  return (
    <>
      <Nav />
      <AdminBar
        alertes={{
          transporteurs: aValider ?? 0,
          litiges: (dossiers ?? []).filter(aTraiter).length,
        }}
      />
      {children}
    </>
  );
}
