import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { getReseauxTous } from "@/lib/reseaux";
import { ReseauxForm } from "./reseaux-client";

export default async function AdminReseauxPage() {
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

  const initial = await getReseauxTous();

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-7 py-14">
        <p className="eyebrow mb-4">Administration</p>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
          <h1 className="h-display text-4xl">Réseaux sociaux.</h1>
          <a href="/admin" className="btn-ghost">← Pilotage</a>
        </div>
        <ReseauxForm initial={initial} />
      </main>
    </>
  );
}
