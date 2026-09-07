import type { MetadataRoute } from "next";
import { VILLES } from "@/lib/villes";
import { DEPARTEMENTS } from "@/lib/departements";
import { REGIONS } from "@/lib/regions";
import { TRAJETS } from "@/lib/trajets";

// IMPORTANT : ne jamais utiliser new Date() pour les pages éditoriales.
// À chaque déploiement, toutes les URLs se déclareraient modifiées ; Google
// finit par considérer le lastmod du site comme non fiable et l'ignore.
// On met à jour cette constante à la main quand le contenu des gabarits
// ou des données géographiques change réellement.
const MAJ_CONTENU = new Date("2026-09-07T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://dealbus.fr";
  const maintenant = new Date();

  return [
    // Pages dont le contenu bouge réellement tous les jours
    { url: base, lastModified: maintenant, changeFrequency: "daily", priority: 1 },
    { url: `${base}/retours`, lastModified: maintenant, changeFrequency: "daily", priority: 0.8 },

    // Pages éditoriales : lastmod figé sur la dernière vraie mise à jour
    { url: `${base}/location-autocar`, lastModified: MAJ_CONTENU, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/reserver-un-bus`, lastModified: MAJ_CONTENU, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/comparateur-devis-autocar`, lastModified: MAJ_CONTENU, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/reglementation`, lastModified: MAJ_CONTENU, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/demande`, lastModified: MAJ_CONTENU, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pro`, lastModified: MAJ_CONTENU, changeFrequency: "monthly", priority: 0.7 },

    ...REGIONS.map((r) => ({
      url: `${base}/location-autocar/${r.slug}`,
      lastModified: MAJ_CONTENU,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...DEPARTEMENTS.map((d) => ({
      url: `${base}/location-autocar/${d.slug}`,
      lastModified: MAJ_CONTENU,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...VILLES.map((v) => ({
      url: `${base}/location-autocar/${v.slug}`,
      lastModified: MAJ_CONTENU,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...TRAJETS.map((t) => ({
      url: `${base}/location-autocar/trajet/${t.slug}`,
      lastModified: MAJ_CONTENU,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),

    { url: `${base}/cgu`, lastModified: MAJ_CONTENU, changeFrequency: "yearly", priority: 0.2 },
  ];
}
