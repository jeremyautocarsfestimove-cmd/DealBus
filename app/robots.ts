import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/mes-demandes", "/pro/leads", "/pro/missions"],
      },
    ],
    sitemap: "https://dealbus.fr/sitemap.xml",
  };
}
