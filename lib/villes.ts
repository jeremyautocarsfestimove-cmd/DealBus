// Données des pages villes SEO — /location-autocar/[ville]
// Chaque ville a un contexte et des trajets réels pour un contenu différencié.

export type Ville = {
  slug: string;
  nom: string;
  dans: string;          // "à Versailles", "au Havre"
  depuis: string;        // "depuis Versailles"
  dept: string;
  region: string;
  contexte: string;      // paragraphe unique — ancrage local
  destinations: { vers: string; km: number; usage: string }[];
  axesRetours: string;   // phrase sur les retours à vide typiques
};

export const VILLES: Ville[] = [
  {
    slug: "versailles", nom: "Versailles", dans: "à Versailles", depuis: "depuis Versailles",
    dept: "Yvelines (78)", region: "Île-de-France",
    contexte: "Entre les établissements scolaires nombreux, les entreprises de Versailles Grand Parc et les associations de l'ouest parisien, la demande de transport de groupe est constante toute l'année — renforcée par les flux touristiques du château qui mobilisent les autocaristes locaux.",
    destinations: [
      { vers: "Paris centre", km: 25, usage: "sorties culturelles, congrès, spectacles" },
      { vers: "Disneyland Paris", km: 60, usage: "sorties scolaires et arbres de Noël de CSE" },
      { vers: "Deauville", km: 180, usage: "séminaires et sorties d'entreprise" },
      { vers: "Londres", km: 470, usage: "voyages scolaires via le shuttle" },
    ],
    axesRetours: "Les retours à vide y sont fréquents sur l'axe Normandie → Île-de-France et au retour des stations de ski en hiver.",
  },
  {
    slug: "mantes-la-jolie", nom: "Mantes-la-Jolie", dans: "à Mantes-la-Jolie", depuis: "depuis Mantes-la-Jolie",
    dept: "Yvelines (78)", region: "Île-de-France",
    contexte: "Porte d'entrée entre l'Île-de-France et la Normandie, Mantes-la-Jolie concentre collèges, lycées, clubs sportifs du Mantois et comités d'entreprise de la vallée de la Seine — un bassin où les autocaristes normands et franciliens se croisent, ce qui joue en faveur des prix.",
    destinations: [
      { vers: "Paris", km: 55, usage: "sorties scolaires, musées, matchs" },
      { vers: "Rouen", km: 80, usage: "déplacements sportifs et administratifs" },
      { vers: "Parc Astérix", km: 95, usage: "sorties de fin d'année" },
      { vers: "Honfleur / Deauville", km: 140, usage: "sorties des aînés et associations" },
    ],
    axesRetours: "Sa position sur l'axe A13 en fait un point de passage idéal pour capter les retours à vide Paris ↔ Normandie.",
  },
  {
    slug: "saint-germain-en-laye", nom: "Saint-Germain-en-Laye", dans: "à Saint-Germain-en-Laye", depuis: "depuis Saint-Germain-en-Laye",
    dept: "Yvelines (78)", region: "Île-de-France",
    contexte: "Ville scolaire par excellence — lycée international, établissements privés, clubs sportifs historiques — Saint-Germain-en-Laye génère un flux régulier de voyages éducatifs et de déplacements d'équipes qui exigent des transporteurs habitués aux listes de passagers et à l'encadrement de mineurs.",
    destinations: [
      { vers: "Paris", km: 20, usage: "théâtres, musées, conférences" },
      { vers: "Châteaux de la Loire", km: 220, usage: "voyages scolaires de 1 à 2 jours" },
      { vers: "Bruxelles", km: 320, usage: "échanges européens et institutions" },
      { vers: "Normandie (plages du Débarquement)", km: 250, usage: "programmes d'histoire" },
    ],
    axesRetours: "Les retours à vide de l'ouest parisien y trouvent preneur auprès des groupes scolaires flexibles sur les dates.",
  },
  {
    slug: "vernon", nom: "Vernon", dans: "à Vernon", depuis: "depuis Vernon",
    dept: "Eure (27)", region: "Normandie",
    contexte: "Entre Giverny qui draine les groupes du monde entier et les entreprises de la vallée de la Seine, Vernon est une place forte du transport occasionnel normand — les autocaristes de l'Eure y assurent aussi bien les navettes touristiques que les sorties des associations locales.",
    destinations: [
      { vers: "Paris", km: 80, usage: "sorties culturelles et gares parisiennes" },
      { vers: "Rouen", km: 65, usage: "rencontres sportives et administratives" },
      { vers: "Deauville / Trouville", km: 110, usage: "sorties d'été des comités des fêtes" },
      { vers: "Mont-Saint-Michel", km: 250, usage: "excursions à la journée" },
    ],
    axesRetours: "Les navettes touristiques de Giverny créent des retours à vide réguliers vers Paris et Rouen d'avril à octobre.",
  },
  {
    slug: "evreux", nom: "Évreux", dans: "à Évreux", depuis: "depuis Évreux",
    dept: "Eure (27)", region: "Normandie",
    contexte: "Préfecture de l'Eure, Évreux concentre les administrations, les lycées du département et un tissu associatif dense — les demandes y vont de la sortie scolaire au transfert de groupe vers les gares et aéroports parisiens, sur un marché où les transporteurs locaux connaissent chaque route du département.",
    destinations: [
      { vers: "Paris / Roissy CDG", km: 100, usage: "transferts aéroport de groupes" },
      { vers: "Rouen", km: 55, usage: "déplacements scolaires et sportifs" },
      { vers: "Caen", km: 120, usage: "compétitions régionales" },
      { vers: "Center Parcs Normandie", km: 60, usage: "séjours d'associations" },
    ],
    axesRetours: "Sa position centrale dans l'Eure en fait un point de départ malin pour profiter des retours à vide de tout le département.",
  },
  {
    slug: "rouen", nom: "Rouen", dans: "à Rouen", depuis: "depuis Rouen",
    dept: "Seine-Maritime (76)", region: "Normandie",
    contexte: "Capitale normande, port fluvial et ville universitaire, Rouen est le premier bassin de transport de groupe de la région : croisiéristes à transférer, étudiants à déplacer, supporters à emmener — les autocaristes de Seine-Maritime y disposent de flottes importantes, ce qui garantit des réponses rapides.",
    destinations: [
      { vers: "Paris", km: 135, usage: "la liaison la plus demandée de Normandie" },
      { vers: "Le Havre / Étretat", km: 90, usage: "sorties littorales et croisières" },
      { vers: "Lille", km: 230, usage: "matchs et salons professionnels" },
      { vers: "Londres", km: 320, usage: "voyages scolaires par le ferry ou le tunnel" },
    ],
    axesRetours: "L'axe Rouen ↔ Paris est l'un des plus riches en retours à vide de France — surveillez-le, les prix y sont imbattables.",
  },
  {
    slug: "le-havre", nom: "Le Havre", dans: "au Havre", depuis: "depuis Le Havre",
    dept: "Seine-Maritime (76)", region: "Normandie",
    contexte: "Premier port français pour les croisières après Marseille, Le Havre voit débarquer chaque semaine des groupes entiers à transférer vers Paris, Honfleur ou Étretat — un marché du transfert qui cohabite avec les besoins classiques des scolaires et des clubs havrais.",
    destinations: [
      { vers: "Paris", km: 195, usage: "transferts croisiéristes et sorties" },
      { vers: "Étretat / Fécamp", km: 30, usage: "excursions courtes très demandées" },
      { vers: "Honfleur / Deauville", km: 45, usage: "circuits touristiques d'une journée" },
      { vers: "Rouen", km: 90, usage: "liaisons régionales régulières" },
    ],
    axesRetours: "Les transferts de croisiéristes génèrent des retours à vide quasi quotidiens en saison — une aubaine pour les groupes flexibles.",
  },
  {
    slug: "cergy-pontoise", nom: "Cergy-Pontoise", dans: "à Cergy-Pontoise", depuis: "depuis Cergy-Pontoise",
    dept: "Val-d'Oise (95)", region: "Île-de-France",
    contexte: "Agglomération universitaire et tertiaire du Val-d'Oise, Cergy-Pontoise mêle campus (CY Université, ESSEC), zones d'activités et grands clubs sportifs — les demandes de bus y sont portées par les BDE, les services RH et les sections sportives, souvent en dernière minute.",
    destinations: [
      { vers: "Paris", km: 35, usage: "événements étudiants et salons" },
      { vers: "Deauville", km: 160, usage: "week-ends d'intégration" },
      { vers: "Reims", km: 170, usage: "sorties œnotourisme de CSE" },
      { vers: "Rouen", km: 100, usage: "compétitions universitaires" },
    ],
    axesRetours: "Aux portes de l'A15, l'agglomération capte les retours à vide entre Paris et la Normandie dans les deux sens.",
  },
  {
    slug: "chartres", nom: "Chartres", dans: "à Chartres", depuis: "depuis Chartres",
    dept: "Eure-et-Loir (28)", region: "Centre-Val de Loire",
    contexte: "Entre les pèlerinages qui convergent vers la cathédrale, les lycées euréliens et les entreprises de la Cosmetic Valley, Chartres voit circuler des groupes toute l'année — un marché où se côtoient transporteurs beaucerons et franciliens.",
    destinations: [
      { vers: "Paris", km: 90, usage: "sorties culturelles et pèlerinages" },
      { vers: "Châteaux de la Loire", km: 110, usage: "circuits touristiques classiques" },
      { vers: "Le Mans", km: 115, usage: "événements sportifs" },
      { vers: "Versailles", km: 75, usage: "sorties scolaires" },
    ],
    axesRetours: "Les flux de pèlerinage (Paris-Chartres notamment) créent des retours à vide saisonniers très avantageux.",
  },
  {
    slug: "caen", nom: "Caen", dans: "à Caen", depuis: "depuis Caen",
    dept: "Calvados (14)", region: "Normandie",
    contexte: "Ville universitaire au cœur des sites du Débarquement, Caen est un carrefour du tourisme de mémoire : les groupes scolaires du monde entier y transitent vers les plages, pendant que les clubs et associations caennaises sillonnent la Normandie — les autocaristes du Calvados sont rompus aux deux exercices.",
    destinations: [
      { vers: "Plages du Débarquement", km: 30, usage: "circuits mémoriels très demandés" },
      { vers: "Mont-Saint-Michel", km: 130, usage: "excursions à la journée" },
      { vers: "Paris", km: 240, usage: "liaisons capitales et transferts gares" },
      { vers: "Rouen", km: 130, usage: "rencontres inter-régionales" },
    ],
    axesRetours: "Le tourisme de mémoire génère des retours à vide constants entre Caen, les plages et Paris.",
  },
  {
    slug: "paris", nom: "Paris", dans: "à Paris", depuis: "depuis Paris",
    dept: "Paris (75)", region: "Île-de-France",
    contexte: "Premier marché français du transport de groupe, Paris concentre une demande énorme — CSE, agences événementielles, écoles, fédérations — mais aussi la concurrence tarifaire la plus vive : c'est ici que comparer plusieurs offres fait gagner le plus, avec des écarts de prix qui dépassent souvent 30 % pour un même trajet.",
    destinations: [
      { vers: "Disneyland Paris", km: 45, usage: "le classique des CSE et écoles" },
      { vers: "Deauville", km: 200, usage: "séminaires bord de mer" },
      { vers: "Reims / Épernay", km: 145, usage: "œnotourisme d'entreprise" },
      { vers: "Bruxelles", km: 310, usage: "voyages institutionnels et salons" },
    ],
    axesRetours: "Tous les axes de retours à vide de France convergent vers Paris — le tableau en direct mérite d'être consulté avant toute demande classique.",
  },
  {
    slug: "lyon", nom: "Lyon", dans: "à Lyon", depuis: "depuis Lyon",
    dept: "Rhône (69)", region: "Auvergne-Rhône-Alpes",
    contexte: "Deuxième bassin économique français et porte des Alpes, Lyon vit au rythme des séminaires, des congrès de la Part-Dieu et des transferts neige l'hiver — un marché où la saisonnalité des stations crée d'excellentes opportunités de retours à vide pour les groupes flexibles.",
    destinations: [
      { vers: "Stations des Alpes (Val d'Isère, Alpe d'Huez)", km: 180, usage: "transferts neige de décembre à avril" },
      { vers: "Paris", km: 465, usage: "liaisons d'affaires et événements" },
      { vers: "Marseille", km: 315, usage: "congrès et croisières" },
      { vers: "Genève", km: 150, usage: "transferts aéroport internationaux" },
    ],
    axesRetours: "Les rotations vers les stations alpines produisent chaque hiver des centaines de retours à vide — les tarifs y défient toute concurrence.",
  },
  {
    slug: "marseille", nom: "Marseille", dans: "à Marseille", depuis: "depuis Marseille",
    dept: "Bouches-du-Rhône (13)", region: "Provence-Alpes-Côte d'Azur",
    contexte: "Premier port de croisière de France, Marseille brasse des flux massifs de groupes — transferts navires, supporters du Vélodrome, colonies vers les calanques et le Lubéron — sur un marché méridional où la mise en concurrence reste le meilleur levier de prix.",
    destinations: [
      { vers: "Aix-en-Provence", km: 35, usage: "navettes événementielles" },
      { vers: "Nice", km: 200, usage: "liaisons côtières et festivals" },
      { vers: "Avignon", km: 105, usage: "festivals et tourisme provençal" },
      { vers: "Paris", km: 775, usage: "la grande liaison — reine des retours à vide" },
    ],
    axesRetours: "L'axe Marseille → Paris est emblématique des retours à vide : des autocars complets à une fraction du prix normal, chaque semaine.",
  },
];

export function getVille(slug: string): Ville | undefined {
  return VILLES.find((v) => v.slug === slug);
}
