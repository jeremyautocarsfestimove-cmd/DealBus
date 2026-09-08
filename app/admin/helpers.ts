// Constantes et formatteurs partagés par les pages d'administration.
export const SECTEURS: Record<string, string> = {
  autocariste: "Autocariste", vtc: "VTC", taxi: "Taxi", loti: "LOTI",
};

export const MODE_TAG: Record<string, string> = {
  devis: "bg-bleunuit text-bleunuit-fort", enchere: "bg-vert-dim text-vert",
};

export const TAG_ALERTE = "bg-[#FCEBE4] text-[#C2410C]";

export const eur = (n: number) => Number(n).toLocaleString("fr-FR") + " €";
export const jour = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

/** Un dossier d'annulation est « à traiter » tant qu'un admin ne l'a pas tranché. */
export function aTraiter(m: { statut: string; client_confirmation?: string | null }) {
  return m.statut === "litige" || (m.statut === "annulee" && m.client_confirmation !== "bien_annule");
}
