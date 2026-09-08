import { createClient } from "@/lib/supabase/server";
import { getReseauxTous } from "@/lib/reseaux";
import { ReseauxForm } from "./reseaux-client";

export default async function AdminReseauxPage() {
  const supabase = await createClient();
  const initial = await getReseauxTous();

  return (
    <main>
        <p className="eyebrow mb-4">Administration</p>
        <h1 className="h-display text-4xl mb-10">Réseaux sociaux.</h1>
        <ReseauxForm initial={initial} />
    </main>
  );
}
