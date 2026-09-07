// Helpers de différenciation du contenu des pages géographiques.
// Objectif : chaque page zone porte des blocs calculés à partir de SES propres
// données (trajets, distances, villes) plutôt qu'un gabarit identique partout.

/* ---------------------------------------------------------------------------
   1. Fourchette tarifaire indicative
   Ordre de grandeur constaté sur le marché français pour un autocar 50 places,
   aller-retour dans la journée, hors haute saison. Volontairement présenté
   comme une fourchette large : seul un devis ferme engage un transporteur.
--------------------------------------------------------------------------- */

export type Fourchette = { bas: number; haut: number };

export function estimerTrajet(kmAller: number): Fourchette {
  // Deux composantes, comme dans la structure de coûts réelle d'un autocariste :
  // un forfait de mise à disposition (conducteur, immobilisation du véhicule)
  // qui ne dépend pas de la distance, plus un coût kilométrique (carburant,
  // péages, usure, amortissement). Un modèle purement kilométrique écrase tous
  // les trajets courts sur le même plancher et donne des pages identiques.
  const kmTotal = Math.max(kmAller * 2, 40);
  const FORFAIT_JOURNEE = 450;
  const COUT_KM = 1.55;
  const centre = FORFAIT_JOURNEE + kmTotal * COUT_KM;
  const arrondi = (n: number) => Math.round(n / 10) * 10;
  return {
    bas: arrondi(Math.max(550, centre * 0.85)),
    haut: arrondi(Math.max(750, centre * 1.25)),
  };
}

export function formatEuros(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

/* ---------------------------------------------------------------------------
   2. Rotation déterministe
   Un même slug donne toujours le même résultat (build stable, pas de
   contenu qui bouge d'un déploiement à l'autre), mais deux zones voisines
   ne reçoivent pas la même sélection de questions ni les mêmes formulations.
--------------------------------------------------------------------------- */

export function empreinte(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

export function choisir<T>(slug: string, options: T[], decalage = 0): T {
  return options[(empreinte(slug) + decalage) % options.length];
}

/** Sélectionne `n` éléments distincts d'un pool, de façon stable pour un slug. */
export function selectionner<T>(slug: string, pool: T[], n: number): T[] {
  const h = empreinte(slug);
  const indices: number[] = [];
  let i = 0;
  while (indices.length < Math.min(n, pool.length)) {
    const idx = (h + i * 7 + Math.floor(h / (i + 3))) % pool.length;
    if (!indices.includes(idx)) indices.push(idx);
    i++;
    if (i > pool.length * 6) break;
  }
  for (let j = 0; indices.length < Math.min(n, pool.length); j++) {
    if (!indices.includes(j)) indices.push(j);
  }
  return indices.map((k) => pool[k]);
}

/* ---------------------------------------------------------------------------
   3. Pool de questions fréquentes
   Chaque entrée reçoit le contexte de la zone et produit une question et une
   réponse ancrées sur ses données propres. 5 questions sont tirées du pool
   par page : deux zones n'affichent pas la même FAQ.
--------------------------------------------------------------------------- */

export type ContexteZone = {
  slug: string;
  /** "à Versailles", "dans les Yvelines", "en Normandie" */
  dans: string;
  /** "depuis Versailles", "depuis le département", "depuis la région" */
  depuis: string;
  /** Nom nu : "Versailles", "Yvelines", "Normandie" */
  nom: string;
  /** Trajet type le plus court connu, pour ancrer les exemples de prix */
  trajetCourt?: { vers: string; km: number };
  /** Trajet type le plus long connu */
  trajetLong?: { vers: string; km: number };
  /** Quelques villes ou pôles de la zone */
  poles: string[];
};

export type QuestionFAQ = { q: string; r: string };

const POOL: ((z: ContexteZone) => QuestionFAQ)[] = [
  (z) => ({
    q: `Combien coûte la location d'un autocar ${z.dans} ?`,
    r: z.trajetCourt
      ? `Pour donner un ordre de grandeur : ${z.nom} → ${z.trajetCourt.vers} (environ ${z.trajetCourt.km} km), en aller-retour dans la journée avec un autocar de 50 places, se situe généralement entre ${formatEuros(estimerTrajet(z.trajetCourt.km).bas)} et ${formatEuros(estimerTrajet(z.trajetCourt.km).haut)} tout compris. La fourchette est large parce que le prix dépend de l'amplitude horaire du conducteur, de la saison et du planning du transporteur ce jour-là. C'est précisément ce que la mise en concurrence permet de trancher : sur DealBus, les écarts entre deux offres pour un même trajet atteignent couramment 20 à 30 %.`
      : `Le prix dépend de la distance, de la durée de mise à disposition, de la taille du véhicule et de la saison. Publier votre demande gratuitement reste le moyen le plus rapide d'obtenir des prix fermes et comparables ${dansToDe(z.dans)}.`,
  }),
  (z) => ({
    q: `Combien de temps à l'avance faut-il réserver un bus ${z.dans} ?`,
    r: `Deux à quatre semaines suffisent en période normale. Comptez six à huit semaines pour les samedis de mai et juin, où sorties scolaires de fin d'année et mariages se disputent les mêmes véhicules. En dernière minute, regardez d'abord les retours à vide ${z.depuis} : ce sont des trajets déjà planifiés, proposés à prix réduit.`,
  }),
  (z) => ({
    q: `Quels types de véhicules peut-on réserver ${z.dans} ?`,
    r: `Du minibus 8 places au grand tourisme 63 places, en passant par les midicars 30 places et les autocars 49 à 55 places, les plus courants. Indiquez simplement l'effectif de votre groupe dans la demande : seuls les transporteurs disposant du véhicule adapté répondront, et ils intègrent la soute, la climatisation et les équipements dans leur offre.`,
  }),
  (z) => ({
    q: `Qu'est-ce qu'un retour à vide, et comment en profiter ${z.dans} ?`,
    r: `C'est un trajet qu'un autocar effectue de toute façon sans passagers, après avoir déposé un groupe. Plutôt que de rouler pour rien, le transporteur le publie sur DealBus à prix fixe réduit, et votre groupe réserve le véhicule complet. La contrepartie : la date et l'itinéraire sont imposés. Si vos dates sont souples, c'est de loin le meilleur rapport qualité-prix disponible ${z.depuis}.`,
  }),
  (z) => ({
    q: `Le chauffeur et le carburant sont-ils inclus dans le prix ?`,
    r: `Oui. En France, la location d'autocar s'entend systématiquement avec conducteur professionnel — c'est lui qui garantit le respect des temps de conduite et de repos. Les offres reçues sur DealBus sont des prix TTC tout compris : carburant, péages, frais du conducteur. Restent à votre charge, le cas échéant, les parkings spécifiques, l'hébergement du conducteur sur un séjour et les repas de votre groupe.`,
  }),
  (z) => ({
    q: `Quels transporteurs répondent aux demandes ${z.dans} ?`,
    r: `Les autocaristes définissent eux-mêmes leurs zones d'intervention, par département. Votre demande part donc vers tous les professionnels vérifiés qui couvrent votre secteur de départ — locaux comme limitrophes, ce qui élargit la concurrence. Chaque compte est contrôlé avant d'accéder aux demandes : SIREN, licence de transport de personnes, attestation d'assurance RC Pro.`,
  }),
  (z) => ({
    q: `Peut-on louer un autocar pour plusieurs jours ${z.depuis} ?`,
    r: `Oui : aller simple, aller-retour dans la journée, ou séjour de plusieurs jours avec le véhicule et le conducteur sur place. Sur un séjour, deux postes s'ajoutent au prix kilométrique : l'hébergement du conducteur et les mises à disposition quotidiennes. Précisez le programme dès la demande, les offres seront directement comparables.`,
  }),
  (z) => ({
    q: `Que se passe-t-il si notre groupe doit annuler ?`,
    r: `Les conditions d'annulation appartiennent au transporteur que vous retenez et figurent dans son offre — DealBus n'encaisse jamais votre argent et ne s'interpose pas dans le contrat. En pratique, la plupart des autocaristes appliquent une franchise dégressive selon le délai. Lisez cette clause avant de valider : c'est un critère de comparaison au même titre que le prix.`,
  }),
  (z) => ({
    q: `Comment obtenir le meilleur prix pour un car ${z.dans} ?`,
    r: `Trois leviers, dans l'ordre d'efficacité. Publier tôt, d'abord : un transporteur qui a du planning libre chiffre plus bas qu'un transporteur qui doit sortir un véhicule en extra. Comparer plusieurs offres fermes ensuite, plutôt que d'accepter le premier devis reçu. Surveiller les retours à vide enfin, si vos dates peuvent bouger de quelques jours.`,
  }),
  (z) => ({
    q: `Faut-il prévoir quelque chose de particulier pour un groupe scolaire ?`,
    r: `Le transport de mineurs impose des obligations précises au transporteur : véhicule conforme, liste des passagers, encadrement, et signalisation « transport d'enfants » le cas échéant. Mentionnez-le dans votre demande ${z.depuis} : les autocaristes habitués aux voyages scolaires se positionneront en priorité, et leur offre intégrera ces contraintes plutôt que de les découvrir la veille.`,
  }),
  (z) => ({
    q: `Peut-on embarquer à plusieurs endroits ${z.dans} ?`,
    r: `Oui, et c'est fréquent — ${z.poles.slice(0, 3).join(", ")} par exemple. Chaque arrêt supplémentaire allonge néanmoins l'amplitude du conducteur, qui est réglementée : indiquez tous vos points d'embarquement dès la demande pour que les prix reçus soient fermes et non révisés ensuite.`,
  }),
  (z) => ({
    q: `L'offre reçue est-elle un prix ferme ou une estimation ?`,
    r: `Un prix ferme. La règle du jeu sur DealBus interdit le marchandage : chaque transporteur répond en un seul envoi, avec son meilleur tarif et le véhicule qu'il engage. C'est ce qui rend les offres réellement comparables, contrairement aux devis obtenus par téléphone où chacun garde de la marge de négociation.`,
  }),
];

function dansToDe(dans: string): string {
  return dans;
}

export function faqZone(z: ContexteZone, n = 5): QuestionFAQ[] {
  return selectionner(z.slug, POOL, n).map((f) => f(z));
}

/* ---------------------------------------------------------------------------
   4. Variantes d'accroche
--------------------------------------------------------------------------- */

export const ACCROCHES_TITRE_TRAJETS = [
  "Les trajets les plus demandés",
  "Ce que réservent les groupes du secteur",
  "Destinations types et ordres de prix",
  "Où partent les cars d'ici",
];

export const ACCROCHES_TITRE_SAISON = [
  "Quand réserver, et à quel prix",
  "La saison, poste par poste",
  "Le calendrier local de la demande",
  "Périodes tendues, périodes creuses",
];
