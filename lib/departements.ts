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
/* ---------- Bretagne ---------- */
  {
    slug: "ille-et-vilaine", nom: "Ille-et-Vilaine", code: "35", region: "Bretagne",
    contexte: "Rennes l'universitaire et ses festivals (Trans Musicales, Route du Rock à deux pas) font de l'Ille-et-Vilaine le premier bassin breton du transport de groupe — étudiants, supporters du Roazhon Park et scolaires du pays de Saint-Malo mobilisent les autocaristes bretilliens toute l'année.",
    villes: [{ nom: "Rennes" }, { nom: "Saint-Malo" }, { nom: "Fougères" }, { nom: "Vitré" }, { nom: "Redon" }],
    axesRetours: "L'axe Rennes ↔ Paris et les navettes du Mont-Saint-Michel tout proche génèrent des trajets retour réguliers.",
  },
  {
    slug: "finistere", nom: "Finistère", code: "29", region: "Bretagne",
    contexte: "Du bout du monde aux grands festivals — Vieilles Charrues en tête, qui déplace des centaines de cars chaque été — le Finistère vit un transport de groupe rythmé par les événements et les liaisons maritimes de Brest et Roscoff.",
    villes: [{ nom: "Brest" }, { nom: "Quimper" }, { nom: "Concarneau" }, { nom: "Morlaix" }, { nom: "Carhaix" }],
    axesRetours: "Les rotations des festivals d'été et les liaisons vers Rennes et Nantes offrent des retours à vide saisonniers.",
  },
  {
    slug: "morbihan", nom: "Morbihan", code: "56", region: "Bretagne",
    contexte: "Entre le Festival Interceltique de Lorient, les embarquements vers Belle-Île et les alignements de Carnac, le Morbihan brasse des groupes touristiques d'avril à octobre — pendant que clubs et scolaires font vivre les autocaristes morbihannais à l'année.",
    villes: [{ nom: "Vannes" }, { nom: "Lorient" }, { nom: "Pontivy" }, { nom: "Auray" }, { nom: "Ploërmel" }],
    axesRetours: "Les flux estivaux vers les ports et plages créent des trajets retour fréquents vers Rennes et Nantes.",
  },
  /* ---------- Pays de la Loire ---------- */
  {
    slug: "loire-atlantique", nom: "Loire-Atlantique", code: "44", region: "Pays de la Loire",
    contexte: "Nantes, métropole créative en plein essor, et son littoral de La Baule à Pornic font de la Loire-Atlantique un marché de groupe complet : congrès, enterrements de vie de garçon, scolaires vers les Machines de l'île et supporters de la Beaujoire s'y partagent les autocars.",
    villes: [{ nom: "Nantes" }, { nom: "Saint-Nazaire" }, { nom: "La Baule" }, { nom: "Châteaubriant" }, { nom: "Pornic" }],
    axesRetours: "L'axe Nantes ↔ Paris et les flux littoraux estivaux produisent des retours à vide constants.",
  },
  {
    slug: "maine-et-loire", nom: "Maine-et-Loire", code: "49", region: "Pays de la Loire",
    contexte: "Angers et le Puy du Fou tout proche structurent le transport de groupe du Maine-et-Loire : le grand parc vendéen draine des cars de toute la France, tandis que vignobles de Loire et scolaires angevins entretiennent une activité locale dense.",
    villes: [{ nom: "Angers" }, { nom: "Cholet" }, { nom: "Saumur" }, { nom: "Segré" }],
    axesRetours: "Les rotations vers le Puy du Fou et les châteaux de la Loire créent d'excellentes opportunités de trajets retour.",
  },
  {
    slug: "sarthe", nom: "Sarthe", code: "72", region: "Pays de la Loire",
    contexte: "Les 24 Heures du Mans déplacent chaque année l'un des plus grands flux d'autocars d'Europe — un pic autour duquel les autocaristes sarthois organisent une saison faite de scolaires, d'entreprises et de liaisons vers Paris à moins d'une heure de TGV.",
    villes: [{ nom: "Le Mans" }, { nom: "La Flèche" }, { nom: "Sablé-sur-Sarthe" }, { nom: "Mamers" }],
    axesRetours: "Les grands week-ends du circuit génèrent des centaines de trajets retour vers toute la France.",
  },
  /* ---------- Nouvelle-Aquitaine ---------- */
  {
    slug: "gironde", nom: "Gironde", code: "33", region: "Nouvelle-Aquitaine",
    contexte: "Bordeaux et ses vignobles font de la Gironde une capitale mondiale de l'œnotourisme de groupe : circuits Médoc et Saint-Émilion, congrès, croisières fluviales et supporters du Matmut Atlantique mobilisent une flotte d'autocars considérable.",
    villes: [{ nom: "Bordeaux" }, { nom: "Mérignac" }, { nom: "Pessac" }, { nom: "Libourne" }, { nom: "Arcachon" }, { nom: "Saint-Émilion" }],
    axesRetours: "L'axe Bordeaux ↔ Paris et les circuits viticoles produisent des trajets retour quotidiens.",
  },
  {
    slug: "pyrenees-atlantiques", nom: "Pyrénées-Atlantiques", code: "64", region: "Nouvelle-Aquitaine",
    contexte: "Entre la côte basque qui attire séminaires et fêtes de Bayonne, les pèlerinages de Lourdes toute proche et les stations pyrénéennes, les Pyrénées-Atlantiques vivent un transport de groupe à trois saisons — balnéaire, spirituelle et neige.",
    villes: [{ nom: "Pau" }, { nom: "Bayonne" }, { nom: "Biarritz" }, { nom: "Anglet" }, { nom: "Saint-Jean-de-Luz" }],
    axesRetours: "Les flux de Lourdes et les liaisons côte basque ↔ Bordeaux offrent des retours à vide réguliers.",
  },
  {
    slug: "charente-maritime", nom: "Charente-Maritime", code: "17", region: "Nouvelle-Aquitaine",
    contexte: "La Rochelle, les îles de Ré et d'Oléron, les Francofolies et le Futuroscope voisin : la Charente-Maritime est une terre d'excursions de groupe où la saison estivale multiplie les rotations d'autocars entre gares, ports et sites.",
    villes: [{ nom: "La Rochelle" }, { nom: "Saintes" }, { nom: "Rochefort" }, { nom: "Royan" }],
    axesRetours: "Les flux estivaux vers les îles et le littoral créent des trajets retour fréquents vers Bordeaux et Poitiers.",
  },
  /* ---------- Occitanie ---------- */
  {
    slug: "haute-garonne", nom: "Haute-Garonne", code: "31", region: "Occitanie",
    contexte: "Toulouse, capitale européenne de l'aéronautique, génère un transport de groupe permanent — visites d'usines Airbus, congrès, étudiants de la première ville universitaire de province et supporters du Stadium — auquel s'ajoutent les liaisons vers les Pyrénées.",
    villes: [{ nom: "Toulouse" }, { nom: "Colomiers" }, { nom: "Blagnac" }, { nom: "Muret" }, { nom: "Saint-Gaudens" }],
    axesRetours: "Les liaisons vers les stations pyrénéennes l'hiver et l'axe Toulouse ↔ Bordeaux produisent des trajets retour constants.",
  },
  {
    slug: "herault", nom: "Hérault", code: "34", region: "Occitanie",
    contexte: "Montpellier l'étudiante et son littoral font de l'Hérault un marché de groupe jeune et festif — week-ends d'intégration, festivals, congrès médicaux — sur un axe méditerranéen très fréquenté entre Espagne et vallée du Rhône.",
    villes: [{ nom: "Montpellier" }, { nom: "Béziers" }, { nom: "Sète" }, { nom: "Agde" }, { nom: "Lunel" }],
    axesRetours: "L'arc méditerranéen Barcelone ↔ Marseille qui traverse le département regorge de trajets retour.",
  },
  {
    slug: "gard", nom: "Gard", code: "30", region: "Occitanie",
    contexte: "Des arènes de Nîmes au pont du Gard, le département vit du tourisme patrimonial de groupe — férias, scolaires et circuits provençaux — à la croisée des flux entre Méditerranée et vallée du Rhône.",
    villes: [{ nom: "Nîmes" }, { nom: "Alès" }, { nom: "Bagnols-sur-Cèze" }, { nom: "Beaucaire" }],
    axesRetours: "La position de carrefour entre Montpellier, Avignon et Marseille multiplie les opportunités de trajets retour.",
  },
  /* ---------- Grand Est ---------- */
  {
    slug: "bas-rhin", nom: "Bas-Rhin", code: "67", region: "Grand Est",
    contexte: "Strasbourg l'européenne cumule les visites institutionnelles (Parlement, Conseil de l'Europe), le marché de Noël qui draine des cars de tout le continent et les circuits de la route des vins — le Bas-Rhin est l'un des départements les plus « autocar » de France.",
    villes: [{ nom: "Strasbourg" }, { nom: "Haguenau" }, { nom: "Sélestat" }, { nom: "Obernai" }, { nom: "Saverne" }],
    axesRetours: "Le marché de Noël et les liaisons européennes créent des flux de trajets retour massifs en fin d'année.",
  },
  {
    slug: "marne", nom: "Marne", code: "51", region: "Grand Est",
    contexte: "Reims et Épernay font de la Marne la capitale mondiale de l'œnotourisme effervescent : les caves de champagne reçoivent des groupes toute l'année — CSE parisiens en tête, à moins de deux heures de route — aux côtés des scolaires et foires rémoises.",
    villes: [{ nom: "Reims" }, { nom: "Châlons-en-Champagne" }, { nom: "Épernay" }, { nom: "Vitry-le-François" }],
    axesRetours: "Les circuits champagne depuis Paris produisent des retours à vide hebdomadaires dans les deux sens.",
  },
  {
    slug: "moselle", nom: "Moselle", code: "57", region: "Grand Est",
    contexte: "Frontalière du Luxembourg et de l'Allemagne, la Moselle mêle navettes transfrontalières, marchés de Noël de Metz et déplacements de clubs — un marché où les autocaristes lorrains jouent sur trois pays.",
    villes: [{ nom: "Metz" }, { nom: "Thionville" }, { nom: "Forbach" }, { nom: "Sarreguemines" }],
    axesRetours: "Les flux transfrontaliers et l'axe Metz ↔ Paris offrent des trajets retour réguliers.",
  },
  /* ---------- Bourgogne-Franche-Comté ---------- */
  {
    slug: "cote-d-or", nom: "Côte-d'Or", code: "21", region: "Bourgogne-Franche-Comté",
    contexte: "Dijon et la route des grands crus font de la Côte-d'Or une étape obligée de l'œnotourisme de groupe — les Hospices de Beaune et les climats de Bourgogne classés à l'UNESCO drainent des autocars du monde entier, sur l'axe stratégique Paris ↔ Lyon.",
    villes: [{ nom: "Dijon" }, { nom: "Beaune" }, { nom: "Montbard" }, { nom: "Auxonne" }],
    axesRetours: "La position sur l'A6 entre Paris et Lyon garantit des trajets retour quasi quotidiens.",
  },
  {
    slug: "doubs", nom: "Doubs", code: "25", region: "Bourgogne-Franche-Comté",
    contexte: "Entre Besançon l'universitaire, la citadelle Vauban et la frontière suisse, le Doubs vit d'un transport de groupe frontalier et patrimonial — auquel s'ajoutent les stations du Haut-Doubs l'hiver.",
    villes: [{ nom: "Besançon" }, { nom: "Montbéliard" }, { nom: "Pontarlier" }],
    axesRetours: "Les liaisons vers la Suisse et les stations jurassiennes créent des trajets retour saisonniers.",
  },
  /* ---------- Hauts-de-France (complément) ---------- */
  {
    slug: "nord", nom: "Nord", code: "59", region: "Hauts-de-France",
    contexte: "Département le plus peuplé de France, le Nord vit un transport de groupe intense : braderie de Lille, supporters du LOSC et du RC Lens voisin, liaisons vers la Belgique et Londres — les autocaristes nordistes disposent de flottes parmi les plus importantes du pays.",
    villes: [{ nom: "Lille" }, { nom: "Roubaix" }, { nom: "Tourcoing" }, { nom: "Dunkerque" }, { nom: "Valenciennes" }, { nom: "Douai" }],
    axesRetours: "Les axes Lille ↔ Paris et les liaisons transfrontalières produisent des trajets retour quotidiens.",
  },
  /* ---------- Auvergne-Rhône-Alpes (complément) ---------- */
  {
    slug: "isere", nom: "Isère", code: "38", region: "Auvergne-Rhône-Alpes",
    contexte: "Grenoble, capitale des Alpes, orchestre les transferts neige de l'Oisans et de Chartreuse — l'Alpe d'Huez et Les Deux Alpes en tête — tandis que ses campus et laboratoires génèrent des déplacements scientifiques toute l'année.",
    villes: [{ nom: "Grenoble" }, { nom: "Vienne" }, { nom: "Bourgoin-Jallieu" }, { nom: "Voiron" }, { nom: "L'Alpe d'Huez" }],
    axesRetours: "Les rotations de stations produisent des centaines de trajets retour chaque semaine d'hiver.",
  },
  {
    slug: "haute-savoie", nom: "Haute-Savoie", code: "74", region: "Auvergne-Rhône-Alpes",
    contexte: "De Chamonix aux Portes du Soleil, la Haute-Savoie concentre les plus grands domaines skiables du monde : les transferts depuis Genève, Lyon et Paris y font tourner des flottes entières chaque hiver — et le lac d'Annecy prend le relais l'été.",
    villes: [{ nom: "Annecy" }, { nom: "Chamonix" }, { nom: "Thonon-les-Bains" }, { nom: "Annemasse" }, { nom: "Cluses" }],
    axesRetours: "Les samedis de sports d'hiver génèrent le plus grand flux de retours à vide de France entre stations et aéroports.",
  },
  /* ---------- PACA (complément) ---------- */
  {
    slug: "alpes-maritimes", nom: "Alpes-Maritimes", code: "06", region: "Provence-Alpes-Côte d'Azur",
    contexte: "Entre les congrès de Nice-Acropolis, le Festival de Cannes, le Grand Prix de Monaco voisin et les croisières de Villefranche, les Alpes-Maritimes vivent de l'événementiel international de groupe — un marché premium où la ponctualité et les avis vérifiés font la différence.",
    villes: [{ nom: "Nice" }, { nom: "Cannes" }, { nom: "Antibes" }, { nom: "Grasse" }, { nom: "Menton" }],
    axesRetours: "Les grands événements azuréens créent des pics de rotations avec de nombreux trajets retour vers Marseille et Lyon.",
  },
  {
    slug: "var", nom: "Var", code: "83", region: "Provence-Alpes-Côte d'Azur",
    contexte: "De Toulon la maritime aux plages de Saint-Tropez et aux vignobles de Provence, le Var conjugue transport militaire et événementiel estival — un littoral où les rotations de groupe explosent de juin à septembre.",
    villes: [{ nom: "Toulon" }, { nom: "Fréjus" }, { nom: "Draguignan" }, { nom: "Hyères" }, { nom: "Saint-Tropez" }],
    axesRetours: "Les flux estivaux du littoral offrent des trajets retour fréquents vers Marseille et Nice.",
  },
  /* ---------- Corse ---------- */
  {
    slug: "corse-du-sud", nom: "Corse-du-Sud", code: "2A", region: "Corse",
    contexte: "D'Ajaccio à Bonifacio, la Corse-du-Sud vit du tourisme de groupe débarqué des ferries et des croisières — circuits île de Beauté, scolaires insulaires et navettes d'aéroport rythment la saison.",
    villes: [{ nom: "Ajaccio" }, { nom: "Porto-Vecchio" }, { nom: "Bonifacio" }, { nom: "Propriano" }],
    axesRetours: "Les rotations entre ports, aéroports et sites touristiques créent des trajets retour tout l'été.",
  },
  {
    slug: "haute-corse", nom: "Haute-Corse", code: "2B", region: "Corse",
    contexte: "Bastia, porte d'entrée maritime de l'île, et les circuits du Cap Corse à la Balagne font de la Haute-Corse un territoire d'excursions en autocar — sur des routes où l'expérience locale des transporteurs insulaires est irremplaçable.",
    villes: [{ nom: "Bastia" }, { nom: "Calvi" }, { nom: "Corte" }, { nom: "L'Île-Rousse" }],
    axesRetours: "Les liaisons ferry de Bastia et les circuits touristiques offrent des trajets retour saisonniers.",
  },
  /* ---------- Centre-Val de Loire (complément) ---------- */
  {
    slug: "indre-et-loire", nom: "Indre-et-Loire", code: "37", region: "Centre-Val de Loire",
    contexte: "Tours et les châteaux de la Loire — Chenonceau, Amboise, Villandry — font de l'Indre-et-Loire l'épicentre du tourisme patrimonial de groupe français : les circuits châteaux y mobilisent des autocars du monde entier de mars à novembre.",
    villes: [{ nom: "Tours" }, { nom: "Amboise" }, { nom: "Chinon" }, { nom: "Loches" }],
    axesRetours: "Les circuits châteaux depuis Paris produisent des retours à vide réguliers en saison.",
  },
  {
    slug: "loiret", nom: "Loiret", code: "45", region: "Centre-Val de Loire",
    contexte: "Orléans et sa position de carrefour autoroutier au sud de Paris font du Loiret un territoire de passage et de logistique — fêtes johanniques, scolaires et zones d'activités entretiennent une demande de groupe régulière.",
    villes: [{ nom: "Orléans" }, { nom: "Montargis" }, { nom: "Gien" }, { nom: "Pithiviers" }],
    axesRetours: "La convergence des axes A10, A71 et A77 garantit des trajets retour dans toutes les directions.",
  },
];

export function getDepartement(slug: string): Departement | undefined {
  return DEPARTEMENTS.find((d) => d.slug === slug);
}

export function departementDeVille(villeSlug: string): Departement | undefined {
  return DEPARTEMENTS.find((d) => d.villes.some((v) => v.slug === villeSlug));
}