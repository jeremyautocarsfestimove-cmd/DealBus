// Pages liaison — /location-autocar/trajet/[slug]
// Bas de la pyramide SEO : la requête la plus transactionnelle du secteur
// ("location autocar Paris Rouen", "bus Versailles Disneyland").
// Chaque liaison porte son propre contexte, sa durée réelle et son conseil.

export type Trajet = {
  slug: string;              // "paris-rouen"
  depart: string;            // "Paris"
  arrivee: string;           // "Rouen"
  departSlug?: string;       // page ville d'origine, si elle existe
  km: number;                // distance routière approximative, aller simple
  duree: string;             // temps de route hors pauses réglementaires
  contexte: string;          // paragraphe unique
  conseil: string;           // conseil d'exploitation propre à la liaison
  usages: string[];          // profils de groupe qui réservent cette liaison
};

export const TRAJETS: Trajet[] = [
  {
    slug: "paris-rouen", depart: "Paris", arrivee: "Rouen", departSlug: "paris",
    km: 135, duree: "1 h 45 à 2 h 15 selon le point de départ dans Paris",
    contexte: "C'est l'une des liaisons de groupe les plus denses de France : compétitions sportives, sorties scolaires vers le patrimoine normand, déplacements universitaires et voyages d'entreprise se croisent sur l'A13 toute l'année. La double présence d'autocaristes franciliens et normands sur ce corridor est une bonne nouvelle pour les prix : les deux bassins se disputent les mêmes courses.",
    conseil: "Sortir de Paris entre 7 h et 9 h ou y rentrer entre 17 h et 19 h peut ajouter 45 minutes de route, donc de l'amplitude conducteur, donc du prix. Décaler le départ d'une heure fait souvent baisser le devis.",
    usages: ["Déplacements de clubs sportifs", "Sorties scolaires et universitaires", "Séminaires et journées d'entreprise"],
  },
  {
    slug: "paris-deauville", depart: "Paris", arrivee: "Deauville", departSlug: "paris",
    km: 205, duree: "2 h 30 à 3 h",
    contexte: "La liaison des séminaires et des sorties de comités d'entreprise par excellence. Le trafic se concentre sur les vendredis et les samedis d'avril à septembre, avec un pic autour des festivals et des week-ends prolongés. Le retour du dimanche soir est le créneau le plus disputé de la liaison.",
    conseil: "Beaucoup de cars remontent à vide vers l'Île-de-France le dimanche en fin de journée après avoir déposé un groupe sur la côte. Si votre trajet correspond à ce créneau, regardez les retours à vide avant de publier une demande classique.",
    usages: ["Séminaires et incentives d'entreprise", "Sorties d'associations et de clubs d'aînés", "Week-ends de groupes et enterrements de vie de célibataire"],
  },
  {
    slug: "paris-disneyland", depart: "Paris", arrivee: "Disneyland Paris", departSlug: "paris",
    km: 40, duree: "45 min à 1 h 15 selon le trafic sur l'A4",
    contexte: "Le trajet de groupe le plus réservé d'Île-de-France, et de loin. Écoles, centres de loisirs et comités d'entreprise s'y succèdent, avec deux pics massifs : les sorties scolaires de mai et juin, et les arbres de Noël de CSE sur les trois premières semaines de décembre. Sur ces créneaux, les flottes locales sont bloquées des semaines à l'avance.",
    conseil: "Le point de dépose des autocars est réglementé sur le site : précisez l'heure de retour souhaitée dès la demande, car c'est l'attente sur place, plus que les kilomètres, qui détermine le prix sur un trajet aussi court.",
    usages: ["Sorties scolaires et centres de loisirs", "Arbres de Noël de comités d'entreprise", "Groupes familiaux et associations"],
  },
  {
    slug: "paris-reims", depart: "Paris", arrivee: "Reims", departSlug: "paris",
    km: 145, duree: "1 h 45 à 2 h",
    contexte: "Liaison reine de l'œnotourisme de groupe : circuits caves de champagne, incentives d'entreprise et journées d'associations se partagent l'A4 d'avril à octobre. Elle sert aussi de première étape aux circuits mémoriels vers Verdun et la Meuse, et se prolonge souvent vers Épernay dans la même journée.",
    conseil: "Une journée caves implique plusieurs arrêts et de longues attentes. Détaillez le programme heure par heure dans la demande : un transporteur qui connaît l'amplitude exacte chiffre plus juste qu'un transporteur qui prend une marge de sécurité.",
    usages: ["Circuits champagne et œnotourisme", "Incentives et sorties de direction", "Voyages scolaires mémoire et histoire"],
  },
  {
    slug: "paris-mont-saint-michel", depart: "Paris", arrivee: "Mont-Saint-Michel", departSlug: "paris",
    km: 360, duree: "4 h à 4 h 30 hors pauses",
    contexte: "L'excursion à la journée la plus exigeante du répertoire français : près de neuf heures de route aller-retour, auxquelles s'ajoutent la visite et les navettes du barrage. L'amplitude du conducteur devient ici le facteur limitant, avant même le kilométrage.",
    conseil: "À cette distance, la journée frôle la limite réglementaire d'amplitude. Deux options : partir très tôt avec un programme serré, ou passer sur deux jours avec une nuit sur place, ce qui coûte souvent moins cher qu'un double équipage.",
    usages: ["Voyages scolaires et classes patrimoine", "Sorties d'associations et de clubs d'aînés", "Circuits touristiques de groupe"],
  },
  {
    slug: "paris-londres", depart: "Paris", arrivee: "Londres", departSlug: "paris",
    km: 460, duree: "7 h à 8 h avec le passage shuttle ou ferry",
    contexte: "Le grand classique du voyage scolaire et du séjour linguistique. Depuis le Brexit, la traversée impose des formalités supplémentaires pour les groupes de mineurs, et tous les autocaristes ne sont pas équipés ni habitués à les gérer — c'est un vrai critère de sélection, au-delà du prix.",
    conseil: "Vérifiez que l'offre inclut bien la traversée (shuttle ou ferry) et l'hébergement du conducteur, deux postes que certains devis renvoient en supplément. Sur DealBus, demandez-le explicitement dans le descriptif pour que les offres restent comparables.",
    usages: ["Voyages scolaires et séjours linguistiques", "Groupes universitaires", "Associations et clubs culturels"],
  },
  {
    slug: "paris-bruxelles", depart: "Paris", arrivee: "Bruxelles", departSlug: "paris",
    km: 315, duree: "3 h 30 à 4 h",
    contexte: "Liaison européenne dense, portée par les voyages scolaires vers les institutions, les déplacements professionnels et les séjours culturels. La concurrence y est forte : autocaristes franciliens, nordistes et belges se positionnent sur les mêmes courses, ce qui joue nettement en faveur des groupes.",
    conseil: "La zone de basses émissions bruxelloise impose des normes Euro minimales aux autocars. Demandez la norme du véhicule dans l'offre : un car non conforme, c'est une amende et un itinéraire de contournement le jour J.",
    usages: ["Voyages scolaires et visites institutionnelles", "Séjours culturels d'associations", "Déplacements d'entreprise"],
  },
  {
    slug: "paris-puy-du-fou", depart: "Paris", arrivee: "Puy du Fou", departSlug: "paris",
    km: 390, duree: "4 h 15 à 4 h 45 hors pauses",
    contexte: "Destination de séjour plus que d'excursion : la Cinéscénie se joue en soirée, ce qui rend l'aller-retour dans la journée pratiquement impossible dans le respect de l'amplitude conducteur. La quasi-totalité des groupes part donc sur deux jours avec une nuit sur place.",
    conseil: "Sur un séjour de deux jours, deux postes s'ajoutent au kilométrique : l'hébergement du conducteur et les mises à disposition sur place. Précisez si le car doit rester à disposition ou peut être libéré entre deux transferts, l'écart de prix est significatif.",
    usages: ["Séjours d'associations et de comités d'entreprise", "Voyages scolaires et paroissiaux", "Clubs et amicales"],
  },
  {
    slug: "versailles-disneyland", depart: "Versailles", arrivee: "Disneyland Paris", departSlug: "versailles",
    km: 60, duree: "1 h à 1 h 30 selon la traversée de l'agglomération",
    contexte: "Le trajet type des établissements scolaires et des comités d'entreprise de l'ouest francilien. La contrainte n'est pas la distance mais la traversée de l'agglomération parisienne, très variable selon l'heure — un même trajet peut prendre du simple au double.",
    conseil: "Un départ avant 7 h évite le gros du trafic et raccourcit l'amplitude de la journée. Sur ce type de course, c'est le levier de prix le plus efficace, bien plus que la négociation.",
    usages: ["Sorties scolaires de fin d'année", "Arbres de Noël de CSE", "Centres de loisirs et associations familiales"],
  },
  {
    slug: "mantes-la-jolie-rouen", depart: "Mantes-la-Jolie", arrivee: "Rouen", departSlug: "mantes-la-jolie",
    km: 80, duree: "1 h à 1 h 15",
    contexte: "Trajet court de bassin à bassin, très demandé par les clubs sportifs du Mantois et les collèges de la vallée de la Seine. Sa position à cheval sur l'Île-de-France et la Normandie fait qu'il attire les deux marchés de transporteurs, avec des structures de coûts différentes.",
    conseil: "Sur un trajet aussi court, le prix est dominé par le forfait minimum du transporteur, pas par le kilométrage. Un autocariste normand basé à proximité chiffrera souvent plus bas qu'un francilien qui doit faire une approche à vide.",
    usages: ["Déplacements de clubs sportifs", "Sorties scolaires et collèges", "Journées associatives"],
  },
  {
    slug: "rouen-paris", depart: "Rouen", arrivee: "Paris", departSlug: "rouen",
    km: 135, duree: "1 h 45 à 2 h 30 selon l'entrée dans Paris",
    contexte: "Le sens montant de l'axe A13, réservé toute l'année pour les spectacles, les salons, les compétitions et les sorties culturelles. Les autocaristes seinomarins y sont très présents et pratiquent des tarifs sensiblement inférieurs à ceux de leurs homologues franciliens sur le même trajet.",
    conseil: "Le stationnement des autocars dans Paris est le vrai sujet, pas la route. Indiquez précisément vos points de dépose et de reprise : c'est ce qui permet au transporteur de chiffrer sans marge de sécurité.",
    usages: ["Spectacles, musées et salons", "Compétitions sportives", "Sorties scolaires et associatives"],
  },
  {
    slug: "rouen-lille", depart: "Rouen", arrivee: "Lille", departSlug: "rouen",
    km: 230, duree: "2 h 45 à 3 h 15",
    contexte: "Liaison interrégionale portée par le sport de haut niveau amateur et les déplacements universitaires. Elle échappe aux grands axes touristiques, ce qui limite le nombre de transporteurs positionnés — d'où l'intérêt d'ouvrir la demande aux départements limitrophes.",
    conseil: "Peu de retours à vide existent sur cette transversale. En revanche, un aller-retour dans la journée reste largement dans l'amplitude conducteur : c'est la formule la plus économique si votre programme le permet.",
    usages: ["Déplacements de clubs et compétitions", "Groupes universitaires", "Sorties d'entreprise"],
  },
  {
    slug: "le-havre-paris", depart: "Le Havre", arrivee: "Paris", departSlug: "le-havre",
    km: 200, duree: "2 h 30 à 3 h",
    contexte: "Liaison structurée par les escales de croisière : d'avril à octobre, des groupes entiers débarquent le matin pour une journée à Paris et réembarquent le soir. Le reste de l'année, ce sont les scolaires, les clubs et les comités d'entreprise havrais qui font tourner la liaison.",
    conseil: "Sur une journée croisière, l'heure de réembarquement est impérative et le transporteur en assume le risque. Donnez-lui une marge explicite dans le programme : un car qui doit courir facture sa marge de sécurité, et elle coûte cher.",
    usages: ["Excursions de croisiéristes", "Sorties scolaires et culturelles", "Déplacements d'entreprise et de clubs"],
  },
  {
    slug: "caen-plages-du-debarquement", depart: "Caen", arrivee: "Plages du Débarquement", departSlug: "caen",
    km: 30, duree: "40 min jusqu'aux premiers sites, circuit complet sur la journée",
    contexte: "Le circuit mémoriel le plus réservé de France : Mémorial de Caen, Arromanches, Omaha Beach, cimetière américain de Colleville. Ce n'est pas un trajet mais une mise à disposition à la journée avec cinq à sept arrêts, souvent accompagnée d'un guide.",
    conseil: "Autour des commémorations de juin, les flottes locales sont bloquées plusieurs mois à l'avance et les prix montent fortement. Pour un groupe scolaire, viser mars-avril ou septembre-octobre change à la fois la disponibilité et le tarif.",
    usages: ["Voyages scolaires mémoire et histoire", "Groupes d'anciens combattants et associations", "Circuits touristiques et croisiéristes"],
  },
  {
    slug: "chartres-paris", depart: "Chartres", arrivee: "Paris", departSlug: "chartres",
    km: 90, duree: "1 h 15 à 1 h 45",
    contexte: "Trajet du quotidien pour les établissements scolaires, les clubs et les associations d'Eure-et-Loir, qui montent régulièrement à Paris pour des spectacles, des musées ou des compétitions. La proximité de l'A11 rend la liaison rapide et bien couverte par les transporteurs beaucerons.",
    conseil: "Beaucoup de cars chartrains remontent à vide de Paris en fin de journée après une dépose matinale. C'est l'un des axes où la probabilité de trouver un retour à vide exploitable est la plus élevée.",
    usages: ["Sorties scolaires et culturelles", "Compétitions sportives", "Journées d'associations et de comités des fêtes"],
  },
  {
    slug: "evreux-paris", depart: "Évreux", arrivee: "Paris", departSlug: "evreux",
    km: 100, duree: "1 h 30 à 2 h",
    contexte: "Liaison régulière portée par les collèges et lycées de l'Eure, les clubs sportifs et les comités des fêtes, qui montent à Paris pour des sorties à la journée. Les autocaristes euroise pratiquent des tarifs normands, sensiblement inférieurs à ceux des transporteurs franciliens sur la même course.",
    conseil: "Ouvrez votre demande aux transporteurs des Yvelines et du Val-d'Oise en plus de ceux de l'Eure : sur cette liaison, ils sont souvent en position de proposer un trajet qui complète un planning déjà engagé.",
    usages: ["Sorties scolaires et collèges", "Clubs sportifs et associations", "Comités des fêtes et sorties d'aînés"],
  },
  {
    slug: "cergy-pontoise-roissy", depart: "Cergy-Pontoise", arrivee: "Roissy-CDG", departSlug: "cergy-pontoise",
    km: 30, duree: "40 min à 1 h 10 selon la Francilienne",
    contexte: "Transfert de groupe pur : départs de séjours scolaires, week-ends d'intégration étudiants, voyages d'entreprise. Le trajet est court mais les horaires sont contraints par l'enregistrement, ce qui en fait une course où la fiabilité compte plus que le prix au kilomètre.",
    conseil: "Prévoyez une marge d'une heure sur l'horaire d'enregistrement et indiquez le terminal exact : les temps d'accès varient fortement d'un terminal à l'autre, et un car qui se trompe fait perdre trente minutes au groupe.",
    usages: ["Départs de voyages scolaires", "Week-ends d'intégration étudiants", "Transferts de groupes d'entreprise"],
  },
  {
    slug: "saint-germain-en-laye-parc-asterix", depart: "Saint-Germain-en-Laye", arrivee: "Parc Astérix", departSlug: "saint-germain-en-laye",
    km: 65, duree: "1 h à 1 h 30",
    contexte: "Sortie de fin d'année classique des établissements scolaires et des centres de loisirs de l'ouest francilien. Le parc est ouvert d'avril à début novembre, ce qui concentre toute la demande sur sept mois, avec une saturation nette sur les jeudis et vendredis de juin.",
    conseil: "Sur une sortie parc, le car attend sur place toute la journée : l'amplitude du conducteur est le poste dominant. Un départ à 8 h plutôt qu'à 9 h ne coûte rien de plus et sécurise le retour dans les temps.",
    usages: ["Sorties scolaires de fin d'année", "Centres de loisirs et accueils périscolaires", "Comités d'entreprise et associations familiales"],
  },
  {
    slug: "lyon-chamonix", depart: "Lyon", arrivee: "Chamonix", departSlug: "lyon",
    km: 220, duree: "2 h 45 à 4 h selon les conditions hivernales",
    contexte: "L'axe neige par excellence : de décembre à avril, les rotations du samedi mobilisent une part considérable du parc rhodanien, avec des plannings bouclés dès l'automne. Hors saison, la même liaison sert les séminaires, les clubs de randonnée et les groupes scolaires.",
    conseil: "En hiver, l'équipement du véhicule (pneus, chaînes) et l'expérience du conducteur en montagne comptent autant que le prix. Demandez-le explicitement : c'est un critère de comparaison légitime, et les transporteurs sérieux le mettent en avant.",
    usages: ["Transferts neige et séjours de ski", "Classes de découverte et scolaires", "Séminaires et clubs de montagne"],
  },
  {
    slug: "marseille-nice", depart: "Marseille", arrivee: "Nice", departSlug: "marseille",
    km: 200, duree: "2 h 15 à 3 h en saison",
    contexte: "Liaison côtière très fréquentée, portée par les congrès, les festivals et les groupes de croisiéristes qui enchaînent les escales. La densité de transporteurs sur l'arc méditerranéen est élevée, ce qui rend la mise en concurrence particulièrement efficace sur cette course.",
    conseil: "En juillet-août, l'A8 peut ajouter une heure de trajet en milieu de journée. Un départ matinal ou en fin d'après-midi réduit l'amplitude et donc le devis, à prestation identique.",
    usages: ["Congrès, salons et festivals", "Excursions de croisiéristes", "Groupes scolaires et associations"],
  },
];

export function getTrajet(slug: string): Trajet | undefined {
  return TRAJETS.find((t) => t.slug === slug);
}

export function trajetsDeVille(villeSlug: string): Trajet[] {
  return TRAJETS.filter((t) => t.departSlug === villeSlug);
}
