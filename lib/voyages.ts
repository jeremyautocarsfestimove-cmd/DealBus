import type { IlluId } from "@/components/Illustrations";
import type { Organisme } from "./assistant-demande";

// Pages thème « Idées de voyage » (/voyages/<slug>). Une vignette de l'accueil
// = une fiche. Le texte reste factuel : DealBus met en relation, chaque
// transporteur reste maître de son offre. Les réglages du formulaire
// (destinations proposées, formules, organisme par défaut, précisions)
// pré-remplissent le parcours guidé /demande.

export type Formule = { id: "journee" | "deux_jours" | "sejour" | "soiree" | "aller_simple"; label: string; jours?: number };

export type Voyage = {
  slug: string;
  illu: IlluId;
  saison: string;
  titre: string;              // H1
  titreCourt: string;         // formulaire, fil d'Ariane
  accroche: string;           // sous le H1
  chiffres: { n: string; l: string }[];
  exemplesTitre: string;
  exemplesIntro: string;
  exemples: { nom: string; meta: string; texte: string }[];
  autres: string[];           // autres destinations possibles (liste ouverte)
  reperes: { k: string; titre: string; texte: string }[];
  formules: Formule[];
  formuleDefaut: Formule["id"];
  organismeDefaut: Organisme;
  precisions: string[];       // cases à cocher, reprises dans le message aux transporteurs
  assistant?: string;         // message affiché pour la formule « journée »
  faq: { q: string; a: string }[];
};

const FORMULES_JOURNEE: Formule[] = [
  { id: "journee", label: "Journée", jours: 1 },
  { id: "deux_jours", label: "2 jours", jours: 2 },
];

const FAQ_COMMUNE: { q: string; a: string }[] = [
  { q: "Ma destination n'est pas dans la liste, est-ce possible ?", a: "Oui. Indiquez n'importe quelle destination dans le formulaire ; les transporteurs qui couvrent votre région reçoivent la demande." },
  { q: "Qui organise la journée sur place ?", a: "Vous. DealBus met en relation avec des transporteurs vérifiés ; le transporteur retenu assure le transport selon les horaires convenus avec vous. Le programme sur place, les visites et les repas restent de votre ressort." },
  { q: "Combien ça coûte ?", a: "Cela dépend de la distance, de la date, du nombre de passagers et de la formule. Seule une offre ferme d'un transporteur vous engage : publiez votre demande, comparez, vous restez libre. DealBus est gratuit pour le client." },
];

const REPERE_REGLES = { k: "Règles", titre: "Temps de conduite réglementés", texte: "Un conducteur ne peut pas dépasser une certaine amplitude de journée. Pour les destinations lointaines, le transporteur propose soit un second conducteur, soit une nuit sur place. Il le précise dans son offre." };
const REPERE_ACCES = { k: "Accès", titre: "Dépose et stationnement", texte: "Les grandes villes et les sites touristiques imposent des points de dépose et des parkings autocars. Le transporteur les connaît et les intègre à son offre." };

export const VOYAGES: Voyage[] = [
  {
    slug: "marches-de-noel", illu: "noel", saison: "Décembre · Marchés de Noël",
    titre: "Marchés de Noël en autocar",
    titreCourt: "Marchés de Noël",
    accroche: "Strasbourg, Colmar, Reims, Lille, Metz, Montbéliard… et des dizaines d'autres. Décrivez votre sortie, les transporteurs de votre région vous font une offre ferme.",
    chiffres: [{ n: "+30", l: "villes proposées" }, { n: "1 ou 2 j.", l: "à votre choix" }, { n: "24 h", l: "premières offres, en général" }, { n: "0 €", l: "pour le client" }],
    exemplesTitre: "Les plus demandés",
    exemplesIntro: "Trois destinations fréquentes à titre d'exemple. Toutes les villes qui ont un marché de Noël sont possibles : choisissez-en une, ou tapez la vôtre dans le formulaire.",
    exemples: [
      { nom: "Strasbourg", meta: "Depuis Paris · ≈ 490 km · ≈ 5 h 15", texte: "Le plus grand marché de Noël de France, fin novembre à fin décembre. Depuis Paris la journée est longue : beaucoup de groupes partent sur 2 jours." },
      { nom: "Colmar", meta: "Depuis Paris · ≈ 520 km · ≈ 5 h 30", texte: "Plusieurs marchés dans la vieille ville. Souvent combiné avec Strasbourg ou les villages alsaciens sur 2 jours." },
      { nom: "Reims", meta: "Depuis Paris · ≈ 145 km · ≈ 1 h 45", texte: "Marché au pied de la cathédrale. À moins de 2 h de Paris : faisable dans la journée sans contrainte." },
    ],
    autres: ["Lille", "Metz", "Nancy", "Mulhouse", "Montbéliard", "Amiens", "Rouen", "Kaysersberg", "Riquewihr", "Bruxelles", "Liège", "Aix-la-Chapelle", "Cologne"],
    reperes: [
      { k: "Route", titre: "Temps de trajet indicatifs depuis Paris", texte: "Reims ≈ 1 h 45 · Lille ≈ 2 h 30 · Metz ≈ 3 h 30 · Strasbourg ≈ 5 h 15 · Colmar ≈ 5 h 30. Calculés automatiquement dans votre demande selon votre ville de départ." },
      REPERE_REGLES, REPERE_ACCES,
      { k: "Dates", titre: "Les samedis de décembre partent vite", texte: "Publiez votre demande tôt (octobre, novembre) pour recevoir plus d'offres." },
    ],
    formules: [...FORMULES_JOURNEE, { id: "soiree", label: "Soirée", jours: 1 }],
    formuleDefaut: "journee", organismeDefaut: "cse",
    precisions: ["Un arrêt intermédiaire souhaité (ville à préciser)", "Le car reste sur place entre l'aller et le retour", "Personnes à mobilité réduite"],
    assistant: "Pour les destinations lointaines, la journée est très longue. Les transporteurs préciseront dans leur offre comment ils l'organisent (second conducteur ou nuit sur place). Vous pouvez aussi choisir « 2 jours ».",
    faq: [{ q: "Peut-on combiner deux villes sur un week-end ?", a: "Oui, c'est fréquent en Alsace. Indiquez-le dans votre demande : les transporteurs organisent le transport sur 2 jours et le précisent dans leur offre." }, ...FAQ_COMMUNE],
  },
  {
    slug: "parcs-attractions", illu: "parc", saison: "Toute l'année",
    titre: "Parcs d'attractions en autocar",
    titreCourt: "Parcs d'attractions",
    accroche: "Disneyland Paris, Parc Astérix, Puy du Fou, Futuroscope, Nigloland, Walibi… La sortie classique des écoles, des CSE et des clubs. Décrivez votre groupe, les transporteurs répondent.",
    chiffres: [{ n: "+15", l: "parcs en France" }, { n: "1 ou 2 j.", l: "selon le parc" }, { n: "24 h", l: "premières offres, en général" }, { n: "0 €", l: "pour le client" }],
    exemplesTitre: "Les plus demandés",
    exemplesIntro: "Trois exemples. Tous les parcs sont possibles : choisissez-en un, ou tapez le vôtre dans le formulaire.",
    exemples: [
      { nom: "Disneyland Paris", meta: "Depuis Paris · ≈ 45 km · ≈ 1 h", texte: "La sortie la plus demandée. Le parc dispose d'un parking autocars dédié ; les groupes sont déposés à l'entrée." },
      { nom: "Parc Astérix", meta: "Depuis Paris · ≈ 40 km · ≈ 50 min", texte: "Journée simple depuis l'Île-de-France. Ouverture saisonnière : vérifiez le calendrier du parc avant de fixer la date." },
      { nom: "Puy du Fou", meta: "Depuis Paris · ≈ 380 km · ≈ 4 h", texte: "Généralement sur 2 jours avec la Cinéscénie en saison. Le transporteur précise dans son offre l'organisation de la nuit du conducteur." },
    ],
    autres: ["Futuroscope", "Nigloland", "Walibi Rhône-Alpes", "Parc Spirou", "Le Pal", "Vulcania", "Zoo de Beauval", "Marineland", "Europa-Park", "Efteling", "Plopsaland"],
    reperes: [
      { k: "Enfants", titre: "Transport d'enfants", texte: "Pour les groupes d'enfants, indiquez le nombre d'accompagnateurs et l'âge des passagers : les transporteurs proposent un véhicule adapté (ceintures, pictogrammes) et le précisent dans leur offre." },
      { k: "Horaires", titre: "Arrivée à l'ouverture", texte: "Indiquez l'heure d'arrivée souhaitée au parc plutôt que l'heure de départ : la demande calcule la durée de route et propose une heure de départ cohérente." },
      REPERE_REGLES, REPERE_ACCES,
    ],
    formules: FORMULES_JOURNEE,
    formuleDefaut: "journee", organismeDefaut: "ecole",
    precisions: ["Groupe d'enfants de moins de 12 ans", "Le car reste sur place entre l'aller et le retour", "Personnes à mobilité réduite"],
    faq: [{ q: "Le car attend-il sur place ?", a: "C'est à préciser dans votre demande. Beaucoup de transporteurs laissent le car au parking du parc ; certains repartent entre l'aller et le retour. Chacun l'indique dans son offre." }, ...FAQ_COMMUNE],
  },
  {
    slug: "journee-mer", illu: "mer", saison: "Mai à septembre",
    titre: "Journée à la mer en autocar",
    titreCourt: "Journée à la mer",
    accroche: "Deauville, Étretat, Le Touquet, Cabourg, Honfleur, Saint-Malo… La sortie d'été des associations, des centres de loisirs et des familles. Décrivez votre journée, les transporteurs répondent.",
    chiffres: [{ n: "+20", l: "stations proposées" }, { n: "1 j.", l: "ou retour tardif" }, { n: "24 h", l: "premières offres, en général" }, { n: "0 €", l: "pour le client" }],
    exemplesTitre: "Les plus demandées",
    exemplesIntro: "Trois exemples depuis l'Île-de-France. Toute station balnéaire est possible : choisissez-en une, ou tapez la vôtre.",
    exemples: [
      { nom: "Deauville", meta: "Depuis Paris · ≈ 200 km · ≈ 2 h 30", texte: "La plus proche des grandes plages normandes. Dépose près du front de mer selon les règles de la ville." },
      { nom: "Étretat", meta: "Depuis Paris · ≈ 210 km · ≈ 2 h 45", texte: "Falaises et plage de galets. Stationnement autocars limité en été : le transporteur gère la dépose et le parking." },
      { nom: "Le Touquet", meta: "Depuis Paris · ≈ 240 km · ≈ 2 h 45", texte: "Grande plage de sable, station adaptée aux groupes." },
    ],
    autres: ["Cabourg", "Honfleur", "Trouville", "Fécamp", "Dieppe", "Berck", "Saint-Malo", "Granville", "Les Sables-d'Olonne", "La Baule", "Arcachon"],
    reperes: [
      { k: "Dates", titre: "Week-ends d'été très demandés", texte: "Juillet et août partent vite, surtout le samedi. Publiez votre demande plusieurs semaines à l'avance." },
      { k: "Retour", titre: "Heure de reprise", texte: "Indiquez l'heure de reprise du groupe sur place : elle conditionne l'amplitude de la journée du conducteur et donc les offres." },
      REPERE_REGLES, REPERE_ACCES,
    ],
    formules: [{ id: "journee", label: "Journée", jours: 1 }, { id: "soiree", label: "Retour tardif", jours: 1 }],
    formuleDefaut: "journee", organismeDefaut: "association",
    precisions: ["Un arrêt intermédiaire souhaité (ville à préciser)", "Le car reste sur place entre l'aller et le retour", "Personnes à mobilité réduite"],
    faq: FAQ_COMMUNE,
  },
  {
    slug: "vignobles", illu: "vigne", saison: "Septembre · Octobre",
    titre: "Vignobles et caves en autocar",
    titreCourt: "Vignobles & caves",
    accroche: "Champagne, Loire, Bourgogne, Alsace, Bordelais… Une journée ou un week-end entre vignes et caves, avec un conducteur qui ramène tout le monde. Décrivez votre sortie, les transporteurs répondent.",
    chiffres: [{ n: "+10", l: "vignobles proposés" }, { n: "1 ou 2 j.", l: "à votre choix" }, { n: "24 h", l: "premières offres, en général" }, { n: "0 €", l: "pour le client" }],
    exemplesTitre: "Les plus demandés",
    exemplesIntro: "Trois exemples. Tous les vignobles sont possibles : choisissez-en un, ou tapez votre destination.",
    exemples: [
      { nom: "Champagne (Reims, Épernay)", meta: "Depuis Paris · ≈ 145 km · ≈ 1 h 45", texte: "Le plus proche de l'Île-de-France. Journée simple, caves ouvertes aux groupes sur réservation (à organiser par vos soins)." },
      { nom: "Vallée de la Loire", meta: "Depuis Paris · ≈ 200 à 300 km · 2 h 30 à 3 h 30", texte: "Vouvray, Chinon, Saumur. Souvent combiné avec un château sur la journée ou sur 2 jours." },
      { nom: "Bourgogne (Beaune)", meta: "Depuis Paris · ≈ 310 km · ≈ 3 h 30", texte: "Route des Grands Crus. Journée longue depuis Paris : 2 jours conseillés pour un programme complet." },
    ],
    autres: ["Alsace (Colmar, Riquewihr)", "Bordelais (Saint-Émilion)", "Sancerre", "Chablis", "Jura", "Côtes-du-Rhône", "Languedoc", "Provence", "Beaujolais"],
    reperes: [
      { k: "Visites", titre: "Les caves, c'est vous", texte: "DealBus organise le transport uniquement. Réservez les visites et dégustations directement auprès des domaines." },
      { k: "Arrêts", titre: "Plusieurs arrêts dans la journée", texte: "Indiquez les étapes prévues (domaines, village, restaurant) : les transporteurs chiffrent la journée en connaissance de cause." },
      REPERE_REGLES, REPERE_ACCES,
    ],
    formules: FORMULES_JOURNEE,
    formuleDefaut: "journee", organismeDefaut: "association",
    precisions: ["Plusieurs arrêts dans la journée (à préciser)", "Le car reste avec le groupe toute la journée", "Personnes à mobilité réduite"],
    faq: FAQ_COMMUNE,
  },
  {
    slug: "chateaux-loire", illu: "chateau", saison: "Printemps",
    titre: "Châteaux de la Loire en autocar",
    titreCourt: "Châteaux de la Loire",
    accroche: "Chambord, Chenonceau, Amboise, Blois, Cheverny, Villandry… Un ou deux châteaux dans la journée, ou un circuit sur 2 jours. Décrivez votre sortie, les transporteurs répondent.",
    chiffres: [{ n: "+15", l: "châteaux proposés" }, { n: "1 ou 2 j.", l: "à votre choix" }, { n: "24 h", l: "premières offres, en général" }, { n: "0 €", l: "pour le client" }],
    exemplesTitre: "Les plus demandés",
    exemplesIntro: "Trois exemples. Tous les châteaux sont possibles : choisissez-en un, ou tapez votre destination.",
    exemples: [
      { nom: "Chambord", meta: "Depuis Paris · ≈ 180 km · ≈ 2 h 15", texte: "Le plus visité. Parking autocars à l'entrée du domaine ; souvent combiné avec Blois ou Cheverny." },
      { nom: "Chenonceau", meta: "Depuis Paris · ≈ 230 km · ≈ 2 h 45", texte: "Se combine avec Amboise dans la journée. Parking autocars sur place." },
      { nom: "Amboise", meta: "Depuis Paris · ≈ 220 km · ≈ 2 h 30", texte: "Château royal et Clos Lucé à quelques minutes à pied l'un de l'autre." },
    ],
    autres: ["Blois", "Cheverny", "Villandry", "Azay-le-Rideau", "Chaumont-sur-Loire", "Saumur", "Angers", "Langeais", "Ussé", "Valençay"],
    reperes: [
      { k: "Billets", titre: "Les entrées, c'est vous", texte: "DealBus organise le transport uniquement. Les billets de groupe se réservent auprès de chaque château." },
      { k: "Circuit", titre: "Deux châteaux dans la journée", texte: "Indiquez les étapes et l'heure souhaitée au premier château : la demande calcule les temps de route entre chaque arrêt." },
      REPERE_REGLES, REPERE_ACCES,
    ],
    formules: FORMULES_JOURNEE,
    formuleDefaut: "journee", organismeDefaut: "ecole",
    precisions: ["Deux châteaux ou plus dans la journée (à préciser)", "Groupe d'enfants de moins de 12 ans", "Personnes à mobilité réduite"],
    faq: FAQ_COMMUNE,
  },
  {
    slug: "sejours-europe", illu: "londres", saison: "Séjours · 2 à 4 jours",
    titre: "Séjours en Europe en autocar",
    titreCourt: "Séjours en Europe",
    accroche: "Londres, Bruxelles, Amsterdam, Barcelone, Berlin, Rome… Le car part avec le groupe et reste sur place : transferts, visites, retour. Décrivez votre séjour, les transporteurs répondent.",
    chiffres: [{ n: "+20", l: "villes proposées" }, { n: "2 à 5 j.", l: "car sur place" }, { n: "24 h", l: "premières offres, en général" }, { n: "0 €", l: "pour le client" }],
    exemplesTitre: "Les plus demandés",
    exemplesIntro: "Trois exemples depuis Paris. Toute ville européenne est possible : choisissez-en une, ou tapez votre destination.",
    exemples: [
      { nom: "Londres", meta: "Depuis Paris · ≈ 460 km · tunnel ou ferry", texte: "Le séjour scolaire par excellence. Les transporteurs précisent dans leur offre la traversée retenue et l'organisation des conducteurs." },
      { nom: "Bruxelles", meta: "Depuis Paris · ≈ 310 km · ≈ 3 h 30", texte: "Faisable sur 2 jours, souvent combiné avec Bruges ou Gand." },
      { nom: "Amsterdam", meta: "Depuis Paris · ≈ 500 km · ≈ 5 h 30", texte: "3 jours en général. Accès autocars réglementé au centre : le transporteur connaît les points de dépose." },
    ],
    autres: ["Bruges", "Gand", "Berlin", "Munich", "Barcelone", "Madrid", "Rome", "Florence", "Venise", "Prague", "Vienne", "Lisbonne"],
    reperes: [
      { k: "Programme", titre: "Décrivez les grandes lignes", texte: "Adresse de l'hébergement, journées avec ou sans car, transferts prévus : plus le programme est clair, plus les offres sont précises." },
      { k: "Formalités", titre: "Documents et autorisations", texte: "Pièces d'identité, autorisations de sortie du territoire pour les mineurs, assurances : ces formalités sont à votre charge. Le transporteur gère celles de son véhicule et de ses conducteurs." },
      REPERE_REGLES,
      { k: "Accès", titre: "Centres-villes réglementés", texte: "Plusieurs capitales limitent l'accès des autocars (zones à faibles émissions, points de dépose). Les transporteurs l'intègrent à leur offre." },
    ],
    formules: [{ id: "sejour", label: "2 jours", jours: 2 }, { id: "sejour", label: "3 jours", jours: 3 }, { id: "sejour", label: "4 jours et +", jours: 4 }],
    formuleDefaut: "sejour", organismeDefaut: "ecole",
    precisions: ["Le car reste sur place pendant tout le séjour", "Transferts quotidiens entre l'hébergement et les visites", "Groupe de mineurs (voyage scolaire)", "Personnes à mobilité réduite"],
    faq: [{ q: "Le car reste-t-il avec nous sur place ?", a: "C'est l'usage pour un séjour, mais précisez-le dans votre demande : chaque transporteur indique dans son offre ce qu'il prévoit (car sur place, transferts, jours sans car)." }, ...FAQ_COMMUNE],
  },
  {
    slug: "normandie-bretagne", illu: "msm", saison: "Toute l'année",
    titre: "Normandie et Bretagne en autocar",
    titreCourt: "Normandie & Bretagne",
    accroche: "Mont-Saint-Michel, plages du Débarquement, Honfleur, Saint-Malo, Giverny, Rouen… À la journée ou sur 2 jours. Décrivez votre sortie, les transporteurs répondent.",
    chiffres: [{ n: "+15", l: "sites proposés" }, { n: "1 ou 2 j.", l: "à votre choix" }, { n: "24 h", l: "premières offres, en général" }, { n: "0 €", l: "pour le client" }],
    exemplesTitre: "Les plus demandés",
    exemplesIntro: "Trois exemples depuis Paris. Tous les sites sont possibles : choisissez-en un, ou tapez votre destination.",
    exemples: [
      { nom: "Mont-Saint-Michel", meta: "Depuis Paris · ≈ 360 km · ≈ 4 h", texte: "Les autocars stationnent au parking de La Caserne ; le groupe rejoint le Mont à pied par la passerelle ou en navette. Journée longue depuis Paris : 2 jours possibles." },
      { nom: "Plages du Débarquement", meta: "Depuis Paris · ≈ 280 km · ≈ 3 h", texte: "Omaha Beach, cimetière américain, Arromanches : plusieurs arrêts dans la journée, le car suit le groupe." },
      { nom: "Honfleur et Deauville", meta: "Depuis Paris · ≈ 200 km · ≈ 2 h 30", texte: "Deux arrêts dans la journée, souvent demandés par les associations et les aînés." },
    ],
    autres: ["Saint-Malo", "Giverny", "Rouen", "Bayeux", "Étretat", "Cancale", "Dinan", "Caen Mémorial", "Granville", "Falaise"],
    reperes: [
      { k: "Arrêts", titre: "Plusieurs sites dans la journée", texte: "Indiquez les étapes prévues : la demande calcule les temps de route entre chaque arrêt et les transporteurs chiffrent en connaissance de cause." },
      REPERE_REGLES, REPERE_ACCES,
      { k: "Visites", titre: "Les entrées, c'est vous", texte: "DealBus organise le transport uniquement. Abbaye, mémorial, musées : les billets de groupe se réservent auprès de chaque site." },
    ],
    formules: FORMULES_JOURNEE,
    formuleDefaut: "journee", organismeDefaut: "association",
    precisions: ["Plusieurs arrêts dans la journée (à préciser)", "Le car reste avec le groupe toute la journée", "Groupe d'enfants de moins de 12 ans", "Personnes à mobilité réduite"],
    assistant: "Pour les sites lointains, la journée est longue. Les transporteurs préciseront dans leur offre comment ils l'organisent (second conducteur ou nuit sur place). Vous pouvez aussi choisir « 2 jours ».",
    faq: FAQ_COMMUNE,
  },
];

export function voyageParSlug(slug: string) {
  return VOYAGES.find((v) => v.slug === slug) ?? null;
}
