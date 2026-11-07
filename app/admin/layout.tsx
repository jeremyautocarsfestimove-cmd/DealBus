import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { AdminMenu } from "./AdminMenu";
import { aTraiter } from "./helpers";
import Link from "next/link";
import { lireMaintenance } from "@/lib/maintenance";
import "./admin.css";

export const metadata = { title: "Administration — DealBus" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("profiles").select("role, nom").eq("id", user.id).maybeSingle()
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

  const [{ count: aValider }, { data: dossiers }, { count: supportNonLus }, { count: demandesAnnul }, maintenance, { count: nbClients }, { count: nbOuvertes }] = await Promise.all([
    supabase.from("transporteurs").select("id", { count: "exact", head: true }).eq("statut", "en_attente"),
    supabase.from("missions").select("statut, client_confirmation, annulation_demandee_at, annulation_decision").or("statut.in.(annulee,litige),and(annulation_demandee_at.not.is.null,annulation_decision.is.null)"),
    supabase.from("support_messages").select("id", { count: "exact", head: true }).eq("auteur", "user").is("lu_le", null),
    supabase.from("demandes").select("id", { count: "exact", head: true }).not("annulation_demandee_at", "is", null).is("annulation_decision", null),
    lireMaintenance(true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
    supabase.from("demandes").select("id", { count: "exact", head: true }).eq("statut", "ouverte"),
  ]);

  const nom = (me?.nom as string | null) || user?.email || "Administrateur";
  const initiales = nom.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((m) => m[0]?.toUpperCase()).join("") || "A";

  return (
    <div className="adm min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <AdminMenu
        alertes={{
          transporteurs: aValider ?? 0,
          litiges: (dossiers ?? []).filter(aTraiter).length + (demandesAnnul ?? 0),
          support: supportNonLus ?? 0,
          maintenance: maintenance.actif ? 1 : 0,
        }}
        compteurs={{ clients: nbClients ?? 0, demandes: nbOuvertes ?? 0 }}
        admin={{ nom, initiales }}
      />
      <div className="min-w-0">
        {maintenance.actif && (
          <div className="bg-[#C2410C] text-white px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <span><strong>Site en travaux.</strong> Les visiteurs voient la page d&apos;attente ; vous voyez le site normalement.</span>
            <Link href="/admin/parametres" className="underline underline-offset-2">Rouvrir le site</Link>
          </div>
        )}
        <div className="admin-crm max-w-[1320px] px-5 lg:px-8 py-6 lg:py-7">{children}</div>
      </div>
    </div>
  );
}
