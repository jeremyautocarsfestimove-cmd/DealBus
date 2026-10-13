// Mode « site en travaux » — lu par le middleware (edge) et les pages serveur.
// L'état vit dans la table parametres_site (clé "maintenance"), modifiable
// depuis /admin/parametres. Les admins connectés ne sont jamais bloqués.

export type Maintenance = { actif: boolean; message: string; retour: string };

export const MAINTENANCE_DEFAUT: Maintenance = { actif: false, message: "", retour: "" };

// Chemins toujours servis, même en travaux : administration, connexion,
// parcours mot de passe (pour que l'admin puisse se connecter) et la page travaux.
export const CHEMINS_LIBRES = ["/admin", "/login", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/maintenance"];

export function cheminLibre(pathname: string) {
  return CHEMINS_LIBRES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Cache mémoire très court (par instance edge) pour ne pas interroger
// Supabase à chaque requête. 15 s : un basculement est visible quasi aussitôt.
let cache: { valeur: Maintenance; lu: number } | null = null;
const TTL_MS = 15_000;

export async function lireMaintenance(force = false): Promise<Maintenance> {
  if (!force && cache && Date.now() - cache.lu < TTL_MS) return cache.valeur;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return MAINTENANCE_DEFAUT;
  try {
    const res = await fetch(`${base}/rest/v1/parametres_site?cle=eq.maintenance&select=valeur`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return cache?.valeur ?? MAINTENANCE_DEFAUT;
    const rows = (await res.json()) as { valeur?: Partial<Maintenance> }[];
    const v = rows[0]?.valeur ?? {};
    const valeur: Maintenance = {
      actif: v.actif === true,
      message: typeof v.message === "string" ? v.message : "",
      retour: typeof v.retour === "string" ? v.retour : "",
    };
    cache = { valeur, lu: Date.now() };
    return valeur;
  } catch {
    // En cas de doute, on ne bloque jamais le site.
    return cache?.valeur ?? MAINTENANCE_DEFAUT;
  }
}
