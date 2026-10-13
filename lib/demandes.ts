// Une demande est « active » tant que sa date de départ n'est pas passée et
// qu'elle est ouverte ou confirmée. Le reste (date dépassée, close, annulée)
// va aux archives : les listes n'affichent que l'actif par défaut.
export function dateDepassee(d: { date_aller: string; date_retour?: string | null }): boolean {
  const fin = d.date_retour || d.date_aller;
  return new Date(`${fin}T23:59:59`) < new Date();
}

export function demandeActive(d: { statut: string; date_aller: string; date_retour?: string | null }): boolean {
  return (d.statut === "ouverte" || d.statut === "confirmee") && !dateDepassee(d);
}

// Libellé de statut lisible, « expirée » si la date est passée sans suite
export function libelleStatut(d: { statut: string; date_aller: string; date_retour?: string | null }): string {
  if (d.statut === "ouverte" && dateDepassee(d)) return "expirée (date passée)";
  return d.statut;
}
