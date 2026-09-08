import { createClient } from "@/lib/supabase/server";
import { ProspectionClientsClient } from "./prospection-clients-client";

export const metadata = { title: "Prospection clients — Administration" };

export default async function ProspectionClientsPage() {
  const supabase = await createClient();
  return (
    <ProspectionClientsClient />
  );
}
