// Pages régions — sommet de la pyramide géographique.
// footer → régions → départements → villes.

import { DEPARTEMENTS, type Departement } from "@/lib/departements";

export type Region = {
  slug: string;
  nom: string;
  dans: string;
  contexte: string;
  axesRetours: string;
};

export const REGIONS: Region[] = [
  {
    slug: "ile-de-france", nom: "Île-de-France", dans: "en Île-de-France",
    contexte: "Premier bassin de transport de groupe de France, l'Île-de-France concentre tout : les CSE et sièges sociaux de l'ouest parisien, Disneyland et ses rotations quotidiennes, le Stade de France et les salons de Villepinte, les campus de Saclay et de Cergy. Des centaines d'autocaristes s'y disputent le marché — la mise en concurrence y produit les écarts de prix les plus spectaculaires du pays.",
    axesRetours: "Tous les grands axes de retours à vide convergent vers la région capitale : Normandie par l'A13, stations alpines l'hiver, métropoles régionales toute l'année.",
  },
  {
    slug: "normandie", nom: "Normandie", dans: "en Normandie",
    contexte: "Terre d'autocaristes familiaux aux tarifs parmi les plus compétitifs de France, la Normandie vit du tourisme de groupe : croisiéristes du Havre, plages du Débarquement, Mont-Saint-Michel, Giverny et Étretat drainent des flux mondiaux — pendant que scolaires, clubs et comités des fêtes font tourner les cars toute l'année dans les cinq départements.",
    axesRetours: "L'axe Normandie ↔ Paris est le plus riche en retours à vide du pays, renforcé en saison par les navettes touristiques des grands sites.",
  },
  {
    slug: "centre-val-de-loire", nom: "Centre-Val de Loire", dans: "en Centre-Val de Loire",
    contexte: "Entre les châteaux de la Loire qui aimantent les groupes du monde entier, les pèlerinages de Chartres et les zones logistiques de la Beauce, le Centre-Val de Loire mêle tourisme patrimonial et déplacements du quotidien — sur des routes où transporteurs locaux et franciliens se croisent au bénéfice des prix.",
    axesRetours: "Les circuits des châteaux et les liaisons vers Paris créent des trajets retour réguliers, particulièrement d'avril à octobre.",
  },
  {
    slug: "hauts-de-france", nom: "Hauts-de-France", dans: "dans les Hauts-de-France",
    contexte: "Porte du nord de l'Europe, la région cumule les sorties vers le Parc Astérix et Chantilly, les liaisons transmanche vers Londres et Bruxelles, et l'aéroport de Beauvais qui génère des transferts de groupes quotidiens — un carrefour où la densité de transporteurs joue pour les clients.",
    axesRetours: "Les dessertes de Beauvais-Tillé et les liaisons vers la Belgique et l'Angleterre alimentent un flux permanent de trajets retour.",
  },
  {
    slug: "auvergne-rhone-alpes", nom: "Auvergne-Rhône-Alpes", dans: "en Auvergne-Rhône-Alpes",
    contexte: "Deuxième région économique de France et porte des Alpes, elle vit au rythme des congrès lyonnais et surtout des transferts neige : de décembre à avril, des centaines d'autocars montent et descendent des stations chaque semaine — une saisonnalité qui crée les meilleures opportunités de retours à vide du pays.",
    axesRetours: "Les rotations vers les stations alpines produisent chaque hiver des centaines de trajets retour à prix cassé, dans les deux sens.",
  },
  {
    slug: "provence-alpes-cote-d-azur", nom: "Provence-Alpes-Côte d'Azur", dans: "en Provence-Alpes-Côte d'Azur",
    contexte: "Premier port de croisière de France à Marseille, festivals d'Avignon et d'Aix, congrès azuréens : la région PACA brasse des flux de groupe massifs et internationaux — sur un marché méridional où comparer plusieurs offres fermes reste le levier de prix le plus efficace.",
    axesRetours: "L'axe Marseille → Paris est la référence nationale des retours à vide ; la côte génère aussi ses propres rotations événementielles.",
  },
{
    slug: "bretagne", nom: "Bretagne", dans: "en Bretagne",
    contexte: "Terre de festivals (Vieilles Charrues, Interceltique, Trans Musicales) qui déplacent chaque année des milliers de cars, la Bretagne conjugue tourisme littoral, vie étudiante rennaise et un maillage d'autocaristes de proximité présents jusqu'au bout du Finistère.",
    axesRetours: "Les grands festivals d'été et l'axe Rennes ↔ Paris produisent des flux de trajets retour massifs et saisonniers.",
  },
  {
    slug: "pays-de-la-loire", nom: "Pays de la Loire", dans: "dans les Pays de la Loire",
    contexte: "Du Puy du Fou — premier générateur de cars touristiques de l'Ouest — aux 24 Heures du Mans et à la métropole nantaise, les Pays de la Loire vivent de l'événementiel de groupe à très grande échelle, avec un littoral qui prend le relais l'été.",
    axesRetours: "Les rotations du Puy du Fou et du circuit manceau créent des opportunités de trajets retour dans toute la moitié ouest.",
  },
  {
    slug: "nouvelle-aquitaine", nom: "Nouvelle-Aquitaine", dans: "en Nouvelle-Aquitaine",
    contexte: "Plus vaste région de France, la Nouvelle-Aquitaine étire son transport de groupe de l'œnotourisme bordelais aux pèlerinages de Lourdes voisins, en passant par le littoral charentais et basque — des marchés très différents que la mise en concurrence unifie au bénéfice des prix.",
    axesRetours: "L'axe Bordeaux ↔ Paris et les flux du littoral atlantique offrent des trajets retour quotidiens.",
  },
  {
    slug: "occitanie", nom: "Occitanie", dans: "en Occitanie",
    contexte: "De l'aéronautique toulousaine aux plages méditerranéennes et aux stations pyrénéennes, l'Occitanie cumule trois saisons de transport de groupe — affaires, balnéaire et neige — sur l'arc très fréquenté entre Espagne et vallée du Rhône.",
    axesRetours: "L'arc méditerranéen et les liaisons pyrénéennes regorgent de trajets retour toute l'année.",
  },
  {
    slug: "grand-est", nom: "Grand Est", dans: "dans le Grand Est",
    contexte: "Strasbourg l'européenne et son marché de Noël continental, les caves de champagne de Reims et d'Épernay, les flux transfrontaliers vers l'Allemagne, la Belgique et le Luxembourg : le Grand Est est l'une des régions les plus « autocar » d'Europe.",
    axesRetours: "Les marchés de Noël et les circuits champagne créent des flux de trajets retour massifs, surtout en fin d'année.",
  },
  {
    slug: "bourgogne-franche-comte", nom: "Bourgogne-Franche-Comté", dans: "en Bourgogne-Franche-Comté",
    contexte: "Traversée par l'axe majeur Paris ↔ Lyon, la région conjugue œnotourisme des climats de Bourgogne, patrimoine bisontin et liaisons vers la Suisse — une terre de passage où les trajets retour sont une aubaine permanente.",
    axesRetours: "La position sur l'A6 garantit des retours à vide quasi quotidiens entre Paris, Dijon et Lyon.",
  },
  {
    slug: "corse", nom: "Corse", dans: "en Corse",
    contexte: "Île du tourisme de groupe par excellence, la Corse vit au rythme des ferries et des croisières : circuits de l'île de Beauté, navettes ports-aéroports et scolaires insulaires font travailler des transporteurs à l'expérience locale irremplaçable.",
    axesRetours: "Les rotations entre ports, aéroports et sites touristiques offrent des trajets retour tout au long de la saison.",
  },
];

export function getRegion(slug: string): Region | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

export function departementsDeRegion(nomRegion: string): Departement[] {
  return DEPARTEMENTS.filter((d) => d.region === nomRegion);
}