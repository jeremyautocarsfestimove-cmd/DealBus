// Pages départements — /location-autocar/[slug]
// Niveau intermédiaire de la pyramide SEO : footer → départements → villes.

export type Departement = {
  slug: string;
  nom: string;
  code: string;
  region: string;
  contexte: string;                                  // paragraphe unique
  villes: { nom: string; slug?: string }[];          // slug = page ville existante
  axesRetours: string;
};

export const DEPARTEMENTS: Departement[] = [
  {
    slug: "yvelines", nom: "Yvelines", code: "78", region: "Île-de-France",
    contexte: "Des établissements scolaires de Versailles aux entreprises de Saint-Quentin-en-Yvelines, en passant par les clubs sportifs du Mantois, les Yvelines concentrent l'une des plus fortes demandes de transport de groupe d'Île-de-France — sur un territoire où autocaristes franciliens et normands se font naturellement concurrence.",
    villes: [
      { nom: "Versailles", slug: "versailles" }, { nom: "Mantes-la-Jolie", slug: "mantes-la-jolie" },
      { nom: "Saint-Germain-en-Laye", slug: "saint-germain-en-laye" }, { nom: "Sartrouville" },
      { nom: "Poissy" }, { nom: "Rambouillet" }, { nom: "Trappes" }, { nom: "Conflans-Sainte-Honorine" },
    ],
    axesRetours: "L'axe A13 Paris ↔ Normandie qui traverse le département est l'un des plus riches en retours à vide de France.",
  },
  {
    slug: "eure", nom: "Eure", code: "27", region: "Normandie",
    contexte: "Entre Giverny qui attire les groupes du monde entier, les entreprises de la vallée de la Seine et un maillage dense de collèges ruraux, l'Eure fait travailler des autocaristes de proximité qui connaissent chaque canton — et pratiquent des prix normands.",
    villes: [
      { nom: "Évreux", slug: "evreux" }, { nom: "Vernon", slug: "vernon" }, { nom: "Louviers" },
      { nom: "Val-de-Reuil" }, { nom: "Gisors" }, { nom: "Bernay" }, { nom: "Pont-Audemer" },
    ],
    axesRetours: "Les navettes touristiques de Giverny et les flux vers Rouen créent des retours à vide réguliers d'avril à octobre.",
  },
  {
    slug: "seine-maritime", nom: "Seine-Maritime", code: "76", region: "Normandie",
    contexte: "Premier département autocariste de Normandie, la Seine-Maritime cumule les transferts de croisiéristes au Havre, les flux étudiants et sportifs de Rouen et les excursions de la Côte d'Albâtre — des flottes importantes y garantissent des réponses rapides toute l'année.",
    villes: [
      { nom: "Rouen", slug: "rouen" }, { nom: "Le Havre", slug: "le-havre" }, { nom: "Dieppe" },
      { nom: "Fécamp" }, { nom: "Étretat" }, { nom: "Elbeuf" }, { nom: "Yvetot" },
    ],
    axesRetours: "Rouen ↔ Paris et les transferts croisiéristes du Havre produisent des retours à vide quasi quotidiens en saison.",
  },
  {
    slug: "val-d-oise", nom: "Val-d'Oise", code: "95", region: "Île-de-France",
    contexte: "Avec Roissy CDG à sa porte, l'université de Cergy et un tissu associatif dense, le Val-d'Oise mêle transferts aéroport de groupes, week-ends d'intégration étudiants et sorties scolaires — souvent en délais courts, là où la mise en concurrence rapide fait la différence.",
    villes: [
      { nom: "Cergy-Pontoise", slug: "cergy-pontoise" }, { nom: "Argenteuil" }, { nom: "Sarcelles" },
      { nom: "Garges-lès-Gonesse" }, { nom: "Franconville" }, { nom: "Goussainville" }, { nom: "Pontoise" },
    ],
    axesRetours: "Les dessertes de Roissy et l'axe A15 vers la Normandie alimentent un flux constant de trajets retour.",
  },
  {
    slug: "eure-et-loir", nom: "Eure-et-Loir", code: "28", region: "Centre-Val de Loire",
    contexte: "Des pèlerinages de Chartres aux entreprises de la Cosmetic Valley, l'Eure-et-Loir voit circuler des groupes toute l'année sur un territoire où transporteurs beaucerons et franciliens se partagent les routes — la comparaison de devis y est particulièrement payante.",
    villes: [
      { nom: "Chartres", slug: "chartres" }, { nom: "Dreux" }, { nom: "Lucé" },
      { nom: "Châteaudun" }, { nom: "Nogent-le-Rotrou" }, { nom: "Vernouillet" },
    ],
    axesRetours: "Les flux de pèlerinage Paris-Chartres et les liaisons vers les châteaux de la Loire créent des opportunités saisonnières.",
  },
  {
    slug: "calvados", nom: "Calvados", code: "14", region: "Normandie",
    contexte: "Le tourisme de mémoire des plages du Débarquement fait du Calvados un aimant à groupes scolaires du monde entier, tandis que Caen l'universitaire et la côte fleurie (Deauville, Honfleur) entretiennent une activité événementielle dense — les autocaristes calvadosiens sont rompus à tous les formats.",
    villes: [
      { nom: "Caen", slug: "caen" }, { nom: "Lisieux" }, { nom: "Bayeux" },
      { nom: "Deauville" }, { nom: "Honfleur" }, { nom: "Vire" },
    ],
    axesRetours: "Les circuits mémoriels et les liaisons Paris ↔ côte normande génèrent des retours à vide constants.",
  },
  {
    slug: "orne", nom: "Orne", code: "61", region: "Normandie",
    contexte: "Département rural au cœur de la Normandie, l'Orne s'appuie sur des autocaristes familiaux qui assurent scolaires, clubs et sorties d'aînés — des professionnels de proximité aux tarifs parmi les plus doux de la région, que la plateforme rend enfin comparables.",
    villes: [
      { nom: "Alençon" }, { nom: "Flers" }, { nom: "Argentan" },
      { nom: "L'Aigle" }, { nom: "Mortagne-au-Perche" },
    ],
    axesRetours: "Les liaisons vers Caen, Le Mans et Paris offrent des trajets retour à saisir pour les groupes flexibles.",
  },
  {
    slug: "manche", nom: "Manche", code: "50", region: "Normandie",
    contexte: "Du Mont-Saint-Michel qui draine des millions de visiteurs aux traversées vers les îles anglo-normandes, la Manche vit du transport touristique de groupe — ses autocaristes alternent navettes de sites, scolaires du Cotentin et excursions littorales.",
    villes: [
      { nom: "Cherbourg-en-Cotentin" }, { nom: "Saint-Lô" }, { nom: "Granville" },
      { nom: "Avranches" }, { nom: "Coutances" },
    ],
    axesRetours: "Les rotations du Mont-Saint-Michel produisent des retours à vide réguliers vers Caen, Rennes et Paris.",
  },
  {
    slug: "oise", nom: "Oise", code: "60", region: "Hauts-de-France",
    contexte: "Aux portes nord de Paris, l'Oise cumule les sorties vers le Parc Astérix et Chantilly, les scolaires de Beauvais et Compiègne, et les liaisons aéroport (Beauvais-Tillé) — un carrefour où transporteurs picards et franciliens se disputent les groupes, au bénéfice des prix.",
    villes: [
      { nom: "Beauvais" }, { nom: "Compiègne" }, { nom: "Creil" },
      { nom: "Senlis" }, { nom: "Chantilly" }, { nom: "Noyon" },
    ],
    axesRetours: "Les dessertes de l'aéroport de Beauvais et du Parc Astérix alimentent un flux permanent de trajets retour.",
  },
  {
    slug: "essonne", nom: "Essonne", code: "91", region: "Île-de-France",
    contexte: "Entre le plateau de Saclay et ses campus, les zones d'activités d'Évry-Courcouronnes et un tissu associatif dense, l'Essonne génère une demande de groupe variée — séminaires scientifiques, déplacements sportifs, sorties scolaires — servie par de nombreux autocaristes du sud francilien.",
    villes: [
      { nom: "Évry-Courcouronnes" }, { nom: "Corbeil-Essonnes" }, { nom: "Massy" },
      { nom: "Savigny-sur-Orge" }, { nom: "Palaiseau" }, { nom: "Étampes" },
    ],
    axesRetours: "L'axe A6 vers le sud et les liaisons aéroport d'Orly offrent des trajets retour fréquents.",
  },
  {
    slug: "paris-75", nom: "Paris", code: "75", region: "Île-de-France",
    contexte: "Premier marché français du transport de groupe, Paris concentre CSE, agences événementielles, fédérations et écoles — mais aussi les écarts de prix les plus spectaculaires : pour un même trajet, les offres varient couramment de 30 %. C'est ici que la mise en concurrence rapporte le plus.",
    villes: [{ nom: "Paris", slug: "paris" }],
    axesRetours: "Tous les axes de retours à vide de France convergent vers la capitale — le tableau en direct est à consulter avant toute demande.",
  },
  {
    slug: "hauts-de-seine", nom: "Hauts-de-Seine", code: "92", region: "Île-de-France",
    contexte: "La Défense et ses sièges sociaux font des Hauts-de-Seine le royaume du séminaire et du transfert d'entreprise — navettes événementielles, congrès, team buildings — un marché exigeant sur la ponctualité où les avis vérifiés comptent autant que le prix.",
    villes: [
      { nom: "Nanterre" }, { nom: "Boulogne-Billancourt" }, { nom: "Courbevoie" },
      { nom: "Colombes" }, { nom: "Rueil-Malmaison" }, { nom: "Levallois-Perret" },
    ],
    axesRetours: "Les flux d'affaires vers les aéroports et les grandes métropoles régionales créent des trajets retour quotidiens.",
  },
  {
    slug: "seine-et-marne", nom: "Seine-et-Marne", code: "77", region: "Île-de-France",
    contexte: "Disneyland Paris, premier générateur de trajets de groupe de France, structure tout le marché seine-et-marnais — auquel s'ajoutent Fontainebleau, Provins et les scolaires du plus vaste département francilien. Les autocaristes locaux tournent à plein régime toute l'année.",
    villes: [
      { nom: "Meaux" }, { nom: "Chelles" }, { nom: "Melun" },
      { nom: "Fontainebleau" }, { nom: "Provins" }, { nom: "Torcy" },
    ],
    axesRetours: "Les rotations Disneyland créent chaque jour des retours à vide vers Paris et toute l'Île-de-France.",
  },
  {
    slug: "seine-saint-denis", nom: "Seine-Saint-Denis", code: "93", region: "Île-de-France",
    contexte: "Stade de France, salons du Bourget et de Villepinte, clubs sportifs innombrables : la Seine-Saint-Denis vit au rythme des grands événements — des pics de demande où réserver tôt et comparer large fait toute la différence sur les prix.",
    villes: [
      { nom: "Saint-Denis" }, { nom: "Montreuil" }, { nom: "Aubervilliers" },
      { nom: "Aulnay-sous-Bois" }, { nom: "Le Bourget" }, { nom: "Villepinte" },
    ],
    axesRetours: "Les navettes d'événements et les dessertes de Roissy toute proche alimentent un flux continu de trajets retour.",
  },
  {
    slug: "val-de-marne", nom: "Val-de-Marne", code: "94", region: "Île-de-France",
    contexte: "Avec Orly, le MIN de Rungis et un chapelet de communes denses, le Val-de-Marne mêle transferts aéroport, déplacements professionnels et vie associative intense — un marché de proximité où les autocaristes du sud-est parisien répondent vite.",
    villes: [
      { nom: "Créteil" }, { nom: "Vitry-sur-Seine" }, { nom: "Champigny-sur-Marne" },
      { nom: "Saint-Maur-des-Fossés" }, { nom: "Ivry-sur-Seine" }, { nom: "Villejuif" },
    ],
    axesRetours: "Les dessertes d'Orly et l'axe A6/A86 offrent des trajets retour réguliers dans toutes les directions.",
  },
  {
    slug: "rhone", nom: "Rhône", code: "69", region: "Auvergne-Rhône-Alpes",
    contexte: "Deuxième bassin économique de France et porte des Alpes, le Rhône vit des congrès lyonnais et des transferts neige — une saisonnalité marquée qui fait de l'hiver la meilleure période pour capter des retours à vide vers ou depuis les stations.",
    villes: [
      { nom: "Lyon", slug: "lyon" }, { nom: "Villeurbanne" }, { nom: "Vénissieux" },
      { nom: "Caluire-et-Cuire" }, { nom: "Bron" },
    ],
    axesRetours: "Les rotations vers les stations alpines produisent chaque hiver des centaines de trajets retour à prix cassé.",
  },
  {
    slug: "bouches-du-rhone", nom: "Bouches-du-Rhône", code: "13", region: "Provence-Alpes-Côte d'Azur",
    contexte: "Premier port de croisière de France à Marseille, festivals d'Aix et d'Avignon tout proches, supporters du Vélodrome : les Bouches-du-Rhône brassent des flux de groupe massifs sur un marché méridional où comparer plusieurs offres reste le meilleur levier de prix.",
    villes: [
      { nom: "Marseille", slug: "marseille" }, { nom: "Aix-en-Provence" }, { nom: "Arles" },
      { nom: "Martigues" }, { nom: "Aubagne" }, { nom: "Salon-de-Provence" },
    ],
    axesRetours: "L'axe Marseille → Paris est la référence des retours à vide : des autocars complets à une fraction du prix, chaque semaine.",
  },
];

export function getDepartement(slug: string): Departement | undefined {
  return DEPARTEMENTS.find((d) => d.slug === slug);
}

export function departementDeVille(villeSlug: string): Departement | undefined {
  return DEPARTEMENTS.find((d) => d.villes.some((v) => v.slug === villeSlug));
}
