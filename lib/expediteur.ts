// Expéditeur des e-mails automatiques du site (codes, offres, messages, factures).
// Les campagnes gardent leur propre expéditeur (CAMPAGNE_FROM).
// Les réponses des destinataires arrivent sur la boîte contact.
export const NOTIF_FROM = process.env.NOTIF_FROM ?? "DealBus <notifications@dealbus.fr>";
export const REPLY_TO = "contact@dealbus.fr";

// Campagnes de l'admin (prospection, relances) : sous-domaine dédié,
// pour que leur réputation n'affecte pas les e-mails automatiques.
export const CAMPAGNE_FROM = process.env.CAMPAGNE_FROM ?? "Jeremy de DealBus <contact@news.dealbus.fr>";
