// Version courante des CGU. À incrémenter à chaque modification de fond :
// les transporteurs devront accepter à nouveau avant d'accéder aux demandes.
export const CGU_VERSION = "1.1";
export const CGU_DATE = "7 novembre 2026";

// Texte d'engagement enregistré avec chaque offre (preuve mission par mission)
export const ENGAGEMENT_OFFRE = (taux: number, commission: number) =>
  `En envoyant cette offre, j'accepte de régler à DealBus, si le client me choisit et une fois le transport effectué, une commission de ${taux} % du prix TTC de la mission, soit ${commission.toLocaleString("fr-FR")} € TTC, conformément aux articles 12 et 14 des CGU (version ${CGU_VERSION}).`;
