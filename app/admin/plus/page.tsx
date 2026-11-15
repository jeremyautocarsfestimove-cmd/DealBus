import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { exigerAdmin } from "@/lib/admin-crm";
import { lireMaintenance } from "@/lib/maintenance";
import { aTraiter } from "../helpers";

export const metadata = { title: "Plus — Administration" };

export default async function PlusPage() {
  if (!(await exigerAdmin())) return null;
  const admin = createAdminClient();
  const [{ data: dossiers }, { count: demandesAnnul }, { count: supportNonLus }, maintenance] = await Promise.all([
    admin.from("missions").select("statut, client_confirmation, annulation_demandee_at, annulation_decision").or("statut.in.(annulee,litige),and(annulation_demandee_at.not.is.null,annulation_decision.is.null)"),
    admin.from("demandes").select("id", { count: "exact", head: true }).not("annulation_demandee_at", "is", null).is("annulation_decision", null),
    admin.from("support_messages").select("id", { count: "exact", head: true }).eq("auteur", "user").is("lu_le", null),
    lireMaintenance(true),
  ]);
  const litiges = (dossiers ?? []).filter(aTraiter).length + (demandesAnnul ?? 0);

  const tuiles: { href: string; titre: string; detail: string; alerte?: string }[] = [
    { href: "/admin/litiges", titre: "Annulations et litiges", detail: "Décisions à rendre", alerte: litiges ? `${litiges} à traiter` : undefined },
    { href: "/admin/support", titre: "Support", detail: "Messages de la bulle Aide", alerte: supportNonLus ? `${supportNonLus} à lire` : undefined },
    { href: "/admin/messagerie", titre: "Messagerie", detail: "Échanges clients et transporteurs" },
    { href: "/admin/avis", titre: "Avis", detail: "Avis laissés par les clients" },
    { href: "/admin/prospection-clients", titre: "Prospection clients", detail: "Organisateurs de sorties" },
    { href: "/admin/prospection", titre: "Prospection transporteurs", detail: "Autocaristes à inviter" },
    { href: "/admin/reseaux", titre: "Réseaux sociaux", detail: "Publications" },
    { href: "/admin/retours", titre: "Retours à vide", detail: "Trajets proposés" },
    { href: "/admin/parametres", titre: "Paramètres", detail: "Maintenance, distances, Qonto", alerte: maintenance.actif ? "Site en travaux" : undefined },
  ];

  return (
    <main>
      <h1 className="crm-titre mb-5">Plus</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {tuiles.map((t) => (
          <Link key={t.href} href={t.href} className="card adm-tuile min-w-0">
            <p className="text-[14px] font-semibold leading-snug">{t.titre}</p>
            <p className="text-[12.5px] text-[#8A8882] mt-0.5">{t.detail}</p>
            {t.alerte && <span className="pill bg-[#FDE8E4] text-[#C2410C] inline-block mt-2">{t.alerte}</span>}
          </Link>
        ))}
      </div>
    </main>
  );
}
