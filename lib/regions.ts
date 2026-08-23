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
];

export function getRegion(slug: string): Region | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

export function departementsDeRegion(nomRegion: string): Departement[] {
  return DEPARTEMENTS.filter((d) => d.region === nomRegion);
}
