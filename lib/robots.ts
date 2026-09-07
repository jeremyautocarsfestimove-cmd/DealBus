import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Barres obliques finales : "/admin" seul bloque aussi une éventuelle
        // page publique commençant par ces caractères. On cible les répertoires.
        disallow: [
          "/admin/",
          "/api/",
          "/mes-demandes/",
          "/pro/leads",
          "/pro/missions",
          "/login",
        ],
      },
    ],
    sitemap: "https://dealbus.fr/sitemap.xml",
    host: "https://dealbus.fr",
  };
}
