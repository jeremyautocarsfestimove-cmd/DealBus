import { createClient } from "@/lib/supabase/server";
import { RESEAUX_DEF, type Reseau, type ReseauCle } from "@/lib/reseaux-def";

// Fonctions SERVEUR uniquement (Server Components / route handlers).
// Un réseau n'est affiché que si son URL est renseignée.

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