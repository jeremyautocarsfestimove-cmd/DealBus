// ============================================================
// Assistant « Aide » : réponses automatiques par mots-clés.
// Aucune IA externe : rapide, gratuit, maîtrisé. Si rien ne correspond,
// la bulle propose d'écrire à DealBus (support humain).
// ============================================================

export type Role = "client" | "transporteur" | "visiteur";

export type Faq = {
  id: string;
  pour: Role[];                 // à qui cette réponse s'adresse
  mots: string[];               // mots-clés (minuscules, sans accents)
  question: string;             // formulation proposée en raccourci
  reponse: string;              // texte affiché (retours à la ligne autorisés)
  lien?: { label: string; href: string };
};

export const FAQ: Faq[] = [
  {
    id: "fonctionnement", pour: ["client", "visiteur"],
    mots: ["comment", "marche", "fonctionne", "principe", "etapes", "debut", "commencer"],
    question: "Comment ça marche ?",
    reponse: "Vous décrivez votre trajet en 2 minutes, sans donner vos coordonnées. Les transporteurs vérifiés de votre région reçoivent la demande anonymisée et répondent chacun avec une offre ferme. Vous comparez, vous retenez une offre, ou vous ne donnez pas suite.",
    lien: { label: "Déposer une demande", href: "/demande" },
  },
  {
    id: "gratuit", pour: ["client", "visiteur"],
    mots: ["gratuit", "prix", "cout", "coute", "frais", "payer", "combien", "tarif"],
    question: "Est-ce gratuit ?",
    reponse: "Oui, totalement côté client : déposer une demande, recevoir des offres, comparer, choisir ou renoncer, rien n'est facturé. DealBus se rémunère par une commission versée par le transporteur, uniquement s'il remporte la mission.",
  },
  {
    id: "anonymat", pour: ["client", "transporteur", "visiteur"],
    mots: ["anonyme", "anonymat", "coordonnees", "telephone", "email", "identite", "nom", "contact"],
    question: "Qui voit mes coordonnées ?",
    reponse: "Personne avant la sélection. Les transporteurs voient le trajet, les dates, le nombre de passagers et vos précisions, jamais votre nom, votre email ni votre téléphone. Quand vous retenez une offre, les coordonnées sont échangées avec ce seul transporteur.",
  },
  {
    id: "delai", pour: ["client"],
    mots: ["delai", "quand", "combien de temps", "attendre", "reponse", "reponses", "offres", "recevoir", "aucune", "pas d'offre", "toujours rien"],
    question: "Quand vais-je recevoir des offres ?",
    reponse: "Les premières offres arrivent généralement dans la journée, parfois sous 48 h si votre demande part un week-end. Si vous n'avez rien après 48 h, vérifiez que la demande est complète (horaires, passagers, précisions) : les demandes complètes reçoivent deux fois plus d'offres. Vous pouvez aussi nous écrire ici, nous relançons les transporteurs de votre zone.",
  },
  {
    id: "choisir", pour: ["client"],
    mots: ["choisir", "retenir", "comparer", "meilleure", "selection", "selectionner", "accepter", "valider"],
    question: "Comment choisir une offre ?",
    reponse: "Comparez le prix, ce qui est inclus (hébergement du chauffeur, péages, toilettes…), le véhicule et son année, la note du transporteur et ses conditions d'acompte. Posez vos questions par la messagerie sous chaque offre. Quand vous cliquez « Retenir cette offre », les autres sont déclinées automatiquement et les coordonnées sont échangées.",
  },
  {
    id: "paiement", pour: ["client"],
    mots: ["paiement", "payer", "acompte", "reglement", "facture", "virement", "carte", "cheque", "mandat"],
    question: "Comment se passe le paiement ?",
    reponse: "Directement avec le transporteur retenu, selon ses conditions (en général un acompte à la réservation, le solde avant le départ). DealBus n'encaisse rien côté client. Les établissements publics peuvent régler par mandat administratif : précisez-le dans la demande, les transporteurs en tiennent compte.",
  },
  {
    id: "modifier", pour: ["client"],
    mots: ["modifier", "changer", "erreur", "corriger", "supprimer", "annuler ma demande", "clore", "date", "horaire", "passagers"],
    question: "Je me suis trompé dans ma demande",
    reponse: "Tant qu'aucune offre n'a été reçue, vous pouvez modifier votre demande depuis « Mes demandes » (bouton « Modifier ma demande »). Dès qu'une offre est arrivée, elle n'est plus modifiable, pour que les offres restent comparables : clôturez-la (« Clore sans donner suite ») et déposez-en une nouvelle.",
    lien: { label: "Mes demandes", href: "/mes-demandes" },
  },
  {
    id: "annulation", pour: ["client"],
    mots: ["annulation", "annuler", "imprevu", "rembourse", "remboursement"],
    question: "Que se passe-t-il en cas d'annulation ?",
    reponse: "Une annulation, de votre côté comme de celui du transporteur, est une demande motivée que DealBus valide ou refuse ; tant qu'elle n'est pas validée, la mission reste prévue. Depuis votre demande : « Demander l'annulation », expliquez le motif, l'autre partie est informée et vous recevez la décision par email. Les conditions financières sont celles de l'offre du transporteur.",
  },
  {
    id: "messagerie", pour: ["client", "transporteur"],
    mots: ["messagerie", "message", "question", "ecrire", "parler", "contacter le transporteur", "contacter le client", "bloque", "refuse"],
    question: "Comment contacter l'autre partie ?",
    reponse: "Par la messagerie de la demande : côté client sous chaque offre, côté transporteur sur la fiche de la demande. Chaque message est aussi envoyé par email. Avant la sélection, les coordonnées et les prix hors offre sont refusés automatiquement, c'est la règle de la plateforme.",
  },
  {
    id: "commission", pour: ["transporteur", "visiteur"],
    mots: ["commission", "pourcentage", "combien", "rémunération", "remuneration", "frais", "abonnement", "facture dealbus"],
    question: "Quelle est la commission ?",
    reponse: "9 % jusqu'à 2 000 € TTC, 7 % de 2 001 à 5 000 €, 5 % au-delà. Elle n'est due que si vous remportez la mission, jamais d'abonnement ni de frais fixes. DealBus vous l'indique sur chaque mission et vous la facture après la prestation.",
  },
  {
    id: "repondre", pour: ["transporteur"],
    mots: ["repondre", "offre", "devis", "proposer", "tir unique", "modifier mon offre", "retirer"],
    question: "Comment répondre à une demande ?",
    reponse: "Ouvrez la demande depuis « Nouveaux leads » : la fiche calcule le haut-le-pied depuis votre dépôt, les journées, le nombre de conducteurs et un prix conseillé. Vous publiez une seule offre, définitive : prix TTC tout compris, véhicule, ce qui est inclus, conditions. Posez vos questions au client par la messagerie avant de chiffrer si un point est flou.",
    lien: { label: "Mes leads", href: "/pro" },
  },
  {
    id: "parametres", pour: ["transporteur"],
    mots: ["depot", "haut-le-pied", "haut le pied", "calculateur", "cout de revient", "tarifs", "parametres", "marge"],
    question: "À quoi servent les paramètres de devis ?",
    reponse: "Dans « Mon profil → Paramètres de devis », renseignez l'adresse de votre dépôt et vos coûts (km, heure, nuit, immobilisation, marge). Chaque fiche de demande calcule alors votre haut-le-pied réel et pré-remplit le calculateur. Vous restez libre du prix final.",
    lien: { label: "Mon profil", href: "/pro" },
  },
  {
    id: "validation", pour: ["transporteur"],
    mots: ["validation", "valide", "compte", "attente", "documents", "licence", "rc pro", "assurance", "inscription", "verification"],
    question: "Mon compte est en attente de validation",
    reponse: "DealBus vérifie le titre d'exercice (licence de transport) et l'attestation RC Pro avant d'ouvrir l'accès aux demandes, en général sous 48 h ouvrées. Si vos documents sont incomplets, vous recevez un email. Vous pouvez nous écrire ici pour accélérer.",
  },
  {
    id: "zones", pour: ["transporteur"],
    mots: ["zone", "zones", "departement", "departements", "region", "aucun lead", "pas de demande", "ne vois pas"],
    question: "Je ne vois aucune demande",
    reponse: "Les demandes diffusées sont celles dont le départ est dans vos zones (départements) choisies dans « Mon profil → Zones ». Élargissez vos zones pour voir plus de leads. Les demandes passées ou déjà attribuées n'apparaissent plus.",
  },
  {
    id: "enchere", pour: ["client", "transporteur", "visiteur"],
    mots: ["enchere", "encheres", "retour a vide", "retours a vide", "retour à vide"],
    question: "Où sont les enchères et les retours à vide ?",
    reponse: "Ces deux modules sont en pause : DealBus se concentre sur la demande de devis, avec un assistant qui aide le client à bien décrire son trajet et le transporteur à chiffrer juste. Ils reviendront quand le volume le justifiera.",
  },
  {
    id: "contact", pour: ["client", "transporteur", "visiteur"],
    mots: ["humain", "quelqu'un", "conseiller", "support", "aide", "joindre", "dealbus", "telephone dealbus", "mail dealbus"],
    question: "Parler à quelqu'un de DealBus",
    reponse: "Écrivez-nous directement depuis l'onglet « DealBus » de cette bulle : vous recevez la réponse ici et par email. Nous répondons en général dans la journée, du lundi au vendredi.",
  },
];

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function faqPour(role: Role): Faq[] {
  return FAQ.filter((f) => f.pour.includes(role));
}

// Meilleure réponse pour une question libre, ou null si rien ne colle.
export function repondre(question: string, role: Role): Faq | null {
  const q = ` ${sansAccents(question).replace(/[^a-z0-9' ]+/g, " ")} `;
  let meilleur: { f: Faq; score: number } | null = null;
  for (const f of faqPour(role)) {
    let score = 0;
    for (const m of f.mots) {
      const mot = sansAccents(m);
      if (q.includes(` ${mot} `) || (mot.includes(" ") && q.includes(mot))) score += mot.includes(" ") ? 2 : 1;
    }
    if (score > 0 && (!meilleur || score > meilleur.score)) meilleur = { f, score };
  }
  return meilleur?.f ?? null;
}
