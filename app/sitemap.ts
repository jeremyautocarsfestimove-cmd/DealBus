import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://dealbus.fr";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/location-autocar`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/reserver-un-bus`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/comparateur-devis-autocar`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/retours`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/demande`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pro`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
