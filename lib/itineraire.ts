// Calcul d'itinéraire routier — sans clé API :
// géocodage BAN (France) avec repli Photon (international),
// routage OSRM (serveur public du projet OpenStreetMap).

type Coords = [number, number]; // [lon, lat]

async function geocode(adresse: string): Promise<Coords | null> {
  try {
    const r = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresse)}&limit=1`,
      { next: { revalidate: 86400 } }
    );
    const data = await r.json();
    const c = data.features?.[0]?.geometry?.coordinates;
    if (c) return [c[0], c[1]];
  } catch { /* repli */ }
  try {
    const r = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(adresse)}&limit=1`,
      { next: { revalidate: 86400 } }
    );
    const data = await r.json();
    const c = data.features?.[0]?.geometry?.coordinates;
    if (c) return [c[0], c[1]];
  } catch { /* échec total */ }
  return null;
}

export type Itineraire = {
  km: number;                     // aller simple, arrondi
  geometry: Coords[];             // tracé GeoJSON [lon,lat][]
};

export async function calcItineraire(depart: string, arrivee: string): Promise<Itineraire | null> {
  const [a, b] = await Promise.all([geocode(depart), geocode(arrivee)]);
  if (!a || !b) return null;
  try {
    const r = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson`,
      { next: { revalidate: 86400 } }
    );
    const data = await r.json();
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      km: Math.round(route.distance / 1000),
      geometry: route.geometry.coordinates as Coords[],
    };
  } catch {
    return null;
  }
}

// Temps de conduite à 80 km/h de moyenne → "6 h 24"
export function dureeA80(km: number): string {
  const minutes = Math.round((km / 80) * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h} h${m > 0 ? ` ${String(m).padStart(2, "0")}` : ""}`;
}
