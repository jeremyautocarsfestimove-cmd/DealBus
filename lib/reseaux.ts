import { createClient } from "@/lib/supabase/server";

// Réseaux sociaux configurables depuis l'admin (table parametres, clés reseau_*).
// Un réseau n'est affiché que si son URL est renseignée.

export const RESEAUX_DEF = [
  { cle: "reseau_facebook", nom: "Facebook", placeholder: "https://www.facebook.com/…" },
  { cle: "reseau_instagram", nom: "Instagram", placeholder: "https://www.instagram.com/…" },
  { cle: "reseau_linkedin", nom: "LinkedIn", placeholder: "https://www.linkedin.com/company/…" },
  { cle: "reseau_tiktok", nom: "TikTok", placeholder: "https://www.tiktok.com/@…" },
  { cle: "reseau_youtube", nom: "YouTube", placeholder: "https://www.youtube.com/@…" },
  { cle: "reseau_x", nom: "X", placeholder: "https://x.com/…" },
] as const;

export type ReseauCle = (typeof RESEAUX_DEF)[number]["cle"];
export type Reseau = { cle: ReseauCle; nom: string; href: string };

export async function getReseauxActifs(): Promise<Reseau[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parametres")
    .select("cle, valeur")
    .like("cle", "reseau_%");
  const map = new Map((data ?? []).map((p) => [p.cle, p.valeur]));
  return RESEAUX_DEF.flatMap((r) => {
    const href = (map.get(r.cle) ?? "").trim();
    return href ? [{ cle: r.cle, nom: r.nom, href }] : [];
  });
}

export async function getReseauxTous(): Promise<Record<ReseauCle, string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parametres")
    .select("cle, valeur")
    .like("cle", "reseau_%");
  const map = new Map((data ?? []).map((p) => [p.cle, p.valeur ?? ""]));
  return Object.fromEntries(RESEAUX_DEF.map((r) => [r.cle, map.get(r.cle) ?? ""])) as Record<ReseauCle, string>;
}
