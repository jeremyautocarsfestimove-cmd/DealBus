import { createClient } from "@/lib/supabase/server";
import { SupportAdmin, type ConvAdmin } from "./support-client";

export const metadata = { title: "Support — Administration" };

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const supabase = await createClient();
  const { data: convs } = await supabase.from("support_conversations")
    .select("*, profil:profiles(nom, email, role), demande:demandes(numero)")
    .order("updated_at", { ascending: false }).limit(300);
  const ids = (convs ?? []).map((x: any) => x.id);
  const { data: msgs } = ids.length
    ? await supabase.from("support_messages").select("conversation_id, auteur, contenu, created_at, lu_le").in("conversation_id", ids).order("created_at", { ascending: false })
    : { data: [] };

  const parConv = new Map<string, any[]>();
  for (const m of msgs ?? []) { if (!parConv.has(m.conversation_id)) parConv.set(m.conversation_id, []); parConv.get(m.conversation_id)!.push(m); }

  const conversations: ConvAdmin[] = (convs ?? []).map((x: any) => {
    const liste = parConv.get(x.id) ?? [];
    return {
      id: x.id, user_id: x.user_id, demande_id: x.demande_id, sujet: x.sujet, statut: x.statut, ouverte_par: x.ouverte_par, updated_at: x.updated_at,
      nom: x.profil?.nom ?? null, email: x.profil?.email ?? null, role: x.profil?.role ?? null,
      numero_demande: x.demande?.numero ?? null,
      nonLus: liste.filter((m) => m.auteur === "user" && !m.lu_le).length,
      dernier: liste[0] ? { auteur: liste[0].auteur, contenu: liste[0].contenu, created_at: liste[0].created_at } : null,
    };
  });

  return (
    <main>
      <p className="eyebrow mb-4">Administration</p>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="h-display text-4xl mb-2">Support.</h1>
          <p className="text-sm text-blanc-dim">Messages reçus par la bulle « Aide » et conversations ouvertes par DealBus. Chaque réponse part aussi par email.</p>
        </div>
        <span className={`tag ${conversations.some((x) => x.nonLus) ? "bg-[#FCEBE4] text-[#C2410C]" : "bg-vert-dim text-vert"}`}>
          {conversations.reduce((s, x) => s + x.nonLus, 0)} message{conversations.reduce((s, x) => s + x.nonLus, 0) > 1 ? "s" : ""} non lu{conversations.reduce((s, x) => s + x.nonLus, 0) > 1 ? "s" : ""}
        </span>
      </div>
      <SupportAdmin conversations={conversations} initiale={c ?? null} />
    </main>
  );
}
