import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { ProspectionClient } from "./prospection-client";

export const metadata = { title: "Prospection — Administration" };

export default async function ProspectionPage() {
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

  return (
    <>
      <Nav />
      <ProspectionClient />
    </>
  );
}