// Modules mis en suspens — un seul endroit pour les rallumer.
// Les tables, routes API et pages admin restent en place : seules les
// entrées côté client et transporteur sont masquées.
export const FEATURES = {
  enchere: false,   // mode enchère inversée sur les demandes
  retours: false,   // trajets retour à vide publiés par les transporteurs
  calculateur: false, // calculateur de coût de revient dans le formulaire de devis (pas encore au point)
} as const;
