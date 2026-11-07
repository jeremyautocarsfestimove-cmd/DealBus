import { createClient } from "@/lib/supabase/server";
import { getReseauxTous } from "@/lib/reseaux";
import { ReseauxForm } from "./reseaux-client";

export default async function AdminReseauxPage() {
  const supabase = await createClient();
  const initial = await getReseauxTous();

  return (
    <main>
        <h1 className="crm-titre mb-6">Réseaux sociaux</h1>
        <ReseauxForm initial={initial} />
    </main>
  );
}
