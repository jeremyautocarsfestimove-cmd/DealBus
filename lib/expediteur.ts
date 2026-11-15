// Expéditeur des e-mails automatiques du site (codes, offres, messages, factures).
// Les campagnes gardent leur propre expéditeur (CAMPAGNE_FROM).
// Les réponses des destinataires arrivent sur la boîte contact.
export const NOTIF_FROM = process.env.NOTIF_FROM ?? "DealBus <notifications@dealbus.fr>";
export const REPLY_TO = "contact@dealbus.fr";
