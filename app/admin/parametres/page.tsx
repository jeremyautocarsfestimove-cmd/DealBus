import { createClient } from "@/lib/supabase/server";
import { MAINTENANCE_DEFAUT, type Maintenance } from "@/lib/maintenance";
import { MaintenanceClient } from "./maintenance-client";

export const metadata = { title: "Paramètres du site — Administration" };
export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("parametres_site").select("valeur, maj_le").eq("cle", "maintenance").maybeSingle();
  const v = (data?.valeur ?? {}) as Partial<Maintenance>;
  const maintenance: Maintenance = {
    actif: v.actif === true,
    message: typeof v.message === "string" ? v.message : MAINTENANCE_DEFAUT.message,
    retour: typeof v.retour === "string" ? v.retour : "",
  };

  return (
    <>
      <p className="eyebrow mb-3">Réglages</p>
      <h1 className="h-display text-4xl mb-8">Paramètres du site</h1>
      <MaintenanceClient initial={maintenance} majLe={data?.maj_le ?? null} />
    </>
  );
}
