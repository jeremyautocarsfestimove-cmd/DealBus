// Calcul d'itinéraire routier — sans clé API :
// géocodage BAN (France) avec repli Photon (international),
// routage OSRM (serveur public du projet OpenStreetMap).

type Coords = [number, number]; // [lon, lat]

// Le problème des destinations à l'étranger : la BAN (France uniquement) répond
// TOUJOURS quelque chose, même pour « Londres, Royaume-Uni » (rue de Londres à
// Paris…). On interroge donc BAN et Photon en parallèle : si la BAN n'est pas
// sûre d'elle (score < 0,7) ou si Photon situe l'adresse hors de France, on
// prend Photon.
async function geocode(adresse: string): Promise<Coords | null> {
  const [ban, photon] = await Promise.all([
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresse)}&limit=1`, { next: { revalidate: 86400 } })
      .then((r) => r.json())
      .then((d) => {
        const f = d.features?.[0];
        return f?.geometry?.coordinates ? { c: [f.geometry.coordinates[0], f.geometry.coordinates[1]] as Coords, score: Number(f.properties?.score ?? 0) } : null;
      })
      .catch(() => null),
    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(adresse)}&limit=1&lang=fr`, { next: { revalidate: 86400 } })
      .then((r) => r.json())
      .then((d) => {
        const f = d.features?.[0];
        return f?.geometry?.coordinates ? { c: [f.geometry.coordinates[0], f.geometry.coordinates[1]] as Coords, fr: f.properties?.countrycode === "FR" } : null;
      })
      .catch(() => null),
  ]);

  if (photon && !photon.fr) return photon.c;            // hors de France : Photon fait foi
  if (ban && ban.score >= 0.7) return ban.c;            // France, adresse sûre
  if (photon) return photon.c;                          // France mais BAN hésitante (lieu, monument…)
  return ban?.c ?? null;
}

export type Itineraire = {
  km: number;                     // aller simple, arrondi
  minutes: number;                // durée de route OSRM × facteur autocar, hors pauses
  geometry: Coords[];             // tracé GeoJSON [lon,lat][]
};

// OSRM calcule pour une voiture : un autocar roule moins vite (110 km/h max sur
// autoroute, montées, agglomérations) → +20 % sur la durée.
export const FACTEUR_AUTOCAR = 1.2;

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
      minutes: Math.round((route.duration / 60) * FACTEUR_AUTOCAR),
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
