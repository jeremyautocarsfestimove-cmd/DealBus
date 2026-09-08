import { createClient } from "@/lib/supabase/server";
import { ProspectionClient } from "./prospection-client";

export const metadata = { title: "Prospection — Administration" };

export default async function ProspectionPage() {
  const supabase = await createClient();
  return (
    <ProspectionClient />
  );
}
